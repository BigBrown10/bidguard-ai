"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { Briefcase, Calendar, PoundSterling, Trash2, ArrowRight, Zap, Trophy, FileText, Clock, Activity, Eye, Loader2, AlertCircle, CheckCircle2, RotateCcw, Search, Sparkles } from "lucide-react"
import type { Tender } from "@/lib/mock-tenders"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

// Proposal status type
type ProposalStatus = 'queued' | 'researching' | 'strategizing' | 'drafting' | 'critiquing' | 'humanizing' | 'complete' | 'failed'

interface Proposal {
    id: string
    tender_id: string
    tender_title: string
    tender_buyer: string
    status: ProposalStatus
    score: number | null
    created_at: string
    updated_at: string
    final_content: string | null
}

// Status configuration
const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode; isActive: boolean }> = {
    queued: { label: 'Queued', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: <Clock className="w-3 h-3" />, isActive: true },
    researching: { label: 'Researching', color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: <Search className="w-3 h-3" />, isActive: true },
    strategizing: { label: 'Strategizing', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', icon: <Sparkles className="w-3 h-3" />, isActive: true },
    drafting: { label: 'Writing', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: <FileText className="w-3 h-3" />, isActive: true },
    critiquing: { label: 'Reviewing', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: <Eye className="w-3 h-3" />, isActive: true },
    humanizing: { label: 'Polishing', color: 'text-pink-400', bgColor: 'bg-pink-500/10', icon: <Zap className="w-3 h-3" />, isActive: true },
    complete: { label: 'Complete', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: <CheckCircle2 className="w-3 h-3" />, isActive: false },
    failed: { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: <AlertCircle className="w-3 h-3" />, isActive: false },
}

// Relative time helper
function getRelativeTime(date: string): string {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
}

export default function DashboardPage() {
    const [savedTenders, setSavedTenders] = useState<any[]>([])
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [loading, setLoading] = useState(true)
    const [proposalsLoading, setProposalsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [filterSector, setFilterSector] = useState<string>('All')

    // Derived state for filtering
    const sectors = ['All', ...Array.from(new Set(savedTenders.map(t => t.tender_data?.sector || 'Other')))]
    const filteredTenders = filterSector === 'All' ? savedTenders : savedTenders.filter(t => t.tender_data?.sector === filterSector)

    // Fetch saved tenders
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

    // Fetch proposals (with polling for active jobs)
    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const res = await fetch('/api/proposals/list')
                const data = await res.json()
                if (data.proposals) {
                    setProposals(data.proposals)
                }
            } catch (e) {
                console.error('Failed to fetch proposals:', e)
            } finally {
                setProposalsLoading(false)
            }
        }

        fetchProposals()

        // Track completions for notifications
        const completed = proposals.filter(p => p.status === 'complete')
        const prevCompleted = previousProposalsRef.current.filter(p => p.status === 'complete')

        if (completed.length > prevCompleted.length && previousProposalsRef.current.length > 0) {
            // Find the new one(s)
            const newIds = completed.map(p => p.id).filter(id => !prevCompleted.find(p => p.id === id))
            newIds.forEach(id => {
                const prop = proposals.find(p => p.id === id)
                if (prop) {
                    toast.success("Mission Accomplished", {
                        description: `Proposal for "${prop.tender_title}" is ready for review.`,
                        action: {
                            label: "View",
                            onClick: () => window.location.href = `/result?id=${prop.id}`
                        }
                    })
                }
            })
        }
        previousProposalsRef.current = proposals

    }, 5000)

    // Initial fetch
    fetchProposals()

    return () => clearInterval(interval)
}, [proposals]) // Use proposals state as dependency if we want to react to state updates, but here we are setting state inside.
// Actually the interval approach combined with fetching inside implies we don't need prop dependency for the interval, but we do for the ref check.
// Better pattern: Just do the check inside the fetch success block.
// I will refactor to do the check inside `fetchProposals` in the next replacement block for cleanliness, or just stick to this.
// Let's stick to modifying the existing effect but refined:
// We can't rely on `proposals` dependency if we are setting it, it might cause loops or stale closures in interval.

// NEW PLAN:
// Modify `useEffect` to use a ref for the polling interval and manage the check inside the `fetchProposals` function itself.
// See the larger replacement below.

const initiateProposal = (tender: Tender) => {
    const params = new URLSearchParams({
        title: tender.title,
        client: tender.buyer
    })
    window.location.href = `/newbid?${params.toString()}`
}

const removeTender = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('saved_tenders').delete().eq('id', id)
    if (!error) {
        setSavedTenders(savedTenders.filter(t => t.id !== id))
    }
}

// Calculate real metrics
const completedProposals = proposals.filter(p => p.status === 'complete').length
const activeProposals = proposals.filter(p => STATUS_CONFIG[p.status]?.isActive).length
const avgScore = proposals.filter(p => p.score).reduce((acc, p) => acc + (p.score || 0), 0) / (proposals.filter(p => p.score).length || 1)

return (
    <div className="min-h-screen bg-background">
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

                {/* Metric 2: Proposals Written */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-secondary">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Proposals</h3>
                        <FileText className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="text-4xl font-black text-white mb-1">{completedProposals}</div>
                    <div className="text-xs text-white/40">
                        {activeProposals > 0 ? `${activeProposals} in progress` : 'Generated'}
                    </div>
                </motion.div>

                {/* Metric 3: Average Score */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-l-4 border-accent">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Avg Score</h3>
                        <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-4xl font-black text-white mb-1">
                        {avgScore > 0 ? avgScore.toFixed(1) : '—'}<span className="text-lg text-white/40">/10</span>
                    </div>
                    <div className="text-xs text-white/40">Red Team Rating</div>
                </motion.div>

                {/* Metric 4: Total Proposals */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-panel p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Total Bids</h3>
                        <Trophy className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-4xl font-black text-white mb-1">{proposals.length}</div>
                    <div className="text-xs text-white/40">All Time</div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Panel: My Proposals */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> My Proposals
                        </h3>
                        {activeProposals > 0 && (
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {activeProposals} generating...
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {proposalsLoading ? (
                            <div className="text-center text-white/30 text-sm py-12">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Loading proposals...
                            </div>
                        ) : proposals.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                                <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                <p className="text-white/40 text-sm mb-4">No proposals yet</p>
                                <Link
                                    href="/tenders"
                                    className="inline-block text-xs bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-colors"
                                >
                                    Find Tenders
                                </Link>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {proposals.slice(0, 6).map((proposal, i) => {
                                    const statusConfig = STATUS_CONFIG[proposal.status]
                                    const isActive = statusConfig?.isActive

                                    return (
                                        <motion.div
                                            key={proposal.id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 20, opacity: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`glass-panel p-4 border ${isActive ? 'border-primary/30' : 'border-white/5'} hover:border-white/20 transition-all group`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    {/* Status Icon */}
                                                    <div className={`w-10 h-10 rounded-full ${statusConfig?.bgColor} flex items-center justify-center border border-white/10 relative`}>
                                                        <span className={statusConfig?.color}>
                                                            {statusConfig?.icon}
                                                        </span>
                                                        {isActive && (
                                                            <span className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30" style={{ color: 'var(--primary)' }} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-bold text-white text-sm line-clamp-1 mb-0.5">
                                                            {proposal.tender_title || 'Untitled Proposal'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-white/40 truncate">
                                                                {proposal.tender_buyer || 'Unknown Buyer'}
                                                            </span>
                                                            <span className="text-white/20">•</span>
                                                            <span className={`flex items-center gap-1 ${statusConfig?.color}`}>
                                                                {statusConfig?.icon}
                                                                {statusConfig?.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {proposal.score && (
                                                        <div className="text-xs font-mono text-secondary bg-secondary/10 px-2 py-1 rounded">
                                                            {proposal.score.toFixed(1)}/10
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] uppercase text-white/30 tracking-wider">
                                                        {getRelativeTime(proposal.created_at)}
                                                    </div>
                                                    {proposal.status === 'complete' && proposal.final_content && (
                                                        <Link
                                                            href={`/result?id=${proposal.id}`}
                                                            className="text-xs text-primary hover:text-white bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            View
                                                        </Link>
                                                    )}
                                                    {proposal.status === 'failed' && (
                                                        <button
                                                            className="text-xs text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Retry
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Side Panel: Shortlisted Tenders (Mini View) */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                            Pipeline Priority
                        </h3>
                        {/* Industry Filter */}
                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            className="bg-black border border-white/20 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-primary uppercase font-bold"
                        >
                            <option value="All">All Sectors</option>
                            {sectors.filter(s => s !== 'All').map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center text-white/30 text-sm py-8">Syncing...</div>
                        ) : filteredTenders.slice(0, 3).map((item) => {
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

                        {filteredTenders.length === 0 && !loading && (
                            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                <p className="text-white/30 text-xs mb-4">No active pipeline</p>
                                <Link href="/tenders" className="text-xs cyber-button px-4 py-2">Find Tenders</Link>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </main>
    </div>
)
}
