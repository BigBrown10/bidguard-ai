"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
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
                        Unlock <span className="text-primary text-glow">God Mode</span>
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">
                        Scale your win rate with the world's most advanced autonomous bid writer.
                        Select the power level that fits your ambition.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Tier 1: Pro */}
                    <PricingCard
                        title="Pro"
                        price="£2,500"
                        period="/month"
                        description="For boutique consultancies scaling up."
                        features={[
                            "3 Autonomous Bids / mo",
                            "Basic AI Writer Access",
                            "5 Team Members",
                            "Standard Support"
                        ]}
                        delay={0.1}
                    />

                    {/* Tier 2: Growth (Highlighted) */}
                    <PricingCard
                        title="Growth"
                        price="£6,000"
                        period="/month"
                        description="For agencies dominating the mid-market."
                        features={[
                            "Unlimited Autonomous Bids",
                            "\"Librarian\" Research Agent",
                            "War Room Collaboration",
                            "Priority Intelligence Feed",
                            "Dedicated Success Manager"
                        ]}
                        highlighted={true}
                        delay={0.2}
                    />

                    {/* Tier 3: Empire */}
                    <PricingCard
                        title="Empire"
                        price="1-3%"
                        period="Success Fee"
                        description="For Defense Primes & Global Contractors."
                        features={[
                            "Full \"God Mode\" Auto-Pilot",
                            "Private LLM Hosting (Local)",
                            "Audit Logs & SSO",
                            "Adversarial \"Red Team\" Agent",
                            "24/7 Engineering Access"
                        ]}
                        delay={0.3}
                    />
                </div>
            </main>
        </div >
    )
}

function PricingCard({ title, price, period, description, features, highlighted = false, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`relative p-8 rounded-2xl border flex flex-col h-full ${highlighted ? 'bg-white/5 border-primary shadow-2xl shadow-primary/20' : 'bg-black/40 border-white/10 hover:border-white/20'}`}
        >
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wider">
                    Most Popular
                </div>
            )}

            <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-white/80'}`}>{title}</h3>
            <div className="mb-4">
                <span className="text-4xl font-black text-white">{price}</span>
                <span className="text-white/40 text-sm ml-1">{period}</span>
            </div>
            <p className="text-white/50 text-sm mb-8">{description}</p>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                        <CheckIcon className={`w-5 h-5 shrink-0 ${highlighted ? 'text-primary' : 'text-white/30'}`} />
                        {feature}
                    </li>
                ))}
            </ul>

            <button className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all ${highlighted
                ? 'bg-primary text-black hover:bg-primary/90 hover:scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                Get Started
            </button>
        </motion.div>
    )
}

function CheckIcon({ className }: { className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    )
}
