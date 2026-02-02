"use client"

import { useState, useEffect, useMemo } from "react"
import { MOCK_TENDERS, Tender } from "@/lib/mock-tenders"
import { TenderCard } from "@/components/TenderCard"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { saveTenderAction, rejectTenderAction } from "./actions"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw, Filter, ChevronDown, Bookmark, Sparkles, User, LayoutGrid, List, ArrowRight } from "lucide-react"
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

        // Industry sector mapping - using EXACT word boundary matching to prevent false positives
        // This is a senior-dev standard approach that prevents "audio" matching "healthcare" etc.
        const industryConfig: Record<string, {
            sectorPatterns: RegExp[],  // Regex patterns with word boundaries for sector
            includePatterns: RegExp[], // Regex patterns that MUST match to include
            excludePatterns: RegExp[]  // Regex patterns that immediately exclude
        }> = {
            healthcare: {
                sectorPatterns: [/\bhealth\b/i, /\bnhs\b/i, /\bclinical\b/i, /\bmedical\b/i, /\bcare\b/i],
                includePatterns: [
                    /\bnhs\b/i, /\bhospital\b/i, /\bclinical\b/i, /\bpatient\b/i,
                    /\bnursing\b/i, /\bpharmac/i, /\bmedical\b/i, /\bhealthcare\b/i,
                    /\bgp\s+surgery/i, /\bambulance\b/i, /\bmental\s+health/i,
                    /\bhealth\s+service/i, /\bsocial\s+care/i, /\bcare\s+home/i
                ],
                excludePatterns: [
                    /\baudio\b/i, /\barmou?r/i, /\beducation\b/i, /\bschool\b/i,
                    /\bmilitary\b/i, /\bdefence\b/i, /\bdefense\b/i, /\bconstruction\b/i,
                    /\bbuilding\s+work/i, /\bsoftware\s+develop/i, /\bmod\b/i,
                    /\belectrica?l?\s+work/i, /\bplumbing\b/i, /\bscaffold/i
                ]
            },
            construction: {
                sectorPatterns: [/\bconstruction\b/i, /\bbuilding\b/i, /\bcivil\s+engineering/i],
                includePatterns: [
                    /\bconstruction\b/i, /\bbuilding\s+work/i, /\bcivil\s+engineering/i,
                    /\brenovation\b/i, /\bdemolition\b/i, /\bcontractor\b/i,
                    /\bscaffolding\b/i, /\broofing\b/i, /\bgroundwork/i
                ],
                excludePatterns: [
                    /\bnhs\b/i, /\bhospital\b/i, /\bhealthcare\b/i, /\bsoftware\b/i,
                    /\bdigital\b/i, /\beducation\b/i, /\bschool\b/i
                ]
            },
            it: {
                sectorPatterns: [/\bit\b/i, /\btechnology\b/i, /\bsoftware\b/i, /\bdigital\b/i, /\bcyber/i],
                includePatterns: [
                    /\bsoftware\b/i, /\bdigital\s+transform/i, /\bcyber\s+security/i,
                    /\bcloud\s+computing/i, /\bit\s+service/i, /\bdatabase\b/i,
                    /\bnetwork\s+infrastructure/i, /\bsaas\b/i, /\bapi\b/i,
                    /\bweb\s+develop/i, /\bapp\s+develop/i, /\bict\b/i
                ],
                excludePatterns: [
                    /\bconstruction\b/i, /\bbuilding\b/i, /\bhealthcare\b/i,
                    /\bmedical\b/i, /\beducation\b/i, /\bschool\b/i
                ]
            },
            education: {
                sectorPatterns: [/\beducation\b/i, /\bschool/i, /\buniversit/i, /\bcollege\b/i, /\btraining\b/i],
                includePatterns: [
                    /\bschool\b/i, /\buniversit/i, /\bcollege\b/i, /\beducation\b/i,
                    /\bstudent\b/i, /\bacademy\b/i, /\bcurriculum\b/i, /\bteaching\b/i,
                    /\bpupil\b/i, /\blearning\b/i
                ],
                excludePatterns: [
                    /\bnhs\b/i, /\bhealthcare\b/i, /\bhospital\b/i,
                    /\bconstruction\b/i, /\bdefence\b/i, /\bdefense\b/i
                ]
            },
            transport: {
                sectorPatterns: [/\btransport/i, /\blogistic/i, /\bhighway/i],
                includePatterns: [
                    /\btransport/i, /\blogistic/i, /\bvehicle\s+fleet/i,
                    /\bbus\s+service/i, /\brail\b/i, /\bhighway/i,
                    /\btraffic\s+management/i, /\broad\s+maintenance/i
                ],
                excludePatterns: [
                    /\bhealthcare\b/i, /\bnhs\b/i, /\beducation\b/i,
                    /\bschool\b/i, /\bsoftware\b/i
                ]
            },
            defence: {
                sectorPatterns: [/\bdefence\b/i, /\bdefense\b/i, /\bmilitary\b/i, /\bmod\b/i],
                includePatterns: [
                    /\bdefence\b/i, /\bdefense\b/i, /\bmod\b/i, /\bmilitary\b/i,
                    /\barmed\s+forces/i, /\bministry\s+of\s+defence/i,
                    /\barmou?red?\b/i, /\bammunition\b/i
                ],
                excludePatterns: [
                    /\bnhs\b/i, /\bhealthcare\b/i, /\beducation\b/i, /\bschool\b/i
                ]
            },
            energy: {
                sectorPatterns: [/\benergy\b/i, /\butiliti/i, /\brenewable\b/i],
                includePatterns: [
                    /\benergy\b/i, /\belectricity\b/i, /\brenewable\b/i,
                    /\bsolar\s+panel/i, /\bwind\s+farm/i, /\bpower\s+generation/i,
                    /\butility\b/i, /\bgas\s+supply/i, /\bgrid\b/i
                ],
                excludePatterns: [
                    /\bhealthcare\b/i, /\bnhs\b/i, /\beducation\b/i,
                    /\bschool\b/i, /\bconstruction\b/i
                ]
            },
        }

        // Function to check if a tender matches a category using regex word boundaries
        const matchesCategory = (tender: Tender, category: string): boolean => {
            const config = industryConfig[category]
            if (!config) return false

            const searchText = `${tender.title || ''} ${tender.description || ''} ${tender.sector || ''} ${tender.buyer || ''}`

            // FIRST: Check if ANY exclude pattern matches - if so, reject immediately
            for (const pattern of config.excludePatterns) {
                if (pattern.test(searchText)) {
                    return false
                }
            }

            // SECOND: Check if sector matches any sector pattern
            const sectorText = tender.sector || ''
            for (const pattern of config.sectorPatterns) {
                if (pattern.test(sectorText)) {
                    return true
                }
            }

            // THIRD: Check if any include pattern matches
            for (const pattern of config.includePatterns) {
                if (pattern.test(searchText)) {
                    return true
                }
            }

            return false
        }

        // 1. Industry Filter - strict regex-based matching with word boundaries
        if (activeFilter !== "all") {
            filtered = filtered.filter(tender => matchesCategory(tender, activeFilter))
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
                    <div className="w-full max-w-6xl px-4">
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-6 text-center font-medium">
                            {tenders.length} ACTIVE OPPORTUNITIES
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto pb-8 pr-2">
                            {tenders.map((tender, index) => (
                                <motion.div
                                    key={tender.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="group bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(0,122,255,0.1)] transition-all duration-300 cursor-pointer relative overflow-hidden"
                                    onClick={() => setSelectedTender(tender)}
                                >
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    <div className="relative z-10">
                                        {/* Header row */}
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider">
                                                {tender.sector}
                                            </span>
                                            <span className="text-[11px] text-white/40 font-medium">{tender.deadline}</span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary/90 transition-colors">
                                            {tender.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-xs text-white/50 mb-4 line-clamp-2 leading-relaxed">
                                            {tender.description}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-end justify-between pt-3 border-t border-white/5">
                                            <div>
                                                <p className="text-lg font-black text-secondary tracking-tight">{tender.value}</p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5 line-clamp-1 max-w-[150px]">{tender.buyer}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* View Mode: List */}
                {viewMode === 'list' && (
                    <div className="w-full max-w-6xl px-4">
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-6 text-center font-medium">
                            {tenders.length} ACTIVE OPPORTUNITIES
                        </p>
                        <div className="space-y-4 max-h-[75vh] overflow-y-auto pb-8 pr-2">
                            {tenders.map((tender, index) => (
                                <motion.div
                                    key={tender.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.015 }}
                                    className="group flex items-center gap-6 bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/10 rounded-xl p-5 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(0,122,255,0.05)] transition-all duration-300 cursor-pointer"
                                    onClick={() => setSelectedTender(tender)}
                                >
                                    {/* Left accent bar */}
                                    <div className="flex-shrink-0 w-1 h-16 rounded-full bg-gradient-to-b from-primary to-primary/30" />

                                    {/* Main content */}
                                    <div className="flex-grow min-w-0 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider">
                                                {tender.sector}
                                            </span>
                                            <span className="text-xs text-white/30">•</span>
                                            <span className="text-xs text-white/40 truncate max-w-[200px]">{tender.buyer}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-white group-hover:text-primary/90 transition-colors line-clamp-1">
                                            {tender.title}
                                        </h3>
                                        <p className="text-xs text-white/40 line-clamp-1">{tender.description}</p>
                                    </div>

                                    {/* Right side info */}
                                    <div className="flex-shrink-0 text-right space-y-1">
                                        <p className="text-xl font-black text-secondary tracking-tight">{tender.value}</p>
                                        <p className="text-[11px] text-white/40 font-medium">{tender.deadline}</p>
                                    </div>

                                    {/* Hover arrow */}
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-primary" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
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

