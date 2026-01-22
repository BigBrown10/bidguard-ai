"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { Tender } from "@/lib/mock-tenders"
import { Briefcase, Calendar, MapPin, PoundSterling, ShieldCheck } from "lucide-react"

interface TenderCardProps {
    tender: Tender;
    onSwipe: (direction: "left" | "right") => void;
    index: number;
}

export const TenderCard = ({ tender, onSwipe, index }: TenderCardProps) => {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-15, 15])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

    // Background color shifts based on swipe direction
    const borderColor = useTransform(
        x,
        [-200, 0, 200],
        ["rgba(255, 0, 60, 1)", "rgba(255, 255, 255, 0.1)", "rgba(0, 240, 255, 1)"]
    )

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe("right")
        } else if (info.offset.x < -100) {
            onSwipe("left")
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
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
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
                    <h2 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">
                        {tender.title}
                    </h2>
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
                    <p className="text-white/80 leading-relaxed text-sm">
                        {tender.description}
                    </p>
                    {/* Fade out at bottom of text */}
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent" />
                </div>

                {/* Footer Location */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-white/40 text-sm">
                    <MapPin className="w-5 h-5" />
                    {tender.location}
                </div>
            </div>

            {/* Background Texture/Gradient */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </motion.div>
    )
}
