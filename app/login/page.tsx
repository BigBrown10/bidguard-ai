"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Toaster, toast } from 'sonner' // Requires sonner usually in layout, but we can add here locally or ensure global

export default function LoginPage() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!supabase) throw new Error("Supabase client not initialized")

            if (isLogin) {
                const { error, data } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error

                // Successful login
                toast.success("Identity Verified", {
                    description: "Accessing secure environment...",
                    icon: <CheckCircle2 className="text-secondary" />
                })

                // Force router refresh and push
                // Using hard location set to ensure middleware re-runs with fresh cookies
                router.refresh()
                setTimeout(() => {
                    window.location.href = '/ingest'
                }, 800)

            } else {
                const redirectUrl = typeof window !== 'undefined'
                    ? `${window.origin}/auth/callback`
                    : undefined

                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectUrl
                    }
                })
                if (error) throw error

                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    toast.error("Account exists", { description: "Please login with this email instead." })
                    setIsLogin(true)
                } else {
                    toast.success("Protocol Initiated", {
                        description: "Check your email to verify neural-link connection.",
                        icon: <Mail className="text-primary" />
                    })
                }
            }

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
            {/* Toaster for Notifications */}
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
                            BidGuard <span className="text-secondary text-glow-red">ID</span>
                        </h1>
                    </Link>
                    <p className="text-white/50 text-sm tracking-widest uppercase">
                        {isLogin ? "Authenticate" : "Create Account"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">

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

                    <button
                        disabled={loading}
                        className="w-full cyber-button h-12 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isLogin ? "Login" : "Register"}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white/40 hover:text-primary text-sm transition-colors uppercase tracking-wider"
                    >
                        {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
