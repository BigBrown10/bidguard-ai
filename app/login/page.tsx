"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!supabase) throw new Error("Supabase client not initialized")

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error

            toast.success("Identity Verified", {
                description: "Accessing secure environment...",
                icon: <CheckCircle2 className="text-secondary" />
            })

            window.location.href = '/'

        } catch (err: any) {
            console.error("Auth error:", err)
            toast.error("Access Denied", {
                description: err.message || "Invalid credentials provided.",
                icon: <AlertTriangle className="text-red-500" />
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <Toaster position="top-center" theme="dark" closeButton richColors />

            {/* Animated Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-1000" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel p-8 md:p-10 relative z-10"
            >
                <div className="text-center mb-8">
                    <Link href="/">
                        <h1 className="text-3xl font-black uppercase tracking-tighter cursor-pointer mb-2">
                            BidSwipe <span className="text-secondary text-glow-red">ID</span>
                        </h1>
                    </Link>
                    <p className="text-white/50 text-sm tracking-widest uppercase">
                        Authenticate Access
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="email"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-none py-3 pl-12 pr-4 text-white placeholder-white/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-secondary transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-none py-3 pl-12 pr-12 text-white placeholder-white/20 focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-white/30 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            disabled={loading}
                            className="w-full cyber-button h-12 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Login
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-4">
                    <div className="text-white/40 text-xs uppercase tracking-wider">Don't have an account?</div>

                    <Link href="/register" className="w-full">
                        <button className="w-full border border-white/20 hover:border-primary hover:text-primary text-white/70 h-12 flex items-center justify-center gap-2 transition-all uppercase text-sm font-bold tracking-widest">
                            <UserPlus className="w-4 h-4" />
                            Create Account
                        </button>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
