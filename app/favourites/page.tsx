"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Briefcase, Calendar, PoundSterling, Trash2, ArrowRight, FileText, CheckCircle2, AlertCircle, Clock, Edit3, Eye, MoreHorizontal, LayoutGrid, List, RefreshCw } from "lucide-react"
import { Tender } from "@/lib/mock-tenders"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

// Types
type ProposalStatus = 'queued' | 'researching' | 'strategizing' | 'drafting' | 'critiquing' | 'humanizing' | 'complete' | 'failed'

const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode; isActive: boolean }> = {
    queued: { label: 'Queued', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: <Clock className="w-3 h-3" />, isActive: true },
    researching: { label: 'Researching', color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, isActive: true },
    strategizing: { label: 'Strategizing', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, isActive: true },
    drafting: { label: 'Drafting', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, isActive: true },
    critiquing: { label: 'Critiquing', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, isActive: true },
    humanizing: { label: 'Humanizing', color: 'text-pink-400', bgColor: 'bg-pink-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, isActive: true },
    complete: { label: 'Complete', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: <CheckCircle2 className="w-3 h-3" />, isActive: false },
    failed: { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: <AlertCircle className="w-3 h-3" />, isActive: false },
}

export default function MyTendersPage() {
    const [savedTenders, setSavedTenders] = useState<any[]>([])
    const [proposals, setProposals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'proposals' | 'saved'>('proposals')

    useEffect(() => {
        const loadData = async () => {
            if (!supabase) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setLoading(true)

            // 1. Fetch Saved Tenders
            const { data: saved } = await supabase
                .from('saved_tenders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (saved) setSavedTenders(saved)

            // 2. Fetch Proposals
            const { data: props } = await supabase
                .from('proposals')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })

            if (props) setProposals(props)

            // If no proposals but saved tenders, default to saved tab
            if ((!props || props.length === 0) && saved && saved.length > 0) {
                setActiveTab('saved')
            }

            setLoading(false)
        }
        loadData()

        // Poll for updates if on proposals tab
        const interval = setInterval(() => {
            if (activeTab === 'proposals') {
                // Re-fetch only proposals (simplified)
                const fetchProps = async () => {
                    if (!supabase) return
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return
                    const { data } = await supabase
                        .from('proposals')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('updated_at', { ascending: false })
                    if (data) setProposals(data)
                }
                fetchProps()
            }
        }, 5000)

        return () => clearInterval(interval)

    }, [activeTab])

    const removeFavourite = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!supabase) return
        setSavedTenders(prev => prev.filter(item => item.id !== id))
        await supabase.from('saved_tenders').delete().eq('id', id)
        toast.info("Removed from watchlist")
    }

    return (
        <div className="min-h-screen bg-background relative">
            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
                            My <span className="text-primary text-glow">Tenders</span>
                        </h1>
                        <p className="text-white/40 text-sm tracking-widest uppercase">
                            Manage your bids and watchlists
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-white/5 border border-white/10 rounded-lg">
                        <button
                            onClick={() => setActiveTab('proposals')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'proposals'
                                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            Proposals ({proposals.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'saved'
                                ? 'bg-secondary text-black shadow-lg shadow-secondary/20'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            Watchlist ({savedTenders.length})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'proposals' ? (
                                <motion.div
                                    key="proposals"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {proposals.length > 0 ? proposals.map((proposal, i) => {
                                        const status = STATUS_CONFIG[proposal.status as ProposalStatus] || STATUS_CONFIG.queued
                                        const isClickable = proposal.status === 'complete'
                                        return (
                                            <Link
                                                key={proposal.id}
                                                href={isClickable ? `/edit?id=${proposal.id}` : '#'}
                                                className={isClickable ? 'cursor-pointer' : 'cursor-default'}
                                            >
                                                <div className={`glass-panel p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col h-full group ${isClickable ? 'hover:scale-[1.02]' : ''}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5 ${status.color} ${status.bgColor}`}>
                                                            {status.icon}
                                                            {status.label}
                                                        </div>
                                                        {proposal.score && (
                                                            <div className="text-xs font-mono font-bold text-white/50 border border-white/10 px-2 py-1 rounded">
                                                                Score: {proposal.score}/10
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">{proposal.tender_title || "Untitled Proposal"}</h3>
                                                    <p className="text-white/40 text-sm mb-4 line-clamp-1">{proposal.tender_buyer || "Unknown Client"}</p>

                                                    <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                                                        {proposal.status === 'complete' ? (
                                                            <>
                                                                <div className="flex-1">
                                                                    <button className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-2 rounded-lg text-sm font-bold transition-colors">
                                                                        <Edit3 className="w-4 h-4" /> Editor
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.preventDefault(); window.location.href = `/result?id=${proposal.id}` }}
                                                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 p-2 rounded-lg transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : proposal.status === 'failed' ? (
                                                            <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded-lg text-sm font-bold transition-colors">
                                                                <RefreshCw className="w-4 h-4" /> Retry
                                                            </button>
                                                        ) : (
                                                            <div className="w-full bg-white/5 border border-white/10 py-2 rounded-lg text-center text-sm text-white/40 flex items-center justify-center gap-2 cursor-wait">
                                                                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    }) : (
                                        <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                            <p className="text-white/50 mb-6">No proposals generated yet.</p>
                                            <Link href="/tenders">
                                                <button className="cyber-button px-6 py-2 text-sm">
                                                    Start New Bid
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="saved"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {savedTenders.length > 0 ? savedTenders.map((item, i) => {
                                        const tender = item.tender_data as Tender
                                        return (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group relative overflow-hidden flex flex-col h-full">
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

                                                <div className="mt-auto pt-4 border-t border-white/5">
                                                    <Link href={`/ingest?title=${encodeURIComponent(tender.title)}&client=${encodeURIComponent(tender.buyer)}&description=${encodeURIComponent(tender.description)}`}>
                                                        <button className="w-full flex items-center justify-center gap-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                                            Initialize Proposal <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                            <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                            <p className="text-white/50 mb-6">Your watchlist is empty.</p>
                                            <Link href="/tenders">
                                                <button className="cyber-button px-6 py-2 text-sm">
                                                    Explore Tenders
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
