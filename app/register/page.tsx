"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Link as LinkIcon, UserCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [companyUrl, setCompanyUrl] = useState('')
    const [aboutCompany, setAboutCompany] = useState('')

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
                        first_name: fullName // Storing name in metadata
                    }
                }
            })

            if (authError) throw authError

            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                toast.error("Account exists", { description: "Please login with this email." })
                setLoading(false)
                return
            }

            // CRITICAL CHECK: Did we get a session? (i.e. is Auto-Confirm enabled?)
            // If NOT, we must stop and tell the user to verify email.
            if (authData.user && !authData.session) {
                toast.info("Verification Link Sent", {
                    description: "Check your email to verify account before logging in.",
                    duration: 6000,
                    icon: <Mail className="text-secondary" />
                })
                setLoading(false)
                return
            }

            // 2. Create Profile Entry (Only if we have a session AND user is defined)
            if (authData.session && authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        company_name: "My Company",
                        website: companyUrl,
                        business_description: aboutCompany,
                        updated_at: new Date().toISOString()
                    })

                if (profileError) {
                    console.error("Profile creation failed", profileError)
                }

                toast.success("Account Created", {
                    description: "Welcome to the network.",
                })

                // Redirect
                router.refresh()
                setTimeout(() => {
                    window.location.href = '/tenders'
                }, 800)
            }

        } catch (err: any) {
            console.error("Registration error:", err)
            toast.error("Registration Failed", {
                description: err.message || "Could not create account.",
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
                            BidGuard <span className="text-secondary text-glow-red">ID</span>
                        </h1>
                    </Link>
                    <p className="text-white/50 text-sm tracking-widest uppercase">
                        Create Operative Account
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

                    <div className="border-t border-white/5 my-1" />

                    {/* Company URL */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider ml-1">Company URL</label>
                        <div className="relative group">
                            <LinkIcon className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-secondary transition-colors" />
                            <input
                                type="url"
                                required
                                className="cyber-input w-full pl-12 h-12 bg-black/60 focus:bg-black/80"
                                placeholder="https://mycompany.com"
                                value={companyUrl}
                                onChange={e => setCompanyUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* About Company */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider ml-1">About Company (Public)</label>
                        <div className="relative group">
                            <FileText className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within:text-secondary transition-colors" />
                            <textarea
                                className="cyber-input w-full pl-12 h-[100px] resize-none leading-relaxed py-3 bg-black/60 focus:bg-black/80"
                                placeholder="We specialize in..."
                                value={aboutCompany}
                                onChange={e => setAboutCompany(e.target.value)}
                            />
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
                                    Complete Registration
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                </form>

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-white/40 hover:text-primary text-sm transition-colors uppercase tracking-wider">
                        Already have an account? Login
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
