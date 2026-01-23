"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface IdeaInjectionModalProps {
    isOpen: boolean
    tenderTitle: string
    onSubmit: (ideas: string) => void
    onSkip: () => void
    onClose: () => void
}

export function IdeaInjectionModal({
    isOpen,
    tenderTitle,
    onSubmit,
    onSkip,
    onClose
}: IdeaInjectionModalProps) {
    const [ideas, setIdeas] = React.useState("")
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [isOpen])

    const handleSubmit = () => {
        onSubmit(ideas.trim())
        setIdeas("")
    }

    const handleSkip = () => {
        onSkip()
        setIdeas("")
    }

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
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
                    >
                        <div className="bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-white/5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">Autonomous Bid</h2>
                                            <p className="text-xs text-white/50">Saved to your queue</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/30 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-white/60 mt-4 line-clamp-2">
                                    {tenderTitle}
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <label className="block">
                                    <span className="text-base font-bold text-primary">
                                        Your Strategy / Key Points
                                    </span>
                                    <span className="text-sm text-white/50 ml-2">(Optional)</span>
                                </label>
                                <p className="text-sm text-white/60 -mt-2">
                                    Tell the AI what to focus on. If you leave this blank, the AI will invent a strategy.
                                </p>
                                <textarea
                                    ref={textareaRef}
                                    value={ideas}
                                    onChange={(e) => setIdeas(e.target.value)}
                                    placeholder="e.g. 'Focus on our local presence in Derby', 'Highlight our apprenticeship scheme', 'We want to undercut on price'"
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-primary/50 transition-colors text-sm"
                                />
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-2 flex gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                                >
                                    Skip & Generate
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!ideas.trim()}
                                    className="flex-1"
                                >
                                    Submit & Generate
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
