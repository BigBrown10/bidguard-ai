"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, ShieldAlert, AlertTriangle, FileText, Loader2 } from "lucide-react"
import { QualificationResult } from "@/app/tenders/qualify"
import { useRouter } from "next/navigation"

interface QualificationModalProps {
    isOpen: boolean
    onClose: () => void
    result: QualificationResult | null
    isLoading: boolean
    onProceed: () => void
    onShred: () => void
}

export function QualificationModal({ isOpen, onClose, result, isLoading, onProceed, onShred }: QualificationModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-950/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    Strategic Advisory
                                </h2>
                                <p className="text-sm text-zinc-400">Bid/No-Bid Analysis</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="p-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                <p className="text-zinc-400 animate-pulse">Consulting the Oracle...</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-8">
                                {/* Traffic Light & Score */}
                                <div className="flex justify-center mb-8">
                                    <div className={`
                                        relative px-8 py-4 rounded-full border-2 flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.3)]
                                        ${result.traffic_light === 'GREEN' ? 'border-green-500/50 bg-green-500/10 text-green-400' : ''}
                                        ${result.traffic_light === 'AMBER' ? 'border-white/20 bg-white/5 text-white' : ''}
                                        ${result.traffic_light === 'RED' ? 'border-red-500/50 bg-red-500/10 text-red-400' : ''}
                                    `}>
                                        <div className={`w-4 h-4 rounded-full animate-pulse ${result.traffic_light === 'GREEN' ? 'bg-green-500' :
                                            result.traffic_light === 'AMBER' ? 'bg-white' :
                                                'bg-red-500'
                                            }`} />
                                        <div className="text-center">
                                            <div className="text-xs uppercase tracking-widest font-bold opacity-70">Recommendation</div>
                                            <div className="text-2xl font-black">{result.recommendation}</div>
                                        </div>

                                        <div className="w-px h-10 bg-current opacity-20 mx-2" />

                                        <div className="text-center">
                                            <div className="text-xs uppercase tracking-widest font-bold opacity-70">Confidence</div>
                                            <div className="text-2xl font-black">{result.confidence_score}%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reasoning Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Strategic Reasoning</h3>
                                    <div className="grid gap-3">
                                        {result.reasoning.map((reason, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/50 border border-white/5">
                                                <div className="mt-1">
                                                    {result.traffic_light === 'GREEN' && <Check className="w-4 h-4 text-green-500" />}
                                                    {result.traffic_light === 'AMBER' && <AlertTriangle className="w-4 h-4 text-white" />}
                                                    {result.traffic_light === 'RED' && <X className="w-4 h-4 text-red-500" />}
                                                </div>
                                                <span className="text-zinc-300 text-sm leading-relaxed">{reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Strategic Advice */}
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-primary-foreground">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldAlert className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-xs uppercase tracking-widest text-primary">Advisor's Note</span>
                                    </div>
                                    <p className="text-sm text-zinc-300 italic">"{result.strategic_advice}"</p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer Actions */}
                    {!isLoading && result && (
                        <div className="p-6 border-t border-white/10 bg-zinc-950/50 flex justify-end gap-4">
                            {result.traffic_light === 'RED' ? (
                                <>
                                    <button
                                        onClick={onProceed}
                                        className="px-6 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Ignore & Proceed (Risky)
                                    </button>
                                    <button
                                        onClick={onShred}
                                        className="px-6 py-3 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Shred It
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onShred}
                                        className="px-6 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Pass
                                    </button>
                                    <button
                                        onClick={onProceed}
                                        className={`
                                            px-8 py-3 rounded-lg text-sm font-bold text-black shadow-lg transition-all flex items-center gap-2
                                            ${result.traffic_light === 'GREEN'
                                                ? 'bg-green-500 hover:bg-green-400 shadow-green-500/20'
                                                : 'bg-white hover:bg-gray-200 text-black shadow-white/10'}
                                        `}
                                    >
                                        {result.traffic_light === 'GREEN' ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Auto-Pilot Mode 🚀
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4" />
                                                Proceed with Caution
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
