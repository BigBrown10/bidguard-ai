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

            // Successful login
            toast.success("Identity Verified", {
                description: "Accessing secure environment...",
                icon: <CheckCircle2 className="text-secondary" />
            })

            // Force router refresh and push
            // Using hard location set to ensure middleware re-runs with fresh cookies
            router.refresh()
            setTimeout(() => {
                window.location.href = '/'
            }, 800)

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

                {/* Social Login Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30 uppercase tracking-widest">Or continue with</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Social Auth Buttons */}
                <div className="space-y-3">
                    {/* Google OAuth */}
                    <button
                        type="button"
                        onClick={async () => {
                            if (!supabase) return
                            setLoading(true)
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${window.location.origin}/auth/callback`
                                }
                            })
                            if (error) {
                                toast.error("Google Login Failed", { description: error.message })
                                setLoading(false)
                            }
                        }}
                        className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-none flex items-center justify-center gap-3 transition-all border border-white/20"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* LinkedIn OAuth */}
                    <button
                        type="button"
                        onClick={async () => {
                            if (!supabase) return
                            setLoading(true)
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'linkedin_oidc',
                                options: {
                                    redirectTo: `${window.location.origin}/auth/callback`
                                }
                            })
                            if (error) {
                                toast.error("LinkedIn Login Failed", { description: error.message })
                                setLoading(false)
                            }
                        }}
                        className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-none flex items-center justify-center gap-3 transition-all"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        Continue with LinkedIn
                    </button>
                </div>

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
