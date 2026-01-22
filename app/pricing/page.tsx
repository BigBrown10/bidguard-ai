"use client"

import { Header } from "@/components/Header"
import { motion } from "framer-motion"

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 relative overflow-hidden">
            <Header />

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <main className="container mx-auto px-6 py-32 flex flex-col items-center justify-center text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                        Enterprise <span className="text-primary text-glow">Pricing</span>
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12">
                        Advanced autonomous procurement capabilities for enterprise teams.
                        Pay only for the bids you win.
                    </p>

                    <div className="inline-block border border-white/10 bg-white/5 backdrop-blur-md px-8 py-4 rounded-lg">
                        <span className="text-secondary font-bold tracking-widest uppercase animate-pulse">
                            Coming Soon
                        </span>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
