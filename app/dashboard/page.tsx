"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { Link, Briefcase, Calendar, PoundSterling, Trash2, ArrowRight } from "lucide-react"
import type { Tender } from "@/lib/mock-tenders"

export default function DashboardPage() {
    const [savedTenders, setSavedTenders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSaved = async () => {
            if (!supabase) return
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('saved_tenders')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'saved')
                .order('created_at', { ascending: false })

            if (data) setSavedTenders(data)
            setLoading(false)
        }
        fetchSaved()
    }, [])

    const initiateProposal = (tender: Tender) => {
        // Navigate to ingest with pre-filled params
        const params = new URLSearchParams({
            title: tender.title,
            client: tender.buyer
        })
        window.location.href = `/ingest?${params.toString()}`
    }

    const removeTender = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('saved_tenders').delete().eq('id', id)
        if (!error) {
            setSavedTenders(savedTenders.filter(t => t.id !== id))
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-6 py-12">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                            Mission <span className="text-primary text-glow">Control</span>
                        </h1>
                        <p className="text-white/50 text-sm tracking-widest uppercase">
                            {savedTenders.length} Potential Contracts Secured
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-white/30">Loading Intelligence...</div>
                ) : savedTenders.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/5 glass-panel">
                        <h2 className="text-xl text-white font-bold mb-2">No Saved Opportunities</h2>
                        <p className="text-white/50 mb-6">Explore the marketplace to find relevant tenders.</p>
                        <a href="/tenders" className="cyber-button px-6 py-3 inline-block">
                            Launch Marketplace
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {savedTenders.map((item) => {
                            const tender = item.tender_data as Tender
                            return (
                                <div key={item.id} className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-primary/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                {tender.sector}
                                            </span>
                                            <span className="text-white/40 text-xs flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Deadline: {tender.deadline}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                                            {tender.title}
                                        </h3>
                                        <p className="text-white/60 text-sm flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> {tender.buyer}
                                            <span className="text-white/20">|</span>
                                            <PoundSterling className="w-3 h-3 text-secondary" /> <span className="text-secondary">{tender.value}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => removeTender(item.id)}
                                            className="p-3 text-white/30 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            title="Discard"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => initiateProposal(tender)}
                                            className="cyber-button px-6 py-3 flex-1 md:flex-none flex items-center justify-center gap-2 text-sm"
                                        >
                                            Initialize Bid <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

            </main>
        </div>
    )
}
