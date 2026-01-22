"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Header } from "@/components/Header"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* BACKGROUND GRID & GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <main className="flex flex-col relative z-10">

        {/* HERO SECTION */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-4 md:pt-0">

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 uppercase"
          >
            Dominate <span className="text-secondary text-glow-red">The Bid</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white/70 max-w-[800px] mx-auto leading-relaxed mb-12 font-light"
          >
            The world's first <span className="text-primary font-bold">Autonomous Offensive Procurement Engine</span>.
            We do not just "write" proposals. We analyze, strategize, and execute with lethal precision
            to secure government contracts.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <Link href="/tenders">
              <button className="cyber-button h-16 px-10 text-lg md:text-xl tracking-widest clip-path-slant bg-secondary/80 hover:bg-secondary text-white border-none shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                Explore Live Tenders
              </button>
            </Link>
            <Link href="/ingest">
              <button className="h-16 px-10 text-lg md:text-xl text-white border border-white/20 hover:border-primary hover:text-primary transition-all bg-black/40 backdrop-blur-md uppercase tracking-widest clip-path-slant min-w-[240px]">
                Build Proposal
              </button>
            </Link>
          </motion.div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-24 px-6 md:px-12 bg-black/50 backdrop-blur-sm border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Feature 1 */}
              <motion.div
                whileHover={{ y: -10 }}
                className="glass-panel p-8 rounded-none border-l-4 border-primary relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="text-6xl">01</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 uppercase">Neural Analysis</h3>
                <p className="text-white/60 leading-relaxed">
                  Our AI doesn't just read the RFP. It dissects it. Identifying hidden compliance traps and scoring criteria that human eyes miss.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                whileHover={{ y: -10 }}
                className="glass-panel p-8 rounded-none border-l-4 border-secondary relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="text-6xl text-secondary">02</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 uppercase">Reasoning Engine</h3>
                <p className="text-white/60 leading-relaxed">
                  Powered by <span className="text-secondary">Sonar-Pro™</span>. We simulate 100s of strategic angles before writing a single word, ensuring your proposal is mathematically optimized to win.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                whileHover={{ y: -10 }}
                className="glass-panel p-8 rounded-none border-l-4 border-accent relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="text-6xl text-accent">03</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 uppercase">Deep Swarm</h3>
                <p className="text-white/60 leading-relaxed">
                  A coordinated fleet of autonomous agents working in parallel. Research, Drafting, and Critique happen simultaneously. Speed is our weapon.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* COMING SOON SECTION (TINDER) */}
        <section className="py-32 text-center relative">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tighter">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Marketplace</span>
            </h2>
            <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto">
              Coming Phase 2. Swipe right on government contracts.
              The first "Tinder-for-Tenders" interface.
              <span className="block mt-4 text-primary">Live API Integration In Progress.</span>
            </p>
            <div className="inline-block p-[2px] bg-gradient-to-r from-primary to-secondary">
              <div className="bg-black px-8 py-3 uppercase tracking-widest text-sm font-bold text-white">
                Access Restricted // Beta Only
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
