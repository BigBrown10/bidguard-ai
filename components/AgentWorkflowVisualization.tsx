"use client"

import { motion } from "framer-motion"
import { Building2, FileSearch, ShieldAlert, PenTool, ArrowRight, CheckCircle2 } from "lucide-react"

const steps = [
    {
        id: "research",
        title: "Company Research",
        description: "Ingesting your case studies, certifications, and tone of voice.",
        icon: Building2,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20"
    },
    {
        id: "rfp",
        title: "RFP Intelligence",
        description: "Deconstructing requirements and identifying hidden compliance traps.",
        icon: FileSearch,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20"
    },
    {
        id: "critic",
        title: "Red Team Critique",
        description: "Adversarial AI simulates evaluator scoring to find weaknesses.",
        icon: ShieldAlert,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20"
    },
    {
        id: "draft",
        title: "Autonomous Drafting",
        description: "Generating a compliant, winning proposal in your exact style.",
        icon: PenTool,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20"
    }
]

export function AgentWorkflowVisualization() {
    return (
        <div className="w-full max-w-5xl mx-auto py-20 px-4">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-sm font-semibold text-primary uppercase tracking-widest mb-3"
                >
                    How It Works
                </motion.h2>
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-black text-white tracking-tight"
                >
                    From Chaos to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Contract</span>.
                </motion.h3>
            </div>

            <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="relative group"
                        >
                            {/* Step Number Badge */}
                            <div className="absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center text-xs font-mono text-white/50 group-hover:border-white/30 transition-colors">
                                {index + 1}
                            </div>

                            {/* Card */}
                            <div className={`h-full rounded-2xl border ${step.border} ${step.bg} p-6 backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl`}>
                                {/* Internal Gradient Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className={`w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center mb-6`}>
                                    <step.icon className={`w-6 h-6 ${step.color}`} />
                                </div>

                                <h4 className="text-lg font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                                    {step.title}
                                </h4>

                                <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                                    {step.description}
                                </p>
                            </div>

                            {/* Arrow Connector (Mobile only - Desktop has the line) */}
                            {index < steps.length - 1 && (
                                <div className="md:hidden flex justify-center py-4 text-white/20">
                                    <ArrowRight className="w-6 h-6 rotate-90" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
