"use client"

import { motion } from "framer-motion"

// Premium Apple-level animated background with floating orbs, mesh gradient, and particle effects
// ENHANCED VISIBILITY VERSION - More noticeable effects
export function AnimatedBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Base gradient - deeper blue tint */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a1a35_0%,#050a15_50%,#000000_100%)]" />

            {/* Animated mesh gradient - MUCH more visible */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        "radial-gradient(800px circle at 0% 0%, rgba(0, 122, 255, 0.25), transparent 60%)",
                        "radial-gradient(800px circle at 100% 0%, rgba(0, 122, 255, 0.25), transparent 60%)",
                        "radial-gradient(800px circle at 100% 100%, rgba(56, 189, 248, 0.2), transparent 60%)",
                        "radial-gradient(800px circle at 0% 100%, rgba(139, 92, 246, 0.2), transparent 60%)",
                        "radial-gradient(800px circle at 0% 0%, rgba(0, 122, 255, 0.25), transparent 60%)",
                    ],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Floating orb 1 - Large primary - BIGGER and MORE VISIBLE */}
            <motion.div
                className="absolute w-[700px] h-[700px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(0, 122, 255, 0.35) 0%, rgba(0, 122, 255, 0.1) 40%, transparent 70%)",
                    filter: "blur(40px)",
                }}
                animate={{
                    x: [0, 150, 50, -100, 0],
                    y: [0, -80, 150, 50, 0],
                    scale: [1, 1.3, 0.9, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                initial={{ left: "5%", top: "10%" }}
            />

            {/* Floating orb 2 - Cyan accent - BRIGHTER */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%)",
                    filter: "blur(50px)",
                }}
                animate={{
                    x: [0, -120, 60, 120, 0],
                    y: [0, 100, -60, 40, 0],
                    scale: [1, 0.85, 1.3, 1, 1],
                }}
                transition={{
                    duration: 16,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                initial={{ right: "0%", top: "20%" }}
            />

            {/* Floating orb 3 - Purple accent - MORE PROMINENT */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)",
                    filter: "blur(40px)",
                }}
                animate={{
                    x: [0, 80, -50, 60, 0],
                    y: [0, -50, 80, -30, 0],
                    opacity: [0.6, 1, 0.7, 1, 0.6],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                initial={{ left: "30%", bottom: "10%" }}
            />

            {/* NEW: Bright spotlight sweep effect */}
            <motion.div
                className="absolute w-full h-[400px] top-0 left-0"
                style={{
                    background: "linear-gradient(180deg, rgba(0, 122, 255, 0.15) 0%, transparent 100%)",
                }}
                animate={{
                    opacity: [0.4, 0.8, 0.5, 0.9, 0.4],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Grid overlay - MORE VISIBLE */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0, 122, 255, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 122, 255, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Floating particles - LARGER and MORE VISIBLE */}
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-primary/60 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        boxShadow: "0 0 8px rgba(0, 122, 255, 0.8)",
                    }}
                    animate={{
                        y: [0, -150 - Math.random() * 300],
                        x: [0, (Math.random() - 0.5) * 150],
                        opacity: [0, 0.9, 0],
                        scale: [0, 1.5, 0.5],
                    }}
                    transition={{
                        duration: 6 + Math.random() * 8,
                        repeat: Infinity,
                        delay: Math.random() * 8,
                        ease: "easeOut",
                    }}
                />
            ))}

            {/* Glowing horizontal line - BRIGHTER */}
            <motion.div
                className="absolute h-[2px] w-full max-w-4xl left-1/2 -translate-x-1/2 top-[35%]"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.6), transparent)",
                    boxShadow: "0 0 20px rgba(0, 122, 255, 0.4)",
                }}
                animate={{
                    opacity: [0.3, 0.8, 0.3],
                    scaleX: [0.6, 1, 0.6],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* NEW: Secondary horizontal line at bottom */}
            <motion.div
                className="absolute h-[2px] w-full max-w-3xl left-1/2 -translate-x-1/2 bottom-[25%]"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)",
                    boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)",
                }}
                animate={{
                    opacity: [0.2, 0.6, 0.2],
                    scaleX: [0.7, 1, 0.7],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5,
                }}
            />

            {/* Corner accent glow - top left */}
            <motion.div
                className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(0, 122, 255, 0.4) 0%, transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Corner accent glow - bottom right */}
            <motion.div
                className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)",
                    filter: "blur(50px)",
                }}
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    )
}
