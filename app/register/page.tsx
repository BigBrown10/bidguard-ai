"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Form State - simplified to essentials only
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!supabase) throw new Error("Supabase client not initialized")

            // 1. Sign Up
            const { error: authError, data: authData } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: fullName
                    }
                }
            })

            if (authError) throw authError

            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                toast.error("Account exists", { description: "Please login with this email." })
                setLoading(false)
                return
            }

            // Check if email verification required
            if (authData.user && !authData.session) {
                toast.info("Verification Link Sent", {
                    description: "Check your email to verify account before logging in.",
                    duration: 6000,
                    icon: <Mail className="text-secondary" />
                })

                setTimeout(() => {
                    router.push('/login')
                }, 4000)

                setLoading(false)
                return
            }

            // 2. Create empty profile - company details will be collected in onboarding gate
            if (authData.session && authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        onboarding_complete: false, // Flag to trigger company profile gate
                        updated_at: new Date().toISOString()
                    })

                if (profileError) {
                    console.error("Profile creation failed", profileError)
                }

                toast.success("Account Created!", {
                    description: "Let's set up your company profile.",
                })

                // Redirect to tenders - CompanyDetailsGate will appear
                router.refresh()
                setTimeout(() => {
                    window.location.href = '/tenders'
                }, 800)
            }

        } catch (err: unknown) {
            console.error("Registration error:", err)
            toast.error("Registration Failed", {
                description: err instanceof Error ? err.message : "Could not create account.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
            <Toaster position="top-center" theme="dark" closeButton richColors />

            {/* Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel p-8 md:p-12 relative z-10 border border-white/10"
            >
                <div className="text-center mb-8">
                    <Link href="/">
                        <h1 className="text-3xl font-black uppercase tracking-tighter cursor-pointer mb-2">
                            BidGuard <span className="text-secondary text-glow-red">AI</span>
                        </h1>
                    </Link>
                    <p className="text-white/50 text-sm tracking-widest uppercase">
                        Create Your Account
                    </p>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-5">

                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider ml-1">Full Name</label>
                        <div className="relative group">
                            <UserCircle className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                required
                                className="cyber-input w-full pl-12 h-12 bg-black/60 focus:bg-black/80"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="email"
                                required
                                className="cyber-input w-full pl-12 h-12 bg-black/60 focus:bg-black/80"
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="cyber-input w-full pl-12 pr-12 h-12 bg-black/60 focus:bg-black/80"
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

                    <div className="pt-4">
                        <button
                            disabled={loading}
                            className="w-full cyber-button h-14 flex items-center justify-center gap-2 group text-lg"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                </form>

                {/* Social Login Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30 uppercase tracking-widest">Or sign up with</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Social Auth Buttons */}
                <div className="grid grid-cols-2 gap-3">
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
                                toast.error("Google Sign Up Failed", { description: error.message })
                                setLoading(false)
                            }
                        }}
                        className="h-12 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-none flex items-center justify-center gap-2 transition-all border border-white/20"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
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
                                toast.error("LinkedIn Sign Up Failed", { description: error.message })
                                setLoading(false)
                            }
                        }}
                        className="h-12 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-none flex items-center justify-center gap-2 transition-all"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-white/40 hover:text-primary text-sm transition-colors uppercase tracking-wider">
                        Already have an account? Login
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

