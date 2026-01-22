"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { Briefcase, Calendar, PoundSterling, Trash2, ArrowRight, Zap, Trophy, FileText, Clock, Activity } from "lucide-react"
import type { Tender } from "@/lib/mock-tenders"
import { motion } from "framer-motion"

export default function DashboardPage() {
    const [savedTenders, setSavedTenders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchSaved = async () => {
            if (!supabase) return
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUser(user)

            const { data, error } = await supabase
                .from('saved_tenders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setSavedTenders(data)
            setLoading(false)
        }
        fetchSaved()
    }, [])

    const initiateProposal = (tender: Tender) => {
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

    // --- MOCK DATA FOR ANALYTICS ---
    // In a real app, these would come from a 'proposals' table
    const MOCK_ACTIVITY = [
        { id: 1, action: "Proposal Generated", target: "NHS Digital Transformation", words: 4520, date: "2 hours ago" },
        { id: 2, action: "Market Research", target: "MOD Logistics AI", words: 1200, date: "5 hours ago" },
        { id: 3, action: "Tender Saved", target: "Department for Education Laptops", words: 0, date: "1 day ago" },
    ]

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-6 py-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
                            Command <span className="text-primary text-glow">Center</span>
                        </h1>
                        <p className="text-white/50 text-sm tracking-widest uppercase">
                            Welcome back, {user?.user_metadata?.first_name || "Operative"}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-right">
                            <div className="text-[10px] uppercase text-white/40 font-bold tracking-wider">System Status</div>
                            <div className="text-green-400 font-bold text-sm flex items-center gap-2 justify-end">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                OPERATIONAL
                            </div>
                        </div>
                    </div>
                </div>

                {/* ANALYTICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

                    {/* Metric 1: Tenders Selected */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Opportunities</h3>
                            <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-4xl font-black text-white mb-1">{savedTenders.length}</div>
                        <div className="text-xs text-white/40">Active Pipeline</div>
                    </motion.div>

                    {/* Metric 2: Proposals Written (Mock) */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-secondary">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Proposals Generated</h3>
                            <FileText className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="text-4xl font-black text-white mb-1">12</div>
                        <div className="text-xs text-white/40">+4 this week</div>
                    </motion.div>

                    {/* Metric 3: Humanization Score */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-l-4 border-accent">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Humanize Rate</h3>
                            <Zap className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-4xl font-black text-white mb-1">9.8<span className="text-lg text-white/40">/10</span></div>
                        <div className="text-xs text-white/40">Undetectable Output</div>
                    </motion.div>

                    {/* Metric 4: Win Probability (Mock) */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-panel p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Forecast Value</h3>
                            <Trophy className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-4xl font-black text-white mb-1">£4.2M</div>
                        <div className="text-xs text-white/40">Total Pipeline Value</div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Log: Recent Activity */}
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> Recent Activity Log
                        </h3>
                        <div className="space-y-4">
                            {MOCK_ACTIVITY.map((activity, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="glass-panel p-4 flex items-center justify-between group hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                                            <FileText className="w-5 h-5 text-white/60 group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{activity.action}</div>
                                            <div className="text-xs text-white/40">{activity.target}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {activity.words > 0 && (
                                            <div className="text-sm font-mono text-secondary">{activity.words.toLocaleString()} words</div>
                                        )}
                                        <div className="text-[10px] uppercase text-white/30 tracking-wider flex items-center gap-1 justify-end mt-1">
                                            <Clock className="w-3 h-3" /> {activity.date}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Side Panel: Shortlisted Tenders (Mini View) */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                                Pipeline Priority
                            </h3>
                            <a href="/favourites" className="text-xs text-primary hover:text-white transition-colors uppercase font-bold tracking-widest">
                                View All
                            </a>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center text-white/30 text-sm py-8">Syncing...</div>
                            ) : savedTenders.slice(0, 3).map((item) => {
                                const tender = item.tender_data as Tender
                                return (
                                    <div key={item.id} className="glass-panel p-4 border border-white/5 hover:border-white/20 transition-colors">
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded uppercase">
                                                {tender.sector}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-white text-sm line-clamp-1 mb-1">{tender.title}</h4>
                                        <div className="flex justify-between items-center text-xs text-white/40 mb-3">
                                            <span>{tender.deadline}</span>
                                            <span className="text-secondary">{tender.value}</span>
                                        </div>
                                        <button
                                            onClick={() => initiateProposal(tender)}
                                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest rounded transition-all border border-transparent hover:border-primary/30"
                                        >
                                            Initialize
                                        </button>
                                    </div>
                                )
                            })}

                            {savedTenders.length === 0 && !loading && (
                                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                    <p className="text-white/30 text-xs mb-4">No active pipeline</p>
                                    <a href="/tenders" className="text-xs cyber-button px-4 py-2">Find Tenders</a>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </main>
        </div>
    )
}
