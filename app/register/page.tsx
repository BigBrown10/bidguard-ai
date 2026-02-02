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
            // Use Server Action for Custom Email Flow
            const formData = new FormData()
            formData.append('email', email)
            formData.append('password', password)
            formData.append('fullName', fullName)

            // Dynamic import to avoid server-action-in-client-component build issues if any
            const { signupWithCustomEmail } = await import('@/app/auth/actions')
            const result = await signupWithCustomEmail(formData)

            if (result.error) {
                toast.error("Registration Failed", { description: result.error })
                setLoading(false)
                return
            }

            // Success Flow
            toast.success("Verification Link Sent", {
                description: "Check your email to verify account before logging in.",
                duration: 6000,
                icon: <Mail className="text-secondary" />
            })

            setTimeout(() => {
                router.push('/login')
            }, 4000)

        } catch (err: unknown) {
            console.error("Registration error:", err)
            toast.error("Registration Failed", {
                description: "An unexpected error occurred.",
            })
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
                            BidSwipe <span className="text-secondary text-glow-red">AI</span>
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
                                className="cyber-input w-full h-12 bg-black/60 focus:bg-black/80"
                                style={{ paddingLeft: '3rem' }}
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
                                className="cyber-input w-full h-12 bg-black/60 focus:bg-black/80"
                                style={{ paddingLeft: '3rem' }}
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
                                className="cyber-input w-full h-12 bg-black/60 focus:bg-black/80"
                                style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
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

                {/* Social Login Divider Removed as per request */}

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-white/40 hover:text-primary text-sm transition-colors uppercase tracking-wider">
                        Already have an account? Login
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

