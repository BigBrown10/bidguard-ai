"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Zap, Rocket, Crown, Loader2 } from "lucide-react"
import { toast, Toaster } from "sonner"
import { supabase } from "@/lib/supabase"

const PACKAGES = [
    {
        id: "starter",
        name: "Starter",
        credits: 10,
        price: 19,
        icon: Zap,
        description: "Perfect for trying out BidSwipe",
        features: [
            "10 AI Proposal Credits",
            "All proposal templates",
            "PDF export",
            "Email support"
        ]
    },
    {
        id: "pro",
        name: "Pro",
        credits: 50,
        price: 79,
        icon: Rocket,
        description: "For growing consultancies",
        features: [
            "50 AI Proposal Credits",
            "All proposal templates",
            "Priority processing",
            "Red Team analysis",
            "Priority support"
        ],
        highlighted: true
    },
    {
        id: "enterprise",
        name: "Enterprise",
        credits: 200,
        price: 249,
        icon: Crown,
        description: "For agencies at scale",
        features: [
            "200 AI Proposal Credits",
            "All proposal templates",
            "Fastest processing",
            "Advanced analytics",
            "Dedicated support",
            "Team collaboration"
        ]
    }
]

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

    useEffect(() => {
        const getUser = async () => {
            if (!supabase) return
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    const handlePurchase = async (packageId: string) => {
        if (!user) {
            toast.error("Please log in first", {
                description: "You need to be logged in to purchase credits"
            })
            window.location.href = "/login"
            return
        }

        setLoading(packageId)

        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packageId,
                    userId: user.id,
                    userEmail: user.email,
                    returnUrl: window.location.origin
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to create checkout")
            }

            // Redirect to Stripe checkout
            if (data.url) {
                window.location.href = data.url
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to start checkout"
            toast.error(message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
            <Toaster richColors position="top-center" />

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <main className="container mx-auto px-6 py-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                        Buy <span className="text-primary text-glow">Credits</span>
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">
                        Each credit generates one AI-powered proposal.
                        Choose the package that fits your needs.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PACKAGES.map((pkg, index) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                            className={`relative p-8 rounded-2xl border flex flex-col h-full ${pkg.highlighted
                                    ? 'bg-white/5 border-primary shadow-2xl shadow-primary/20'
                                    : 'bg-black/40 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {pkg.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wider">
                                    Best Value
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pkg.highlighted ? 'bg-primary/20' : 'bg-white/10'
                                    }`}>
                                    <pkg.icon className={`w-6 h-6 ${pkg.highlighted ? 'text-primary' : 'text-white/60'}`} />
                                </div>
                                <h3 className={`text-2xl font-bold ${pkg.highlighted ? 'text-white' : 'text-white/80'}`}>
                                    {pkg.name}
                                </h3>
                            </div>

                            <div className="mb-4">
                                <span className="text-5xl font-black text-white">${pkg.price}</span>
                                <span className="text-white/40 text-sm ml-2">one-time</span>
                            </div>

                            <div className="mb-6 px-4 py-3 bg-white/5 rounded-xl text-center">
                                <span className="text-2xl font-bold text-primary">{pkg.credits}</span>
                                <span className="text-white/60 ml-2">credits</span>
                                <div className="text-xs text-white/40 mt-1">
                                    ${(pkg.price / pkg.credits).toFixed(2)} per proposal
                                </div>
                            </div>

                            <p className="text-white/50 text-sm mb-6">{pkg.description}</p>

                            <ul className="space-y-3 mb-8 flex-1">
                                {pkg.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                                        <Check className={`w-5 h-5 shrink-0 ${pkg.highlighted ? 'text-primary' : 'text-white/30'}`} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={loading === pkg.id}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${pkg.highlighted
                                        ? 'bg-primary text-black hover:bg-primary/90 hover:scale-[1.02]'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {loading === pkg.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Buy {pkg.credits} Credits
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p className="text-white/30 text-sm mb-4">Secure payment powered by</p>
                    <div className="flex items-center justify-center gap-6">
                        <div className="px-4 py-2 bg-white/5 rounded-lg text-white/50 font-medium">
                            <svg className="w-12 h-6 inline-block" viewBox="0 0 60 25" fill="currentColor">
                                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02.96-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 9.23c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-5.13L32.37 0v3.5l-4.13.88V.44zM22.5 9.8c.12-.38.74-1.75 2.51-1.93V4.22c-2.09.09-3.53 1.02-4.16 2.04L20.8 4.7h-3.41v15.3h4.11v-7.36c0-1.9.95-2.85 1-2.85zm-9.42 10.5H9V5.57h4.08v14.73zM8.98 0L13.1.44v3.5l-4.12.88V0zM7.75 5.57l-4 14.73H0L4.03 5.57h3.72z" />
                            </svg>
                        </div>
                        <div className="text-white/30 text-xs">
                            256-bit SSL Encryption
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
