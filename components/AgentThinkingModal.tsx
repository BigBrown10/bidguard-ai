"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, FileSearch, ShieldAlert, PenTool, CheckCircle2, Loader2, Sparkles } from "lucide-react"

interface AgentThinkingModalProps {
    isOpen: boolean
    tenderTitle: string
    onComplete?: () => void
    onClose?: () => void
}

const steps = [
    {
        id: "research",
        title: "Ingesting Buyer Intelligence",
        icon: Building2,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        duration: 2000
    },
    {
        id: "rfp",
        title: "Deconstructing Requirements",
        icon: FileSearch,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        duration: 1500
    },
    {
        id: "strategy",
        title: "Formulating Win Themes",
        icon: Sparkles,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        duration: 1500
    },
    {
        id: "draft",
        title: "Agent Drafting Proposal",
        icon: PenTool,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        duration: 2000
    }
]

export function AgentThinkingModal({ isOpen, tenderTitle, onComplete, onClose }: AgentThinkingModalProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<string[]>([])

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStepIndex(0)
            setCompletedSteps([])
        }
    }, [isOpen])

    // Progress through steps
    useEffect(() => {
        if (!isOpen) return

        const currentStep = steps[currentStepIndex]
        if (!currentStep) {
            // All steps learned
            const timer = setTimeout(() => {
                onComplete?.()
            }, 800)
            return () => clearTimeout(timer)
        }

        const timer = setTimeout(() => {
            setCompletedSteps(prev => [...prev, currentStep.id])
            setCurrentStepIndex(prev => prev + 1)
        }, currentStep.duration)

        return () => clearTimeout(timer)
    }, [isOpen, currentStepIndex, onComplete])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                >
                    <div className="w-full max-w-md">

                        {/* Header */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-center mb-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/50 mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                AGENT_ACTIVE
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Initialize Bid Protocol</h2>
                            <p className="text-white/40 text-sm line-clamp-1">{tenderTitle}</p>
                        </motion.div>

                        {/* Steps */}
                        <div className="space-y-4">
                            {steps.map((step, index) => {
                                const isCompleted = completedSteps.includes(step.id)
                                const isCurrent = index === currentStepIndex
                                const isPending = index > currentStepIndex

                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${isCurrent
                                                ? `bg-white/5 ${step.color.replace('text', 'border')} border-opacity-30`
                                                : isCompleted
                                                    ? 'bg-white/[0.02] border-white/5'
                                                    : 'bg-transparent border-transparent opacity-30'
                                            }`}
                                    >
                                        {/* Progress Bar Background for Current Step */}
                                        {isCurrent && (
                                            <motion.div
                                                layoutId="active-glow"
                                                className={`absolute inset-0 ${step.bg} opacity-20`}
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: step.duration / 1000, ease: "linear" }}
                                            />
                                        )}

                                        <div className="relative flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isCurrent || isCompleted ? step.bg : 'bg-white/5'
                                                }`}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className={`w-5 h-5 ${step.color}`} />
                                                ) : isCurrent ? (
                                                    <Loader2 className={`w-5 h-5 ${step.color} animate-spin`} />
                                                ) : (
                                                    <step.icon className="w-5 h-5 text-white/20" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <h3 className={`text-sm font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-white/60' : 'text-white/20'
                                                    }`}>
                                                    {step.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
