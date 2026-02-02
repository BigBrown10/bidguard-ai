"use client"

import { motion } from "framer-motion"

// Premium Apple-level animated background with floating orbs, mesh gradient, and particle effects
export function AnimatedBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a1628_0%,#000000_50%,#0a0a0a_100%)]" />

            {/* Animated mesh gradient */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        "radial-gradient(600px circle at 0% 0%, rgba(0, 122, 255, 0.08), transparent 50%)",
                        "radial-gradient(600px circle at 100% 0%, rgba(0, 122, 255, 0.08), transparent 50%)",
                        "radial-gradient(600px circle at 100% 100%, rgba(0, 122, 255, 0.08), transparent 50%)",
                        "radial-gradient(600px circle at 0% 100%, rgba(0, 122, 255, 0.08), transparent 50%)",
                        "radial-gradient(600px circle at 0% 0%, rgba(0, 122, 255, 0.08), transparent 50%)",
                    ],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Floating orb 1 - Large primary */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{
                    x: [0, 100, 50, -50, 0],
                    y: [0, -50, 100, 50, 0],
                    scale: [1, 1.2, 0.9, 1.1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                initial={{ left: "10%", top: "20%" }}
            />

            {/* Floating orb 2 - Medium secondary */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
                    filter: "blur(80px)",
                }}
                animate={{
                    x: [0, -80, 30, 80, 0],
                    y: [0, 60, -40, 20, 0],
                    scale: [1, 0.9, 1.2, 1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                initial={{ right: "15%", top: "30%" }}
            />

            {/* Floating orb 3 - Small accent */}
            <motion.div
                className="absolute w-[300px] h-[300px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{
                    x: [0, 50, -30, 40, 0],
                    y: [0, -30, 50, -20, 0],
                    opacity: [0.5, 0.8, 0.6, 0.9, 0.5],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                initial={{ left: "40%", bottom: "20%" }}
            />

            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/20 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -100 - Math.random() * 200],
                        x: [0, (Math.random() - 0.5) * 100],
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0.5],
                    }}
                    transition={{
                        duration: 8 + Math.random() * 12,
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "easeOut",
                    }}
                />
            ))}

            {/* Glowing line accent */}
            <motion.div
                className="absolute h-px w-full max-w-3xl left-1/2 -translate-x-1/2 top-[40%]"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.3), transparent)",
                }}
                animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scaleX: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Aurora-like top glow */}
            <motion.div
                className="absolute -top-20 left-0 right-0 h-64"
                style={{
                    background: "linear-gradient(180deg, rgba(0, 122, 255, 0.08) 0%, transparent 100%)",
                }}
                animate={{
                    opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Noise texture overlay for premium feel */}
            <div
                className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    )
}
