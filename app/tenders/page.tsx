"use client"

import { useState, useEffect } from "react"
import { MOCK_TENDERS, Tender } from "@/lib/mock-tenders"
import { TenderCard } from "@/components/TenderCard"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/Header"
import { saveTenderAction } from "./actions"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw } from "lucide-react"

export default function TenderPage() {
    const [tenders, setTenders] = useState<Tender[]>(MOCK_TENDERS)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Load User ID on mount
    useEffect(() => {
        const loadUser = async () => {
            if (!supabase) return
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                // Filter out already saved tenders later? For now, just show mock stack.
            }
            setLoading(false)
        }
        loadUser()
    }, [])

    const handleSwipe = async (direction: "left" | "right", index: number) => {
        const swipedTender = tenders[index] // Logic is slightly tricky with index, usually better to pop from top

        // Remove the top card (the one at 'index' in the render list is actually best handled by ID)
        // But since we are rendering the whole array, let's just slice
        const newTenders = [...tenders]
        newTenders.pop() // Remove the last item (top of stack)
        setTenders(newTenders)

        if (direction === "right" && userId) {
            console.log(`Saving tender: ${swipedTender.title}`)
            try {
                await saveTenderAction(swipedTender, userId)
            } catch (err) {
                console.error("Failed to save", err)
            }
        } else {
            console.log(`Discarded tender: ${swipedTender.title}`)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            <Header />

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                        Marketplace <span className="text-primary text-glow">Feed</span>
                    </h1>
                    <p className="text-white/40 text-sm tracking-widest uppercase">
                        {tenders.length} Active Opportunities Detected
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
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-secondary/30 flex items-center justify-center text-secondary">✕</div>
                        Pass
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center text-primary">♥</div>
                        Bit
                    </div>
                </div>

            </main>
        </div>
    )
}
