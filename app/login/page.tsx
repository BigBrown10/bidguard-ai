"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!supabase) throw new Error("Supabase client not initialized")

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                router.push('/ingest')
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                })
                if (error) throw error
                // For now, assume auto-confirm is off or user needs to check email
                // But if auto-confirm is ON (dev mode), it might log them in.
                // Let's just try to login immediately after signup just in case, 
                // or show a "Check your email" message.
                router.push('/ingest')
            }

            router.refresh() // Refresh middleware
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
                        {isLogin ? "Authenticate Identity" : "Initialize New Operative"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider ml-1">Neuro-Link (Email)</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="email"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-none py-3 pl-12 pr-4 text-white placeholder-white/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                placeholder="agent@bidguard.ai"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider ml-1">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-secondary transition-colors" />
                            <input
                                type="password"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-none py-3 pl-12 pr-4 text-white placeholder-white/20 focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 text-sm flex items-center gap-2"
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {error}
                        </motion.div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full cyber-button h-12 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isLogin ? "Decrypt & Enter" : "Register Credentials"}
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
                        {isLogin ? "No Access Key? Request Clearance" : "Already an Agent? Authenticate"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
