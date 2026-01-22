"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { supabase } from "@/lib/supabase"
import { Loader2, Briefcase, Calendar, PoundSterling, Trash2, ArrowRight } from "lucide-react"
import { Tender } from "@/lib/mock-tenders"
import Link from "next/link"
import { motion } from "framer-motion"

export default function FavouritesPage() {
    const [savedTenders, setSavedTenders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Using any for saved item record structure for now, but really it's { id, tender_data, created_at, ... }

    useEffect(() => {
        const loadFavourites = async () => {
            if (!supabase) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('saved_tenders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setSavedTenders(data)
            }
            setLoading(false)
        }
        loadFavourites()
    }, [])

    const removeFavourite = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!supabase) return

        // Optimistic UI update
        setSavedTenders(prev => prev.filter(item => item.id !== id))

        await supabase
            .from('saved_tenders')
            .delete()
            .eq('id', id)
    }

    return (
        <div className="min-h-screen bg-background relative">
            <Header />

            <div className="container mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
                        Shortlisted <span className="text-primary text-glow">Opportunities</span>
                    </h1>
                    <p className="text-white/40 text-sm tracking-widest uppercase">
                        {savedTenders.length} Saved Tenders
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : savedTenders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedTenders.map((item, i) => {
                            const tender = item.tender_data as Tender
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Link href={`/ingest?title=${encodeURIComponent(tender.title)}&client=${encodeURIComponent(tender.buyer)}`}>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group relative overflow-hidden h-full flex flex-col">

                                            {/* Hover Glow */}
                                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative z-10 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 text-white/60 text-[10px] uppercase tracking-widest">
                                                        {tender.sector}
                                                    </div>
                                                    <button
                                                        onClick={(e) => removeFavourite(item.id, e)}
                                                        className="text-white/20 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                    {tender.title}
                                                </h3>

                                                <div className="text-white/50 text-sm mb-6 flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4" />
                                                    {tender.buyer}
                                                </div>

                                                <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                    <div>
                                                        <div className="text-[10px] uppercase text-white/30 tracking-wider mb-1 flex items-center gap-1">
                                                            <PoundSterling className="w-3 h-3" /> Value
                                                        </div>
                                                        <div className="text-secondary font-bold text-sm">
                                                            {tender.value}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase text-white/30 tracking-wider mb-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> Deadline
                                                        </div>
                                                        <div className="text-white font-bold text-sm">
                                                            {tender.deadline}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 flex items-center justify-end text-primary text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                                                    Initialize Proposal <ArrowRight className="w-3 h-3 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <p className="text-white/50 mb-6">No saved opportunities yet.</p>
                        <Link href="/tenders">
                            <button className="cyber-button px-6 py-2 text-sm">
                                Explore Live Tenders
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
