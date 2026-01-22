"use client"

import { useState, useEffect } from "react"
import { MOCK_TENDERS, Tender } from "@/lib/mock-tenders"
import { TenderCard } from "@/components/TenderCard"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/Header"
import { saveTenderAction, rejectTenderAction } from "./actions"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw, Filter, ChevronDown } from "lucide-react"
import { Toaster, toast } from "sonner"

import { TenderDetailsModal } from "@/components/TenderDetailsModal"

const INDUSTRY_FILTERS = [
    { id: "all", label: "All Sectors" },
    { id: "Healthcare", label: "Healthcare / NHS" },
    { id: "Technology", label: "Technology / Digital" },
    { id: "Defence", label: "Defence / Security" },
    { id: "Construction", label: "Construction" },
    { id: "Education", label: "Education" },
    { id: "Transport", label: "Transport / Infrastructure" },
]

export default function TenderPage() {
    const [allTenders, setAllTenders] = useState<Tender[]>([])
    const [tenders, setTenders] = useState<Tender[]>([])
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState("all")
    const [filterOpen, setFilterOpen] = useState(false)

    // Load User ID & Tenders on mount
    useEffect(() => {
        const init = async () => {
            // 1. Auth check
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) setUserId(user.id)
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

    // Filter tenders by industry
    useEffect(() => {
        if (activeFilter === "all") {
            setTenders(allTenders)
        } else {
            setTenders(allTenders.filter(t =>
                t.sector.toLowerCase().includes(activeFilter.toLowerCase())
            ))
        }
    }, [activeFilter, allTenders])

    const handleSwipe = async (direction: "left" | "right", index: number) => {
        const swipedTender = tenders[index]
        const newTenders = [...tenders]
        newTenders.pop()
        setTenders(newTenders)
        // Also remove from allTenders to prevent reappearing on filter change
        setAllTenders(prev => prev.filter(t => t.id !== swipedTender.id))

        if (direction === "right") {
            if (!userId) {
                window.location.href = '/register'
                return
            }
            toast.promise(async () => {
                const result = await saveTenderAction(swipedTender, userId)
                if (!result.success) throw new Error(result.error)
                return result
            }, {
                loading: 'Securing Opportunity...',
                success: `Added "${swipedTender.title}" to Favourites`,
                error: (err: any) => `Failed: ${err.message}`
            })
        } else {
            if (userId) {
                rejectTenderAction(swipedTender, userId).catch(err => console.error("Reject failed", err))
            }
        }
    }

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

                    {/* Industry Filter */}
                    <div className="relative inline-block mt-4">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            {INDUSTRY_FILTERS.find(f => f.id === activeFilter)?.label || "All Sectors"}
                            <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {filterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden min-w-[200px] z-50"
                            >
                                {INDUSTRY_FILTERS.map(filter => (
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

            <TenderDetailsModal
                tender={selectedTender}
                onClose={() => setSelectedTender(null)}
            />
        </div>
    )
}
