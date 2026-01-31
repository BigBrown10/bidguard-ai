"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import {
    Users, FileText, CreditCard, TrendingUp, TrendingDown,
    AlertCircle, CheckCircle, Clock, Trash2, Plus, Minus,
    Search, ChevronRight, Shield
} from "lucide-react"
import { Toaster, toast } from "sonner"

// Admin emails whitelist
const ADMIN_EMAILS = [
    "edogunosamudiamen@gmail.com",
    "brownhood10@gmail.com",
    "mudybrown10@gmail.com",
    "viralculture10@gmail.com",
    "admin@bidswipe.xyz",
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""
].filter(Boolean).map(e => e.toLowerCase())

interface User {
    id: string
    company_name: string
    business_description: string
    industry: string
    credits: number
    credits_used: number
    created_at: string
}

interface Proposal {
    id: string
    tender_title: string
    status: string
    created_at: string
    profiles?: { company_name: string }
}

interface Stats {
    userCount: number
    proposalStats: { total: number; completed: number; failed: number; queued: number }
    creditStats: { total: number; used: number }
}

export default function AdminDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [stats, setStats] = useState<Stats>({
        userCount: 0,
        proposalStats: { total: 0, completed: 0, failed: 0, queued: 0 },
        creditStats: { total: 0, used: 0 }
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "proposals">("overview")

    useEffect(() => {
        const checkAdmin = async () => {
            if (!supabase) {
                setLoading(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()

            if (!user || !ADMIN_EMAILS.includes((user.email || "").toLowerCase())) {
                toast.error("Access Denied", { description: "You are not authorized to view this page." })
                router.push("/")
                return
            }

            setAuthorized(true)
            await loadData()
            setLoading(false)
        }

        checkAdmin()
    }, [router])

    const loadData = async () => {
        if (!supabase) return

        // Load users
        const { data: usersData } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })

        setUsers(usersData || [])

        // Load proposals
        const { data: proposalsData } = await supabase
            .from("proposals")
            .select("*, profiles(company_name)")
            .order("created_at", { ascending: false })
            .limit(100)

        setProposals(proposalsData || [])

        // Calculate stats
        const userCount = usersData?.length || 0
        const allProposals = proposalsData || []

        setStats({
            userCount,
            proposalStats: {
                total: allProposals.length,
                completed: allProposals.filter(p => p.status === "completed").length,
                failed: allProposals.filter(p => p.status === "failed" || p.status === "error").length,
                queued: allProposals.filter(p => p.status === "queued" || p.status === "processing").length,
            },
            creditStats: {
                total: usersData?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0,
                used: usersData?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0,
            }
        })
    }

    const handleDeleteUser = async (userId: string) => {
        if (!supabase) return
        if (!confirm("Are you sure you want to delete this user?")) return

        const { error } = await supabase.from("profiles").delete().eq("id", userId)

        if (error) {
            toast.error("Failed to delete user")
        } else {
            toast.success("User deleted")
            setUsers(prev => prev.filter(u => u.id !== userId))
        }
    }

    const handleAdjustCredits = async (userId: string, amount: number) => {
        if (!supabase) return

        const user = users.find(u => u.id === userId)
        if (!user) return

        const newCredits = Math.max(0, (user.credits || 0) + amount)

        const { error } = await supabase
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userId)

        if (error) {
            toast.error("Failed to adjust credits")
        } else {
            toast.success(`Credits ${amount > 0 ? 'added' : 'removed'}`)
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: newCredits } : u))
        }
    }

    const filteredUsers = users.filter(u =>
        (u.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.industry || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white/50">Loading...</div>
            </div>
        )
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-white/50">You are not authorized to view this page.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Toaster position="top-right" theme="dark" richColors />

            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-white/40">BidSwipe Admin</span>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex gap-4 mb-8">
                    {(["overview", "users", "proposals"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? "bg-primary text-black"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-white/50 text-sm">Total Users</span>
                                </div>
                                <div className="text-3xl font-black">{stats.userCount}</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-white/50 text-sm">Total Proposals</span>
                                </div>
                                <div className="text-3xl font-black">{stats.proposalStats.total}</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                    </div>
                                    <span className="text-white/50 text-sm">Success Rate</span>
                                </div>
                                <div className="text-3xl font-black">
                                    {stats.proposalStats.total > 0
                                        ? Math.round((stats.proposalStats.completed / stats.proposalStats.total) * 100)
                                        : 0}%
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <span className="text-white/50 text-sm">Credits Used</span>
                                </div>
                                <div className="text-3xl font-black">{stats.creditStats.used}</div>
                                <div className="text-xs text-white/40 mt-1">{stats.creditStats.total} remaining</div>
                            </motion.div>
                        </div>

                        {/* Proposal Status Breakdown */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-6">Proposal Status</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-500/10 rounded-xl">
                                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-green-400">{stats.proposalStats.completed}</div>
                                    <div className="text-xs text-white/40">Completed</div>
                                </div>
                                <div className="text-center p-4 bg-amber-500/10 rounded-xl">
                                    <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-amber-400">{stats.proposalStats.queued}</div>
                                    <div className="text-xs text-white/40">In Progress</div>
                                </div>
                                <div className="text-center p-4 bg-red-500/10 rounded-xl">
                                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-red-400">{stats.proposalStats.failed}</div>
                                    <div className="text-xs text-white/40">Failed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search users..."
                                className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Users List */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-xs text-white/40 uppercase">Company</th>
                                        <th className="text-left p-4 text-xs text-white/40 uppercase">Industry</th>
                                        <th className="text-center p-4 text-xs text-white/40 uppercase">Credits</th>
                                        <th className="text-center p-4 text-xs text-white/40 uppercase">Used</th>
                                        <th className="text-right p-4 text-xs text-white/40 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="p-4">
                                                <div className="font-medium">{user.company_name || "Unnamed"}</div>
                                                <div className="text-xs text-white/40 truncate max-w-[200px]">
                                                    {user.business_description || "No description"}
                                                </div>
                                            </td>
                                            <td className="p-4 text-white/60">{user.industry || "-"}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAdjustCredits(user.id, -1)}
                                                        className="w-6 h-6 rounded bg-white/10 hover:bg-red-500/20 flex items-center justify-center"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-mono">{user.credits || 0}</span>
                                                    <button
                                                        onClick={() => handleAdjustCredits(user.id, 1)}
                                                        className="w-6 h-6 rounded bg-white/10 hover:bg-green-500/20 flex items-center justify-center"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-white/40">{user.credits_used || 0}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Proposals Tab */}
                {activeTab === "proposals" && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-xs text-white/40 uppercase">Tender</th>
                                    <th className="text-left p-4 text-xs text-white/40 uppercase">Company</th>
                                    <th className="text-center p-4 text-xs text-white/40 uppercase">Status</th>
                                    <th className="text-right p-4 text-xs text-white/40 uppercase">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proposals.map(proposal => (
                                    <tr key={proposal.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <div className="font-medium truncate max-w-[300px]">{proposal.tender_title}</div>
                                        </td>
                                        <td className="p-4 text-white/60">
                                            {proposal.profiles?.company_name || "Unknown"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${proposal.status === "completed" ? "bg-green-500/20 text-green-400" :
                                                proposal.status === "failed" || proposal.status === "error" ? "bg-red-500/20 text-red-400" :
                                                    "bg-amber-500/20 text-amber-400"
                                                }`}>
                                                {proposal.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-white/40 text-sm">
                                            {new Date(proposal.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
