"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Building2, FileSearch, ShieldAlert, PenTool, Sparkles } from "lucide-react"
import { GlobalHeader } from "@/components/GlobalHeader"

// Agent Workflow Steps Data
const agentSteps = [
  {
    id: 1,
    title: "Company Research",
    description: "We ingest your case studies, certifications, and unique value propositions to build your bidding DNA.",
    icon: Building2,
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    id: 2,
    title: "RFP Intelligence",
    description: "Our agents deconstruct the requirements document, identifying compliance traps and scoring criteria.",
    icon: FileSearch,
    gradient: "from-purple-500 to-pink-400",
  },
  {
    id: 3,
    title: "Red Team Critique",
    description: "An adversarial AI simulates evaluator scoring, flagging weaknesses before submission.",
    icon: ShieldAlert,
    gradient: "from-amber-500 to-orange-400",
  },
  {
    id: 4,
    title: "Autonomous Drafting",
    description: "The final proposal is generated in your exact tone, grounded only in your real evidence.",
    icon: PenTool,
    gradient: "from-emerald-500 to-green-400",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">

        {/* Background Ambience */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/15 rounded-full blur-[150px] opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[180px]" />
        </div>

        <div className="container relative z-10 px-6 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-lg mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-white/60">System Operational</span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]"
          >
            Win Government Contracts <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary">On Autopilot.</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-12"
          >
            Deploy autonomous <strong className="text-white/70">Bid Agents</strong> to monitor live tenders, analyze requirements, and generate winning proposals — in minutes.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* PRIMARY BUTTON - Apple Style */}
            <Link href="/register">
              <button className="group relative h-14 px-8 rounded-full bg-gradient-to-b from-white to-gray-200 text-black text-sm font-semibold tracking-wide flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>

            {/* SECONDARY BUTTON - Glass Style */}
            <Link href="/tenders">
              <button className="h-14 px-8 rounded-full bg-white/5 text-white text-sm font-medium tracking-wide border border-white/10 backdrop-blur-lg hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                Browse Live Tenders
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* AGENT WORKFLOW VISUALIZATION */}
      <section className="py-24 md:py-32 bg-[#030303] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,122,255,0.05),transparent_70%)]" />

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-4 block">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              From Chaos to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Contract</span>.
            </h2>
          </motion.div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {agentSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative h-full bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500">

                  {/* Step Number */}
                  <div className="absolute top-6 right-6 text-5xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                    {String(step.id).padStart(2, '0')}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>

                  {/* Hover Glow */}
                  <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${step.gradient} rounded-full blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700`} />
                </div>

                {/* Connector Line (Desktop) */}
                {index < agentSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="py-24 border-t border-white/5 bg-black">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold text-white/30">The Old Way</h3>
              <ul className="space-y-4">
                {["Manually searching portals daily", "Generic, hallucinated AI copy", "Missed deadlines & formatting errors"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/40 text-sm">
                    <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-xs">✕</div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold text-white">The BidSwipe Way</h3>
              <ul className="space-y-4">
                {[
                  { text: "Super Agents scout & qualify 24/7", bold: "Super Agents" },
                  { text: "Contextual RAG uses your exact data", bold: "Contextual RAG" },
                  { text: "Auto-Apply workflows save hours", bold: "Auto-Apply" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/80 text-sm">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <span><strong className="text-white">{item.bold}</strong> {item.text.replace(item.bold, '').trim()}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-8">
              Ready to Dominate?
            </h2>
            <Link href="/register">
              <button className="group h-16 px-12 rounded-full bg-gradient-to-b from-white to-gray-100 text-black text-base font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
                Deploy Your Agents
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 bg-[#020202]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-xs">
          <p>© 2026 BidSwipe AI. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
