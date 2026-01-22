"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export type LogEntry = {
    id: string
    source: "PERPLEXITY" | "RED_TEAM" | "HUMANIZER" | "SYSTEM"
    message: string
    timestamp: Date
}

interface IntelligenceFeedProps {
    logs: LogEntry[]
    className?: string
}

const sourceColors: Record<string, string> = {
    PERPLEXITY: "text-blue-400",
    RED_TEAM: "text-red-400",
    HUMANIZER: "text-green-400",
    SYSTEM: "text-gray-400"
}

const sourceLabels: Record<string, string> = {
    PERPLEXITY: "[PERPLEXITY]",
    RED_TEAM: "[RED TEAM]",
    HUMANIZER: "[HUMANIZER]",
    SYSTEM: "[SYSTEM]"
}

export function IntelligenceFeed({ logs, className }: IntelligenceFeedProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new logs
    React.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div
            ref={containerRef}
            className={`bg-black/80 rounded-2xl border border-white/10 p-4 font-mono text-xs overflow-y-auto max-h-64 ${className}`}
        >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/50 uppercase tracking-widest text-[10px]">Intelligence Feed</span>
            </div>

            <AnimatePresence>
                {logs.length === 0 ? (
                    <p className="text-white/30 italic">Awaiting agent activity...</p>
                ) : (
                    logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2 mb-1 leading-relaxed"
                        >
                            <span className={`font-bold shrink-0 ${sourceColors[log.source]}`}>
                                {sourceLabels[log.source]}
                            </span>
                            <span className="text-white/70">{log.message}</span>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>

            {/* Blinking cursor */}
            <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1" />
        </div>
    )
}
