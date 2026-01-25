"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Shield, Zap, Brain, Lock, Globe } from "lucide-react"
import { GlobalHeader } from "@/components/GlobalHeader"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">
      {/* Nav is handled by layout/GlobalHeader but we want to ensure it's seamless. 
                GlobalHeader is visible. */}

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">

        {/* Background Ambience */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px]" />
        </div>

        <div className="container relative z-10 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">System Operational</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-9xl font-black tracking-tighter text-white mb-8 uppercase leading-[0.9]"
          >
            Win <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Contracts</span> <br />
            <span className="text-primary text-glow">On Autopilot</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light mb-12"
          >
            The world's first <span className="text-white font-medium">Offensive Procurement Engine</span>.
            We don't just write proposals. We analyze, strategize, and execute with lethal precision.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register">
              <button className="h-14 px-8 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                Start Winning <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/tenders">
              <button className="h-14 px-8 bg-white/10 text-white text-lg font-bold rounded-full border border-white/10 hover:bg-white/20 transition-all backdrop-blur-md">
                View Live Opportunities
              </button>
            </Link>
          </motion.div>

          {/* Simulated UI Mockup at bottom of hero */}
          <motion.div
            initial={{ y: 100, opacity: 0, rotateX: 20 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 relative mx-auto max-w-[1200px] perspective-[2000px]"
          >
            <div className="rounded-t-3xl border border-white/10 bg-[#0A0A0A] shadow-2xl p-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <img src="/dashboard-mock.png" alt="Dashboard" className="rounded-xl w-full opacity-80" />
              {/* If image missing, fallback UI */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-[400px] w-full bg-gradient-to-b from-white/5 to-transparent rounded-xl flex items-center justify-center">
                    <div className="text-left space-y-4 p-8 w-full max-w-2xl bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                      <div className="flex gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                      </div>
                      <div className="space-y-3 font-mono text-sm text-green-400">
                        <p>&gt; Analyzing RFP requirements...</p>
                        <p>&gt; Identifying compliance traps [Found: 3]</p>
                        <p>&gt; Generating executive summary...</p>
                        <p className="animate-pulse">&gt; STRATEGY OPTIMIZED: 98% WIN PROBABILITY</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="py-32 px-6 bg-[#050505] relative z-20">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Built for the <br />Modern Defense Contractor.</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

            {/* Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:row-span-2 rounded-3xl bg-white/5 border border-white/10 p-10 relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />
              <Brain className="w-12 h-12 text-primary mb-6" />
              <h4 className="text-3xl font-bold text-white mb-4">Neural Reasoning Engine</h4>
              <p className="text-white/60 text-lg max-w-md">
                Unlike standard LLMs, BidSwipe models the "mind" of the evaluator. It simulates 100s of scoring scenarios to optimize your technical approach before writing a single word.
              </p>
              <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-tl from-primary/20 to-transparent rounded-tl-full blur-3xl" />
            </motion.div>

            {/* Small Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-white/5 border border-white/10 p-8 relative overflow-hidden hover:border-white/30 transition-colors"
            >
              <Shield className="w-8 h-8 text-secondary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Truth Sentinel™</h4>
              <p className="text-white/50 text-sm">Real-time hallucination checks against your uploaded company profile.</p>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-white/5 border border-white/10 p-8 relative overflow-hidden hover:border-white/30 transition-colors"
            >
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Black Ops Scraper</h4>
              <p className="text-white/50 text-sm">Automated surveillance of Find a Tender, Contracts Finder, and MOD pathways.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-24 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-white/40">The Old Way</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-white/40 text-lg decoration-slice">
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-xs">✕</div>
                  Manual requirement mapping (Days)
                </li>
                <li className="flex items-center gap-4 text-white/40 text-lg">
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-xs">✕</div>
                  Generic "ChatGPT" copy
                </li>
                <li className="flex items-center gap-4 text-white/40 text-lg">
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-xs">✕</div>
                  Missed compliance traps
                </li>
              </ul>
            </div>
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-white">The BidSwipe Way</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-white text-lg">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  Instant compliance matrix (Seconds)
                </li>
                <li className="flex items-center gap-4 text-white text-lg">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  Buyer-specific strategic injection
                </li>
                <li className="flex items-center gap-4 text-white text-lg">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  Automated "Red Team" Review
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 blur-[100px] opacity-20" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white mb-8">
            Ready to <br />Domin<span className="text-primary transparent-text-stroke">ate?</span>
          </h2>
          <Link href="/register">
            <button className="h-16 px-12 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform">
              Get Started Now
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 bg-[#020202]">
        <div className="container mx-auto px-6 flex justify-between items-center opacity-50 text-sm">
          <p>© 2026 BidSwipe AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
