"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, Cpu, Search, FileText, Zap } from "lucide-react"

export function ThinkingTerminal() {
    const [step, setStep] = React.useState(0)

    const steps = [
        { text: "Ingesting RFP Documentation...", icon: FileText, color: "text-blue-400" },
        { text: "Deconstructing Requirements...", icon: Terminal, color: "text-purple-400" },
        { text: "Cross-Referencing Company Intelligence...", icon: Search, color: "text-yellow-400" },
        { text: "Simulating Compliant Strategy...", icon: Cpu, color: "text-green-400" },
        { text: "Generating Value-Add Propositions...", icon: Zap, color: "text-red-400" },
        { text: "Finalizing Strategy Architectures...", icon: Terminal, color: "text-white" }
    ]

    React.useEffect(() => {
        const interval = setInterval(() => {
            setStep(s => (s < steps.length - 1 ? s + 1 : s))
        }, 1500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-lg mx-auto font-mono text-sm relative">
            {/* Glass Container */}
            <div className="glass-panel p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden relative">

                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_4px,3px_100%]" />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent opacity-20 animate-pulse z-10" />

                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 relative z-30">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="ml-auto text-xs text-white/30 uppercase tracking-widest">Neural_Link_Active</span>
                </div>

                <div className="space-y-4 relative z-30 min-h-[160px]">
                    <AnimatePresence mode="popLayout">
                        {steps.map((s, i) => {
                            if (i > step) return null
                            const Icon = s.icon
                            const isCurrent = i === step
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: isCurrent ? 1 : 0.5, x: 0 }}
                                    className={`flex items-center gap-3 ${s.color}`}
                                >
                                    <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                                    <span className="tracking-wide">{s.text} <span className="animate-blink">{isCurrent ? "_" : ""}</span></span>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
