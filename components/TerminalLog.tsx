"use client"

import * as React from "react"
import { motion } from "framer-motion"

export interface LogEntry {
    id: string
    timestamp: string
    message: string
    type: "info" | "success" | "warning" | "error"
}

export function TerminalLog({ logs }: { logs: LogEntry[] }) {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div className="rounded-xl border border-black/10 bg-black text-white shadow-2xl overflow-hidden font-mono text-xs md:text-sm">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 bg-white/5">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-white/50">BidGuard Intelligence Terminal</span>
            </div>
            <div ref={scrollRef} className="h-[300px] overflow-y-auto p-4 space-y-2">
                {logs.length === 0 && (
                    <span className="text-white/30 animate-pulse">Initializing connection to Perplexity Sonar...</span>
                )}
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3"
                    >
                        <span className="text-white/40 shrink-0">[{log.timestamp}]</span>
                        <span className={
                            log.type === "success" ? "text-green-400" :
                                log.type === "warning" ? "text-yellow-400" :
                                    log.type === "error" ? "text-red-400" : "text-white/90"
                        }>
                            {log.type === "success" && "✓ "}
                            {log.message}
                        </span>
                    </motion.div>
                ))}
                <div className="h-4 w-2 animate-pulse bg-white/50" />
            </div>
        </div>
    )
}
