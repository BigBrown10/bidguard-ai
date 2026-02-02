"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, ArrowRight, Loader2, Shield, Lock, CheckCircle } from "lucide-react"
import { toast, Toaster } from "sonner"

export default function AdminLoginPage() {
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [adminToken, setAdminToken] = useState<string | null>(null)

    // Check for existing admin token on load
    useEffect(() => {
        const stored = localStorage.getItem("bidswipe_admin_token")
        if (stored) {
            // Validate token
            try {
                const data = JSON.parse(atob(stored))
                if (Date.now() < data.exp) {
                    setAdminToken(stored)
                } else {
                    localStorage.removeItem("bidswipe_admin_token")
                }
            } catch {
                localStorage.removeItem("bidswipe_admin_token")
            }
        }
    }, [])

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (adminToken) {
            window.location.href = "/admin/dashboard"
        }
    }, [adminToken])

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to send code")
            }

            setCodeSent(true)
            toast.success("Code Sent!", {
                description: "Check your email for the 6-digit code",
                duration: 10000
            })

            // In dev mode, show the code for testing
            if (data.devCode) {
                toast.info(`Dev Mode Code: ${data.devCode}`, { duration: 30000 })
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to send code"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Invalid code")
            }

            // Store admin token
            localStorage.setItem("bidswipe_admin_token", data.adminToken)
            setAdminToken(data.adminToken)

            toast.success("Access Granted!", {
                description: "Redirecting to admin dashboard..."
            })

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "/admin/dashboard"
            }, 1000)

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid code"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            <Toaster richColors position="top-center" />

            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a1020_0%,#000_100%)]" />
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-white/50 text-sm mt-2">Enter your admin email to receive access code</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">

                    {!codeSent ? (
                        // Step 1: Enter Email
                        <form onSubmit={handleSendCode} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-white/70 tracking-wider">
                                    Admin Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@bidswipe.xyz"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Send Access Code
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        // Step 2: Enter Code
                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
                                    <Lock className="w-6 h-6 text-primary" />
                                </div>
                                <p className="text-white/60 text-sm">
                                    Enter the 6-digit code sent to<br />
                                    <span className="text-primary font-medium">{email}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-white/70 tracking-wider">
                                    Access Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/30 focus:border-primary focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Verify & Access
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setCodeSent(false); setCode("") }}
                                className="w-full text-center text-white/40 hover:text-white text-sm"
                            >
                                Use different email
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-white/30 text-xs mt-6">
                    Only authorized admin emails can access this portal
                </p>
            </motion.div>
        </div>
    )
}
