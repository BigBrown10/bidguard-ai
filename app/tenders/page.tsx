"use client"

import { useState, useEffect, useMemo } from "react"
import { MOCK_TENDERS, Tender } from "@/lib/mock-tenders"
import { TenderCard } from "@/components/TenderCard"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { saveTenderAction, rejectTenderAction } from "./actions"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw, Filter, ChevronDown, Bookmark, Sparkles, User, LayoutGrid, List } from "lucide-react"
import { Toaster, toast } from "sonner"

import { TenderDetailsModal } from "@/components/TenderDetailsModal"
import { IdeaInjectionModal } from "@/components/IdeaInjectionModal"
import { CompanyDetailsGate } from "@/components/CompanyDetailsGate"
import { QualificationModal } from "@/components/QualificationModal"
import { qualifyTender, QualificationResult } from "@/app/tenders/qualify"

export default function TendersPage() {
    const router = useRouter()
    const [allTenders, setAllTenders] = useState<Tender[]>([])
    const [tenders, setTenders] = useState<Tender[]>([])
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState("all")
    const [priceFilter, setPriceFilter] = useState("all")
    const [filterOpen, setFilterOpen] = useState<boolean | string>(false)
    const [expandedFilters, setExpandedFilters] = useState(false)

    // V3: Modal states
    const [ideaModalOpen, setIdeaModalOpen] = useState(false)
    const [qualificationModalOpen, setQualificationModalOpen] = useState(false)
    const [qualificationResult, setQualificationResult] = useState<QualificationResult | null>(null)
    const [isQualifying, setIsQualifying] = useState(false)
    const [pendingTender, setPendingTender] = useState<Tender | null>(null)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [profileComplete, setProfileComplete] = useState(false)

    // Swipe history for undo functionality
    const [swipeHistory, setSwipeHistory] = useState<Tender[]>([])

    // View mode: 'single' (swipe), 'card' (grid), 'list' (rows)
    const [viewMode, setViewMode] = useState<'single' | 'card' | 'list'>('single')

    // Industry filters with predefined common sectors + dynamically extracted
    const sectorFilters = useMemo(() => {
        // Predefined major industries
        const majorIndustries = [
            { id: "all", label: "All Sectors" },
            { id: "healthcare", label: "Healthcare" },
            { id: "construction", label: "Construction" },
            { id: "it", label: "IT & Digital" },
            { id: "education", label: "Education" },
            { id: "transport", label: "Transport" },
            { id: "defence", label: "Defence" },
            { id: "energy", label: "Energy" },
        ]

        // Also add any unique sectors from loaded tenders not already in the list
        const dynamicSectors = new Set(allTenders.map(t => t.sector?.toLowerCase()).filter(Boolean))
        const existingIds = new Set(majorIndustries.map(f => f.id.toLowerCase()))

        dynamicSectors.forEach(sector => {
            if (!existingIds.has(sector)) {
                majorIndustries.push({ id: sector, label: sector.charAt(0).toUpperCase() + sector.slice(1) })
            }
        })

        return majorIndustries
    }, [allTenders])

    // Helper to parse value string to number (max value if range)
    const parseValue = (valStr: string): number => {
        if (!valStr) return 0
        // Remove currency symbols, commas, and handle ranges like "£1m - £5m"
        // If range, take the higher number
        const clean = valStr.replace(/[£,]/g, '').toLowerCase()

        // Handle "5m" or "500k"
        const parseNum = (s: string) => {
            if (s.includes('m')) return parseFloat(s) * 1000000
            if (s.includes('k')) return parseFloat(s) * 1000
            return parseFloat(s)
        }

        if (clean.includes('-')) {
            const parts = clean.split('-').map(p => parseNum(p.trim()))
            return Math.max(...parts.filter(n => !isNaN(n)))
        }

        return parseNum(clean) || 0
    }

    // Load User ID & Tenders on mount
    useEffect(() => {
        const init = async () => {
            // 1. Auth check
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)

                    // Check if company details are filled
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('company_name, business_description')
                        .eq('id', user.id)
                        .single()

                    // Only show onboarding if company_name is missing or empty
                    if (!profile?.company_name || profile.company_name.trim() === '' || !profile?.business_description) {
                        setShowOnboarding(true)
                        setProfileComplete(false)
                    } else {
                        setProfileComplete(true)
                    }
                }
            }

            // 2. Data Fetch (Live or Mock fallback)
            try {
                const data = await import("./actions").then(mod => mod.fetchTendersAction())
                setAllTenders(data)
                setTenders(data)
            } catch (err) {
                console.error("Failed to load tenders", err)
                setAllTenders(MOCK_TENDERS)
                setTenders(MOCK_TENDERS)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    // Filter tenders by industry AND price
    useEffect(() => {
        let filtered = allTenders

        // Industry keywords mapping for smarter filtering
        const industryKeywords: Record<string, string[]> = {
            healthcare: ['nhs', 'health', 'hospital', 'clinical', 'medical', 'care', 'nursing', 'pharmacy', 'patient', 'gp'],
            construction: ['construction', 'building', 'civil', 'architect', 'contractor', 'renovation', 'infrastructure', 'demolition'],
            it: ['software', 'digital', 'technology', 'cyber', 'data', 'cloud', 'system', 'network', 'database', 'api'],
            education: ['education', 'school', 'university', 'college', 'training', 'academy', 'student', 'learning', 'teaching'],
            transport: ['transport', 'logistics', 'vehicle', 'fleet', 'bus', 'rail', 'highway', 'road', 'traffic'],
            defence: ['defence', 'defense', 'mod', 'military', 'security', 'armed', 'forces'],
            energy: ['energy', 'electricity', 'renewable', 'solar', 'power', 'utility', 'gas', 'wind', 'nuclear'],
        }

        // Helper function to count keyword matches for a tender in a category
        const countKeywordMatches = (tender: Tender, category: string): number => {
            const keywords = industryKeywords[category] || []
            const searchText = `${tender.title || ''} ${tender.description || ''}`.toLowerCase()
            return keywords.filter(kw => searchText.includes(kw.toLowerCase())).length
        }

        // 1. Industry Filter - weighted matching (tender must have MORE matches for selected category than others)
        if (activeFilter !== "all") {
            filtered = filtered.filter(tender => {
                const selectedCategoryScore = countKeywordMatches(tender, activeFilter)

                // Must have at least 1 match for the selected category
                if (selectedCategoryScore === 0) return false

                // Check if any OTHER category has more matches (if so, exclude this tender)
                const allCategories = Object.keys(industryKeywords)
                for (const category of allCategories) {
                    if (category !== activeFilter) {
                        const otherScore = countKeywordMatches(tender, category)
                        // If another category has MORE matches, this tender belongs there instead
                        if (otherScore > selectedCategoryScore) return false
                    }
                }
                return true
            })
        }

        // 2. Price Filter
        if (priceFilter !== "all") {
            filtered = filtered.filter(t => {
                const val = parseValue(t.value)
                if (priceFilter === "low") return val > 0 && val <= 100000 // 0 - 100k
                if (priceFilter === "mid") return val > 100000 && val <= 1000000 // 100k - 1m
                if (priceFilter === "high") return val > 1000000 // > 1m
                return true
            })
        }

        setTenders(filtered)
    }, [activeFilter, priceFilter, allTenders])

    const handleSwipe = async (direction: "left" | "right" | "watchlist", index: number) => {
        const swipedTender = tenders[index]
        const newTenders = [...tenders]
        newTenders.pop()
        setTenders(newTenders)
        setAllTenders(prev => prev.filter(t => t.id !== swipedTender.id))

        // Track swipe history for undo - ONLY for passed (left) and watchlist, NOT for bids
        // Bids start a proposal and should not be undoable
        if (direction !== "right") {
            setSwipeHistory(prev => [swipedTender, ...prev].slice(0, 10))
        }

        if (direction === "right") {
            if (!userId) {
                window.location.href = '/register'
                return
            }

            // BLOCK BID if profile not complete
            if (!profileComplete) {
                toast.error("Complete your profile first", {
                    description: "We need your company details to generate winning bids."
                })
                setShowOnboarding(true)
                // Re-add tender to stack
                setTenders(prev => [...prev, swipedTender])
                setAllTenders(prev => [...prev, swipedTender])
                return
            }

            // V3: Run Advisory Agent checks first
            setPendingTender(swipedTender)

            // BYPASS Qualification Modal (Bid/No Bid) for now
            // setQualificationModalOpen(true)
            // setIsQualifying(true)
            // setQualificationResult(null)
            // qualifyTender(...)

            // Direct to Proposal Generation
            setIdeaModalOpen(true)

        } else if (direction === "watchlist") {
            if (!userId) {
                window.location.href = '/register'
                return
            }
            // Save to watchlist
            saveTenderAction(swipedTender, userId).then(() => {
                toast.success("Added to Watchlist", {
                    description: "View in My Tenders"
                })
            }).catch(err => console.error("Save failed", err))

        } else {
            if (userId) {
                rejectTenderAction(swipedTender, userId).catch(err => console.error("Reject failed", err))
            }
        }
    }

    // V3: Handle autonomous proposal generation
    const handleStartProposal = async (ideas: string) => {
        if (!pendingTender || !userId) return

        setIdeaModalOpen(false)

        // Save tender to favourites
        await saveTenderAction(pendingTender, userId)

        // Start autonomous proposal generation via Inngest
        toast.promise(async () => {
            const response = await fetch('/api/proposals/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenderId: pendingTender.id,
                    tenderTitle: pendingTender.title,
                    tenderBuyer: pendingTender.buyer,
                    ideaInjection: ideas
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('[Proposal] API Error:', response.status, errorData)
                throw new Error(errorData.error || `Failed to start proposal (${response.status})`)
            }
            return response.json()
        }, {
            loading: 'Queuing autonomous proposal...',
            success: (data) => {
                return {
                    message: 'Superagent is preparing your Bid!',
                    description: 'Track progress in My Tenders',
                    action: {
                        label: 'View My Tenders',
                        onClick: () => router.push('/favourites')
                    }
                }
            },
            error: (err) => err.message || 'Failed to start proposal'
        })

        setPendingTender(null)
    }

    const handleSkipIdeas = () => {
        handleStartProposal("")
    }

    // Listen for BID button clicks from TenderDetailsModal
    useEffect(() => {
        const handleBidEvent = (e: CustomEvent<Tender>) => {
            if (!userId) {
                window.location.href = '/register'
                return
            }
            setPendingTender(e.detail)
            setIdeaModalOpen(true)
        }

        window.addEventListener('bidTender', handleBidEvent as EventListener)
        return () => window.removeEventListener('bidTender', handleBidEvent as EventListener)
    }, [userId])

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            <Toaster position="top-right" theme="dark" richColors />

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                        Marketplace <span className="text-primary text-glow">Feed</span>
                    </h1>

                    {/* Filters - Collapsible Grid */}
                    <div className="w-full max-w-md mb-6 relative z-50">
                        {/* Header / Toggle */}
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                                Filtering by {activeFilter === 'all' ? 'All Sectors' : activeFilter}
                            </span>
                            <div className="flex items-center gap-2">
                                {/* View Mode Toggle */}
                                <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setViewMode('single')}
                                        className={`p-1.5 rounded ${viewMode === 'single' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                                        title="Single View"
                                    >
                                        <User className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('card')}
                                        className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                                        title="Card View"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                                        title="List View"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setExpandedFilters(!expandedFilters)}
                                    className="text-[10px] text-primary hover:text-white uppercase font-bold tracking-wider flex items-center gap-1 transition-colors"
                                >
                                    {expandedFilters ? 'Collapse' : 'View All'}
                                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <motion.div
                            layout
                            className={`w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 transition-all ${expandedFilters ? 'overflow-visible' : 'overflow-hidden'
                                }`}
                        >
                            <div className={`flex gap-2 ${expandedFilters ? 'flex-wrap justify-center' : 'overflow-x-auto no-scrollbar'}`}>

                                {/* Sector Group */}
                                <div className={`flex ${expandedFilters ? 'flex-wrap justify-center gap-2' : 'flex-nowrap gap-2'} items-center`}>
                                    {/* Label only visible in collapsed scroll to save space in grid */}
                                    {!expandedFilters && <span className="px-2 text-[10px] text-white/30 uppercase font-bold whitespace-nowrap">Sector</span>}

                                    {sectorFilters.map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setActiveFilter(filter.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${activeFilter === filter.id
                                                ? 'bg-primary border-primary text-black shadow-[0_0_10px_rgba(255,0,60,0.5)]'
                                                : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {filter.label.replace('All Sectors', 'All')}
                                        </button>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="w-px bg-white/10 mx-1 h-6 shrink-0" />

                                {/* Value Group */}
                                <div className={`flex ${expandedFilters ? 'flex-wrap justify-center gap-2' : 'flex-nowrap gap-2'} items-center`}>
                                    {!expandedFilters && <span className="px-2 text-[10px] text-white/30 uppercase font-bold whitespace-nowrap">Value</span>}
                                    {[
                                        { id: 'all', label: 'Any' },
                                        { id: 'low', label: '<100k' },
                                        { id: 'mid', label: '100k-1m' },
                                        { id: 'high', label: '>1m' },
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setPriceFilter(filter.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${priceFilter === filter.id
                                                ? 'bg-secondary border-secondary text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                                                : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <p className="text-white/40 text-sm tracking-widest uppercase mt-3">
                        {tenders.length} Active Opportunities
                    </p>
                </div>

                {/* View Mode: Single (Swipe) */}
                {viewMode === 'single' && (
                    <div className="relative w-full max-w-md h-[600px]">
                        <AnimatePresence>
                            {tenders.length > 0 ? (
                                tenders.map((tender, index) => (
                                    <TenderCard
                                        key={tender.id}
                                        tender={tender}
                                        index={tenders.length - 1 - index}
                                        onSwipe={(dir) => handleSwipe(dir, index)}
                                        onInfo={() => setSelectedTender(tender)}
                                    />
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-white/50 space-y-4"
                                >
                                    <RefreshCw className="w-12 h-12 mb-4 animate-spin-slow opacity-20" />
                                    <p>No more opportunities in this region.</p>
                                    <button
                                        onClick={() => setTenders(MOCK_TENDERS)}
                                        className="cyber-button px-6 py-2 text-sm"
                                    >
                                        Refresh Feed
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* View Mode: Card Grid */}
                {viewMode === 'card' && (
                    <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto px-2">
                        {tenders.map((tender) => (
                            <motion.div
                                key={tender.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
                                onClick={() => setSelectedTender(tender)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs text-primary font-medium">{tender.sector}</span>
                                    <span className="text-xs text-white/40">{tender.deadline}</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{tender.title}</h3>
                                <p className="text-xs text-white/50 mb-3 line-clamp-2">{tender.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-secondary font-bold">{tender.value}</span>
                                    <span className="text-xs text-white/30">{tender.buyer}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* View Mode: List */}
                {viewMode === 'list' && (
                    <div className="w-full max-w-4xl space-y-2 max-h-[70vh] overflow-y-auto px-2">
                        {tenders.map((tender) => (
                            <motion.div
                                key={tender.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-lg p-4 hover:border-white/20 transition-all cursor-pointer"
                                onClick={() => setSelectedTender(tender)}
                            >
                                <div className="flex-shrink-0 w-2 h-12 rounded-full bg-primary/50" />
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-primary font-medium">{tender.sector}</span>
                                        <span className="text-xs text-white/30">•</span>
                                        <span className="text-xs text-white/30">{tender.buyer}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white truncate">{tender.title}</h3>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-sm text-secondary font-bold">{tender.value}</p>
                                    <p className="text-xs text-white/40">{tender.deadline}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}



                {/* Controls - BOLD */}
                <div className="mt-8 flex gap-6 items-center text-white text-sm font-black uppercase tracking-widest relative z-50">
                    {/* UNDO Button */}
                    <button
                        onClick={() => {
                            if (swipeHistory.length > 0) {
                                const [lastTender, ...rest] = swipeHistory
                                setSwipeHistory(rest)
                                setTenders(prev => [...prev, lastTender])
                                setAllTenders(prev => [...prev, lastTender])
                            }
                        }}
                        disabled={swipeHistory.length === 0}
                        className={`flex flex-col items-center gap-2 group cursor-pointer transition-all ${swipeHistory.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-white/20 group-hover:border-amber-400 group-hover:scale-110 group-active:scale-95 transition-all flex items-center justify-center text-white/40 group-hover:text-amber-400 backdrop-blur-sm bg-black/60">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </div>
                        <span className="text-white/40 group-hover:text-amber-400 text-[10px]">Undo</span>
                    </button>

                    <button
                        onClick={() => tenders.length > 0 && handleSwipe("left", tenders.length - 1)}
                        className="flex flex-col items-center gap-2 group cursor-pointer transition-colors"
                    >
                        <div className="w-14 h-14 rounded-full border-2 border-white/30 group-hover:border-red-500 group-hover:scale-110 group-active:scale-95 transition-all flex items-center justify-center text-white/60 group-hover:text-red-500 text-xl backdrop-blur-sm bg-black/60">✕</div>
                        <span className="text-white/60 group-hover:text-red-400">Pass</span>
                    </button>

                    <button
                        onClick={() => tenders.length > 0 && handleSwipe("watchlist", tenders.length - 1)}
                        className="flex flex-col items-center gap-2 group cursor-pointer transition-colors translate-y-2"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-white/30 group-hover:border-secondary group-hover:scale-110 group-active:scale-95 transition-all flex items-center justify-center text-white/60 group-hover:text-secondary text-lg backdrop-blur-sm bg-black/60">
                            <Bookmark className="w-5 h-5" />
                        </div>
                        <span className="text-white/60 group-hover:text-secondary">Watch</span>
                    </button>

                    <button
                        onClick={() => tenders.length > 0 && handleSwipe("right", tenders.length - 1)}
                        className="flex flex-col items-center gap-2 group cursor-pointer transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-primary group-hover:border-primary group-hover:scale-110 group-active:scale-95 transition-all flex items-center justify-center text-primary text-2xl backdrop-blur-sm bg-black/60 shadow-lg shadow-primary/30">♥</div>
                        <span className="text-primary">BID</span>
                    </button>
                </div>

            </main >

            {/* V3: Modals */}
            <IdeaInjectionModal
                isOpen={ideaModalOpen}
                tenderTitle={pendingTender?.title || ""}
                onSubmit={handleStartProposal}
                onSkip={handleSkipIdeas}
                onClose={() => {
                    setIdeaModalOpen(false)
                    // Keep pendingTender if we go back? No, clear it
                    setPendingTender(null)
                }}
            />

            <QualificationModal
                isOpen={qualificationModalOpen}
                isLoading={isQualifying}
                result={qualificationResult}
                onClose={() => {
                    setQualificationModalOpen(false)
                    setPendingTender(null)
                    // Since we already "swiped" it visually, we don't need to put it back unless we want to undo
                    // Ideally we should undo the swipe but for now "closing" is effectively "ignore/pass"
                }}
                onProceed={() => {
                    setQualificationModalOpen(false)
                    setIdeaModalOpen(true)
                }}
                onShred={() => {
                    setQualificationModalOpen(false)
                    // It was already removed from 'tenders' state visually in handleSwipe
                    // So we just call reject action if we haven't already
                    if (userId && pendingTender) {
                        rejectTenderAction(pendingTender, userId).catch(console.error)
                        toast.info("Tender shredded based on advisory.")
                    }
                    setPendingTender(null)
                }}
            />

            <CompanyDetailsGate
                isOpen={showOnboarding}
                onComplete={() => {
                    setShowOnboarding(false)
                    setProfileComplete(true)
                }}
            />

            <TenderDetailsModal
                tender={selectedTender}
                onClose={() => setSelectedTender(null)}
            />
        </div>
    )
}

