"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users, FileText, TrendingUp, CreditCard,
    CheckCircle, Clock, AlertCircle, Search,
    Plus, Minus, Trash2, LogOut, RefreshCw
} from "lucide-react"
import { toast, Toaster } from "sonner"

interface User {
    id: string
    company_name: string
    business_description: string
    industry: string
    credits: number
    credits_used: number
    created_at: string
}

interface AuthUser {
    id: string
    email: string
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
    authUserCount: number
    proposalStats: { total: number; completed: number; failed: number; queued: number }
    creditStats: { total: number; used: number }
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [adminToken, setAdminToken] = useState<string | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [authUsers, setAuthUsers] = useState<AuthUser[]>([])
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [stats, setStats] = useState<Stats>({
        userCount: 0,
        authUserCount: 0,
        proposalStats: { total: 0, completed: 0, failed: 0, queued: 0 },
        creditStats: { total: 0, used: 0 }
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "proposals">("overview")

    // Check for admin token on load
    useEffect(() => {
        const token = localStorage.getItem("bidswipe_admin_token")

        if (!token) {
            window.location.href = "/admin/login"
            return
        }

        // Validate token
        try {
            const data = JSON.parse(atob(token))
            if (Date.now() > data.exp) {
                localStorage.removeItem("bidswipe_admin_token")
                window.location.href = "/admin/login"
                return
            }
            setAdminToken(token)
        } catch {
            localStorage.removeItem("bidswipe_admin_token")
            window.location.href = "/admin/login"
        }
    }, [])

    // Load data when token is available
    useEffect(() => {
        if (adminToken) {
            loadData()
        }
    }, [adminToken])

    const loadData = async () => {
        if (!adminToken) return
        setLoading(true)

        try {
            const res = await fetch("/api/admin/auth", {
                headers: {
                    "Authorization": `Admin ${adminToken}`
                }
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem("bidswipe_admin_token")
                    window.location.href = "/admin/login"
                    return
                }
                throw new Error(data.error || "Failed to load data")
            }

            setUsers(data.users || [])
            setAuthUsers(data.authUsers || [])
            setProposals(data.proposals || [])
            setStats(data.stats || {
                userCount: 0,
                authUserCount: 0,
                proposalStats: { total: 0, completed: 0, failed: 0, queued: 0 },
                creditStats: { total: 0, used: 0 }
            })

            console.log(`[Admin] Loaded: ${data.users?.length} profiles, ${data.authUsers?.length} auth users`)

        } catch (err: unknown) {
            console.error("[Admin] Load error:", err)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("bidswipe_admin_token")
        window.location.href = "/admin/login"
    }

    // Create profile for auth user without one
    const handleCreateProfile = async (authUser: AuthUser, credits: number) => {
        if (!adminToken) return

        try {
            const res = await fetch("/api/admin/profiles", {
                method: "POST",
                headers: {
                    "Authorization": `Admin ${adminToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: authUser.id,
                    email: authUser.email,
                    credits
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to create profile")
            }

            toast.success(`Profile created with ${credits} credits`)
            loadData()

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create profile"
            toast.error(message)
        }
    }

    // Adjust credits for a user
    const handleAdjustCredits = async (userId: string, amount: number) => {
        if (!adminToken) return

        try {
            const res = await fetch("/api/admin/profiles", {
                method: "PATCH",
                headers: {
                    "Authorization": `Admin ${adminToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId, creditAdjustment: amount })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to adjust credits")
            }

            toast.success(`Credits ${amount > 0 ? 'added' : 'removed'}`)
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, credits: Math.max(0, u.credits + amount) } : u
            ))

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to adjust credits"
            toast.error(message)
        }
    }

    // Get auth users without profiles
    const usersWithoutProfiles = authUsers.filter(au =>
        !users.some(u => u.id === au.id)
    )

    const filteredUsers = users.filter(u =>
        (u.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.industry || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredMissingUsers = usersWithoutProfiles.filter(u =>
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <Toaster richColors position="top-center" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                        <p className="text-xs text-white/40">BidSwipe Admin</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw className="w-5 h-5 text-white/60" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {["overview", "users", "proposals"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as typeof activeTab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? "bg-primary text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5 text-primary" />
                                <span className="text-white/60 text-sm">Total Users</span>
                            </div>
                            <div className="text-3xl font-black">{stats.userCount}</div>
                            <div className="text-xs text-white/40 mt-1">{stats.authUserCount} in auth</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-5 h-5 text-secondary" />
                                <span className="text-white/60 text-sm">Total Proposals</span>
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
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                <span className="text-white/60 text-sm">Success Rate</span>
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
                                <CreditCard className="w-5 h-5 text-amber-400" />
                                <span className="text-white/60 text-sm">Credits Used</span>
                            </div>
                            <div className="text-3xl font-black">{stats.creditStats.used}</div>
                            <div className="text-xs text-white/40 mt-1">{stats.creditStats.total} remaining</div>
                        </motion.div>
                    </div>

                    {/* Proposal Status */}
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
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Users Table */}
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
                                                <span className="w-8 text-center font-bold">{user.credits || 0}</span>
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
                                                onClick={() => handleAdjustCredits(user.id, 50)}
                                                className="px-3 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg mr-2"
                                            >
                                                +50
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Auth Users Without Profiles */}
                    {filteredMissingUsers.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-amber-500/20 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <h3 className="font-bold text-amber-400">
                                    Auth Users Without Profiles ({filteredMissingUsers.length})
                                </h3>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-amber-500/10">
                                        <th className="text-left p-4 text-xs text-white/40 uppercase">Email</th>
                                        <th className="text-left p-4 text-xs text-white/40 uppercase">Auth ID</th>
                                        <th className="text-left p-4 text-xs text-white/40 uppercase">Created</th>
                                        <th className="text-right p-4 text-xs text-white/40 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMissingUsers.map(authUser => (
                                        <tr key={authUser.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="p-4">
                                                <div className="font-medium text-amber-200">{authUser.email}</div>
                                            </td>
                                            <td className="p-4 text-white/40 text-xs font-mono">{authUser.id.slice(0, 8)}...</td>
                                            <td className="p-4 text-white/40 text-sm">
                                                {new Date(authUser.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleCreateProfile(authUser, 50)}
                                                        className="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg"
                                                    >
                                                        +50 Credits
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                                        <div className="font-medium truncate max-w-[300px]">
                                            {proposal.tender_title || "Untitled"}
                                        </div>
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
                                        {new Date(proposal.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
