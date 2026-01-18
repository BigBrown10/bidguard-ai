"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ProcessingHUDProps {
    status?: string // e.g. "Reasoning...", "Searching...", "Drafting..."
    isProcessing?: boolean
}

export function ProcessingHUD({ status = "Reasoning...", isProcessing = false }: ProcessingHUDProps) {
    return (
        <AnimatePresence>
            {isProcessing && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-xl backdrop-blur-md"
                >
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    </div>
                    <span className="font-medium tracking-wide">Agent Activity: {status}</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
