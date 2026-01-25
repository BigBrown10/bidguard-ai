"use client"

import React from "react"
import { motion, useMotionValue, useTransform, AnimatePresence, Variants } from "framer-motion"
import { Tender } from "@/lib/mock-tenders"
import { Briefcase, Calendar, MapPin, PoundSterling, ShieldCheck } from "lucide-react"

interface TenderCardProps {
    tender: Tender;
    onSwipe: (direction: "left" | "right") => void;
    onInfo: () => void;
    index: number;
}

// Variants moved out of component to avoid recreation
const variants: Variants = {
    initial: { scale: 1, y: 0 },
    animate: { scale: 1, y: 0 },
    exit: (custom: any) => {
        if (custom === "left") {
            return {
                clipPath: "inset(100% 0 0 0)",
                transition: { duration: 0.4, ease: "easeInOut" as any }
            }
        }
        return {
            scale: 0.95,
            x: 200,
            opacity: 0,
            transition: { duration: 0.2 }
        }
    }
}

function TenderCardBase({ tender, onSwipe, onInfo, index }: TenderCardProps) {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-10, 10])
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
    const color = useMotionValue('#000000')
    const borderColor = useTransform(x, [-200, 0, 200], ['#ef4444', '#333333', '#22c55e'])

    const handleDragEnd = (_: any, info: any) => {
        const offset = info.offset.x
        const velocity = info.velocity.x

        if (offset < -100 || velocity < -500) {
            onSwipe('left')
        } else if (offset > 100 || velocity > 500) {
            onSwipe('right')
        }
    }

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity,
                zIndex: 100 - index,
                borderColor
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute top-0 w-full max-w-md h-[600px] bg-black border-2 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing origin-bottom shadow-2xl"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            // Pass the swipe direction as custom prop if possible, but here 'custom' is usually passed from AnimatePresence.
            // Since we don't control AnimatePresence's custom prop directly here (it's in parent),
            // we might need to rely on the parent passing it or default behavior.
            // However, to fix the LINT error, using variants is the standard way.
            transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
        >
            {/* Shredder Strips Overlay (Only visible during specific state if we implemented full shred) */}
            {/* For true shred effect, we'd need to render multiple strips masking the content.
                Let's stick to the high-performance clipPath "shred/consume" effect for now which looks like it's being eaten downwards. */}
            {/* Status Indicator Overlays */}
            <motion.div
                style={{ opacity: useTransform(x, [50, 150], [0, 1]) }}
                className="absolute top-10 right-10 z-20 border-8 border-primary text-primary font-black text-6xl uppercase tracking-widest px-6 py-4 rounded-xl -rotate-12 transform bg-black shadow-xl"
            >
                BID
            </motion.div>

            <motion.div
                style={{ opacity: useTransform(x, [-150, -50], [1, 0]) }}
                className="absolute top-10 left-10 z-20 border-8 border-secondary text-secondary font-black text-6xl uppercase tracking-widest px-6 py-4 rounded-xl rotate-12 transform bg-black shadow-xl"
            >
                PASS
            </motion.div>

            {/* Clickable Content Area */}
            {/* Using a link or router push here would conflict with drag, catch 22. 
                User wants "click and it auto fills". Let's put a "Select" button overlay or allow clicking non-draggable area? 
                Actually, usually clicking card details opens details. 
                I will add an onClick to the content div that only fires if not dragging. */}
            <div className="flex-1 p-8 flex flex-col relative z-10 select-none pointer-events-none">

                {/* Header */}
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs uppercase tracking-widest mb-3">
                        <ShieldCheck className="w-4 h-4" />
                        {tender.sector}
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md line-clamp-2">
                        {tender.title}
                    </h2>

                    <button
                        // Using pointerEvents to ensure click works despite parent drag?
                        // Actually parent has drag, but child elements with onPointerDown stop propagation can work.
                        // However, simpler is just `onPointerDown={(e) => e.stopPropagation()}` on the button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation()
                            onInfo()
                        }}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-30 group pointer-events-auto"
                    >
                        <span className="sr-only">More Info</span>
                        <div className="w-6 h-6 flex items-center justify-center border-2 border-white/50 rounded-full text-white/80 font-serif italic text-sm font-bold group-hover:bg-white group-hover:text-black transition-all">i</div>
                    </button>
                    <p className="text-white/60 font-medium flex items-center gap-2 text-base">
                        <Briefcase className="w-5 h-5" />
                        {tender.buyer}
                    </p>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <PoundSterling className="w-4 h-4" /> Value
                        </div>
                        <div className="text-lg font-bold text-secondary text-glow-red truncate">
                            {tender.value}
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Deadline
                        </div>
                        <div className="text-lg font-bold text-white">
                            {tender.deadline}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="flex-1 overflow-hidden relative">
                    <p className="text-white/80 leading-relaxed text-sm line-clamp-5">
                        {tender.description}
                    </p>
                    {/* Fade out at bottom of text */}
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent" />
                </div>

                {/* Read More Button */}
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        onInfo()
                    }}
                    className="text-primary text-sm font-medium hover:underline pointer-events-auto mt-2"
                >
                    Read more →
                </button>

                {/* Footer Location */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-white/40 text-sm">
                    <MapPin className="w-5 h-5" />
                    {tender.location}
                </div>
            </div>

            {/* Background Texture/Gradient */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </motion.div>
    )
}

// Memo wrapper to prevent unnecessary re-renders on mobile
export const TenderCard = React.memo(TenderCardBase)
