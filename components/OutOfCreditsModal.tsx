"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Sparkles, X } from "lucide-react"
import Link from "next/link"

interface OutOfCreditsModalProps {
    isOpen: boolean
    onClose: () => void
    creditsUsed?: number
}

export function OutOfCreditsModal({ isOpen, onClose, creditsUsed = 3 }: OutOfCreditsModalProps) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 max-w-md w-full relative overflow-hidden">

                            {/* Background Glow */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[80px]" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 mx-auto">
                                <CreditCard className="w-8 h-8 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    Out of Credits
                                </h2>
                                <p className="text-white/50 mb-6 leading-relaxed">
                                    You've used all <span className="text-white font-semibold">{creditsUsed}</span> free proposal credits.
                                    Subscribe to continue generating winning bids.
                                </p>

                                {/* Stats */}
                                <div className="flex justify-center gap-8 mb-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-white">{creditsUsed}</div>
                                        <div className="text-xs text-white/40 uppercase tracking-wide">Used</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-red-400">0</div>
                                        <div className="text-xs text-white/40 uppercase tracking-wide">Remaining</div>
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <div className="space-y-3">
                                    <Link href="/pricing" className="block">
                                        <button className="w-full h-14 rounded-full bg-gradient-to-b from-white to-gray-200 text-black font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                                            <Sparkles className="w-5 h-5" />
                                            Upgrade Now
                                        </button>
                                    </Link>
                                    <button
                                        onClick={onClose}
                                        className="w-full h-12 rounded-full text-white/60 hover:text-white transition-colors text-sm"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
