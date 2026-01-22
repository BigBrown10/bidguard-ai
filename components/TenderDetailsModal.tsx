"use client"

import { Tender } from "@/lib/mock-tenders"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, MapPin, PoundSterling, Building, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface TenderDetailsModalProps {
    tender: Tender | null
    onClose: () => void
}

export function TenderDetailsModal({ tender, onClose }: TenderDetailsModalProps) {
    if (!tender) return null

    return (
        <AnimatePresence>
            {tender && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-end md:items-center p-0 md:p-6"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            onClick={(e) => e.stopPropagation()}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-2xl bg-black border border-white/10 md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start sticky top-0 z-10 backdrop-blur-md">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 border border-primary/20">
                                        <ShieldCheck className="w-3 h-3" />
                                        {tender.sector}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white leading-tight pr-8">
                                        {tender.title}
                                    </h2>
                                    <p className="text-white/60 text-sm mt-1 flex items-center gap-2">
                                        <Building className="w-4 h-4" /> {tender.buyer}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                                {/* Key Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] uppercase text-white/40 mb-1 flex items-center gap-1"><PoundSterling className="w-3 h-3" /> Value</div>
                                        <div className="text-white font-bold text-sm md:text-base text-glow-green">{tender.value}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] uppercase text-white/40 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Deadline</div>
                                        <div className="text-white font-bold text-sm md:text-base text-glow-red">{tender.deadline}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] uppercase text-white/40 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</div>
                                        <div className="text-white font-bold text-sm md:text-base">{tender.location}</div>
                                    </div>
                                </div>

                                {/* Full Description */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">Description</h3>
                                    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
                                        {/* Simple formatting for now - in real app, might need HTML parser */}
                                        {tender.description.split('\n').map((p, i) => (
                                            <p key={i}>{p}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-lg flex gap-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-white/10 hover:bg-white/5 h-12"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                                <Button
                                    className="flex-[2] h-12 text-black bg-white hover:bg-white/90 font-bold uppercase tracking-widest"
                                    onClick={() => {
                                        // Save to local storage to pass complex/long data to Ingest page
                                        localStorage.setItem("pending_tender_import", JSON.stringify(tender))
                                        window.location.href = "/ingest"
                                    }}
                                >
                                    Draft Proposal
                                </Button>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
