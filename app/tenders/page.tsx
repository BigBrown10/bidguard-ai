"use client"

import { useState, useEffect, useMemo } from "react"
import { MOCK_TENDERS, Tender } from "@/lib/mock-tenders"
import { TenderCard } from "@/components/TenderCard"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/Header"
import { saveTenderAction, rejectTenderAction } from "./actions"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw, Filter, ChevronDown } from "lucide-react"
import { Toaster, toast } from "sonner"

import { TenderDetailsModal } from "@/components/TenderDetailsModal"
import { IdeaInjectionModal } from "@/components/IdeaInjectionModal"
import { CompanyDetailsGate } from "@/components/CompanyDetailsGate"

export default function TenderPage() {
    const [allTenders, setAllTenders] = useState<Tender[]>([])
    const [tenders, setTenders] = useState<Tender[]>([])
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState("all")
    const [priceFilter, setPriceFilter] = useState("all")
    const [filterOpen, setFilterOpen] = useState<boolean | string>(false)

    // V3: Modal states
    const [ideaModalOpen, setIdeaModalOpen] = useState(false)
    const [pendingTender, setPendingTender] = useState<Tender | null>(null)
    const [showOnboarding, setShowOnboarding] = useState(false)

    // Dynamically extract unique sectors from the loaded tenders
    const sectorFilters = useMemo(() => {
        const sectors = new Set(allTenders.map(t => t.sector).filter(Boolean))
        const filters = [{ id: "all", label: "All Sectors" }]
        sectors.forEach(sector => {
            filters.push({ id: sector, label: sector })
        })
        return filters
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
                    if (!profile?.company_name || profile.company_name.trim() === '') {
                        setShowOnboarding(true)
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

        // 1. Industry Filter
        if (activeFilter !== "all") {
            filtered = filtered.filter(t =>
                t.sector.toLowerCase().includes(activeFilter.toLowerCase())
            )
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

    const handleSwipe = async (direction: "left" | "right", index: number) => {
        const swipedTender = tenders[index]
        const newTenders = [...tenders]
        newTenders.pop()
        setTenders(newTenders)
        setAllTenders(prev => prev.filter(t => t.id !== swipedTender.id))

        if (direction === "right") {
            if (!userId) {
                window.location.href = '/register'
                return
            }

            // V3: Show Idea Injection Modal instead of direct save
            setPendingTender(swipedTender)
            setIdeaModalOpen(true)

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

            if (!response.ok) throw new Error('Failed to start proposal')
            return response.json()
        }, {
            loading: 'Queuing autonomous proposal...',
            success: 'Proposal generation started! Check your dashboard.',
            error: 'Failed to start proposal'
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

                    {/* Filters */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4 relative z-20">
                        {/* Industry Filter */}
                        <div className="relative inline-block">
                            <button
                                onClick={() => setFilterOpen(filterOpen === 'industry' ? false : 'industry')}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm transition-colors ${activeFilter !== 'all'
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                {sectorFilters.find(f => f.id === activeFilter)?.label || "All Sectors"}
                                <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen === 'industry' ? 'rotate-180' : ''}`} />
                            </button>

                            {filterOpen === 'industry' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden min-w-[200px] z-50 max-h-[300px] overflow-y-auto"
                                >
                                    {sectorFilters.map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => {
                                                setActiveFilter(filter.id)
                                                setFilterOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeFilter === filter.id
                                                ? 'bg-primary/20 text-primary'
                                                : 'text-white/70 hover:bg-white/5'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Price Filter */}
                        <div className="relative inline-block">
                            <button
                                onClick={() => setFilterOpen(filterOpen === 'price' ? false : 'price')}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm transition-colors ${priceFilter !== 'all'
                                    ? 'bg-secondary/20 border-secondary text-secondary'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-mono">£</div>
                                {priceFilter === 'all' && "Any Value"}
                                {priceFilter === 'low' && "< £100k"}
                                {priceFilter === 'mid' && "£100k - £1m"}
                                {priceFilter === 'high' && "> £1m"}
                                <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen === 'price' ? 'rotate-180' : ''}`} />
                            </button>

                            {filterOpen === 'price' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden min-w-[180px] z-50"
                                >
                                    {[
                                        { id: 'all', label: 'Any Value' },
                                        { id: 'low', label: '< £100k' },
                                        { id: 'mid', label: '£100k - £1m' },
                                        { id: 'high', label: '> £1m' },
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => {
                                                setPriceFilter(filter.id)
                                                setFilterOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${priceFilter === filter.id
                                                ? 'bg-secondary/20 text-secondary'
                                                : 'text-white/70 hover:bg-white/5'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <p className="text-white/40 text-sm tracking-widest uppercase mt-3">
                        {tenders.length} Active Opportunities
                    </p>
                </div>

                <div className="relative w-full max-w-md h-[600px]">
                    <AnimatePresence>
                        {tenders.length > 0 ? (
                            tenders.map((tender, index) => (
                                // Render only the top 2 cards for performance, but let's render all for now as stack depth isn't huge
                                // Actually, stacking logic: Last item in array is on TOP visually in CSS absolute layout
                                <TenderCard
                                    key={tender.id}
                                    tender={tender}
                                    index={tenders.length - 1 - index} // Reverses Z-index so last item is top
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

                {/* Controls Hint */}
                <div className="mt-8 flex gap-12 text-white/30 text-xs font-bold uppercase tracking-widest">
                    <button
                        onClick={() => tenders.length > 0 && handleSwipe("left", tenders.length - 1)}
                        className="flex flex-col items-center gap-2 group cursor-pointer hover:text-white transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-secondary/30 group-hover:border-secondary group-hover:scale-110 group-active:scale-95 transition-all flex items-center justify-center text-secondary text-2xl">✕</div>
                        Pass
                    </button>
                    <button
                        onClick={() => tenders.length > 0 && handleSwipe("right", tenders.length - 1)}
                        className="flex flex-col items-center gap-2 group cursor-pointer hover:text-white transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-primary/30 group-hover:border-primary group-hover:scale-110 group-active:scale-95 transition-all flex items-center justify-center text-primary text-2xl">♥</div>
                        BID
                    </button>
                </div>

            </main>

            {/* V3: Modals */}
            <IdeaInjectionModal
                isOpen={ideaModalOpen}
                tenderTitle={pendingTender?.title || ""}
                onSubmit={handleStartProposal}
                onSkip={handleSkipIdeas}
                onClose={() => {
                    setIdeaModalOpen(false)
                    setPendingTender(null)
                }}
            />

            <CompanyDetailsGate
                isOpen={showOnboarding}
                onComplete={() => setShowOnboarding(false)}
            />

            <TenderDetailsModal
                tender={selectedTender}
                onClose={() => setSelectedTender(null)}
            />
        </div>
    )
}

