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
            className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 uppercase leading-[0.9]"
          >
            Win <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Government Contracts</span> <br />
            <span className="text-primary text-glow">On Autopilot</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-light mb-10"
          >
            Activate autonomous <strong>Bid Agents</strong> to monitor live tenders, analyze requirements with deep context, and auto-generate winning proposals in seconds.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register">
              <button className="h-12 px-8 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 uppercase tracking-wide">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/tenders">
              <button className="h-12 px-8 bg-white/5 text-white text-sm font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md uppercase tracking-wide">
                Browse Live Tenders
              </button>
            </Link>
          </motion.div>

          {/* Simulated UI Mockup at bottom of hero */}
          <motion.div
            initial={{ y: 100, opacity: 0, rotateX: 20 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 relative mx-auto max-w-[1000px] perspective-[2000px]"
          >
            <div className="rounded-t-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl p-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <img src="/dashboard-mock.png" alt="Dashboard" className="rounded-lg w-full opacity-80" />
              {/* If image missing, fallback UI */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-[300px] w-full bg-gradient-to-b from-white/5 to-transparent rounded-lg flex items-center justify-center">
                    <div className="text-left space-y-3 p-6 w-full max-w-xl bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl">
                      <div className="flex gap-2 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      </div>
                      <div className="space-y-2 font-mono text-xs text-green-400">
                        <p>&gt; Super Agent "Hunter" initialized...</p>
                        <p>&gt; Scanning live portals (Find a Tender, MOD, NHS)...</p>
                        <p>&gt; Match found: Cyber Security Framework [£2.5M]</p>
                        <p>&gt; Retrieving company context...</p>
                        <p className="animate-pulse">&gt; AUTO-APPLY SEQUENCE READY: 98% MATCH</p>
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
      <section className="py-24 px-6 bg-[#050505] relative z-20">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Capabilities</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Full Spectrum <br />Procurement Dominance.</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[500px]">

            {/* Large Card: Super Agent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:row-span-2 rounded-2xl bg-white/5 border border-white/10 p-8 relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />
              <Brain className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-2xl font-bold text-white mb-3">Super Agent Orchestration</h4>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Your dedicated AI workforce. Agents collaborate to analyze RFPs, recall your past performance context, and draft compliant responses autonomously.
              </p>
              <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-gradient-to-tl from-primary/20 to-transparent rounded-tl-full blur-2xl" />
            </motion.div>

            {/* Small Card 1: Live Tenders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-1 md:row-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden hover:border-white/30 transition-colors flex flex-col justify-end"
            >
              <Globe className="w-8 h-8 text-blue-400 mb-4 absolute top-6 left-6" />
              <h4 className="text-lg font-bold text-white mb-2">Live Tender Feed</h4>
              <p className="text-white/50 text-xs">
                Real-time connection to government portals. We surface hidden opportunities the moment they drop.
              </p>
            </motion.div>

            {/* Small Card 2: Context/Context */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden hover:border-white/30 transition-colors"
            >
              <Zap className="w-6 h-6 text-yellow-400 mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Instant Context</h4>
              <p className="text-white/50 text-xs">Upload your profile once. We inject your unique case studies into every bid.</p>
            </motion.div>

            {/* Small Card 3: Auto Apply */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 relative overflow-hidden hover:border-white/30 transition-colors"
            >
              <CheckCircle className="w-6 h-6 text-green-400 mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Auto Apply</h4>
              <p className="text-white/50 text-xs">One-click submission readiness. From discovery to deployed bid in minutes.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-20 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white/40">The Old Way</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-4 text-white/40 text-sm decoration-slice">
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px]">✕</div>
                  Manually searching portals daily
                </li>
                <li className="flex items-center gap-4 text-white/40 text-sm">
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px]">✕</div>
                  Generic, hallucinated AI copy
                </li>
                <li className="flex items-center gap-4 text-white/40 text-sm">
                  <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px]">✕</div>
                  Missed deadlines & formatting errors
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">The BidSwipe Way</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-4 text-white text-sm">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <strong>Super Agents</strong> scout & qualify 24/7
                </li>
                <li className="flex items-center gap-4 text-white text-sm">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <strong>Contextual RAG</strong> uses your exact data
                </li>
                <li className="flex items-center gap-4 text-white text-sm">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <strong>Auto-Apply</strong> workflows
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 blur-[100px] opacity-20" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6">
            Ready to <br />Domin<span className="text-primary transparent-text-stroke">ate?</span>
          </h2>
          <Link href="/register">
            <button className="h-14 px-10 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform">
              Deploy Your Agents
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 bg-[#020202]">
        <div className="container mx-auto px-6 flex justify-between items-center opacity-50 text-xs">
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
