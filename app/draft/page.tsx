"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { performDrafting, performCritique, performHumanization } from "@/app/actions"
import { motion } from "framer-motion"

type ProcessingStage = "initializing" | "research-sync" | "drafting" | "critiquing" | "selecting" | "humanizing" | "complete"

export default function DraftPage() {
    const router = useRouter()
    const [stage, setStage] = React.useState<ProcessingStage>("initializing")
    const [log, setLog] = React.useState<string>("Connecting to Swarm...")

    React.useEffect(() => {
        const runAutoPilot = async () => {
            try {
                // 1. Load Research
                setStage("research-sync")
                setLog("Syncing with Intelligence Unit...")
                const storedConfig = localStorage.getItem("bidguard_config")
                const storedResearch = localStorage.getItem("bidguard_research")

                if (!storedConfig || !storedResearch) {
                    throw new Error("Missing research data")
                }
                const config = JSON.parse(storedConfig)
                const research = JSON.parse(storedResearch)
                // Format research for prompt
                const researchSummary = `Client News: ${research.clientNews.join("; ")}. Pain Points: ${research.painPoints.join("; ")}`

                await new Promise(r => setTimeout(r, 1000))

                // 2. Draft (Parallel)
                setStage("drafting")
                setLog("Generating 3 Divergent Strategies (Safe, Innovative, Disruptive)...")
                const drafts = await performDrafting(config.projectName, config.clientName, researchSummary)

                // 3. Critique (Red Team)
                setStage("critiquing")
                setLog("Red Team Attack in progress...")
                const critiques = await performCritique(drafts, config.projectName)

                // 4. Select Winner
                setStage("selecting")
                setLog("Calculating Win Probability...")
                await new Promise(r => setTimeout(r, 1000))

                // Simple logic: Highest score wins. If tie, innovative wins.
                const scores = [
                    { type: 'safe', score: critiques.safe.score, draft: drafts.safe },
                    { type: 'innovative', score: critiques.innovative.score, draft: drafts.innovative },
                    { type: 'disruptive', score: critiques.disruptive.score, draft: drafts.disruptive }
                ]

                const winner = scores.sort((a, b) => b.score - a.score)[0]
                setLog(`Winner Selected: ${winner.type.toUpperCase()} Strategy (Score: ${winner.score}/10)`)
                await new Promise(r => setTimeout(r, 1500))

                // 5. Humanize
                setStage("humanizing")
                setLog("Applying 'UK Civil Service' tone and removing AI artifacts...")
                const humanized = await performHumanization(winner.draft.executiveSummary)

                // 6. Save & Redirect
                setStage("complete")
                setLog("Finalizing Proposal Document...")

                const finalResult = {
                    strategy: winner.type,
                    originalDraft: winner.draft,
                    critique: critiques[winner.type as keyof typeof critiques],
                    finalText: humanized.refinedText
                }

                localStorage.setItem("bidguard_final", JSON.stringify(finalResult))

                setTimeout(() => router.push("/result"), 1000)

            } catch (error) {
                console.error(error)
                setLog("Error in Auto-Pilot. Check console.")
            }
        }

        runAutoPilot()
    }, [router])

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Header />
            <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-12">

                {/* Cyberpunk Core Visual */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Pulsing Rings */}
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
                    <div className="absolute inset-8 border border-white/10 rounded-full animate-pulse" />

                    {/* Core Orb */}
                    <motion.div
                        className="w-32 h-32 bg-primary/20 rounded-full backdrop-blur-3xl shadow-[0_0_100px_rgba(0,122,255,0.5)] flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center border border-white/10">
                            <span className="text-4xl">
                                {stage === "drafting" ? "✍️" :
                                    stage === "critiquing" ? "🛡️" :
                                        stage === "humanizing" ? "🇬🇧" : "🤖"}
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Status Log */}
                <div className="space-y-4 text-center max-w-lg z-10">
                    <h2 className="text-2xl font-bold tracking-tight text-white/90">
                        {stage === "initializing" && "System Initializing"}
                        {stage === "drafting" && "Swarm Intelligence Active"}
                        {stage === "critiquing" && "Red Team Stress Test"}
                        {stage === "humanizing" && "Tone Calibration"}
                        {stage === "complete" && "Mission Complete"}
                    </h2>

                    <div className="h-24 flex items-center justify-center">
                        <p className="font-mono text-primary text-lg animate-pulse">
                            {">"} {log}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary box-shadow-[0_0_20px_var(--primary)]"
                            initial={{ width: "0%" }}
                            animate={{
                                width: stage === "complete" ? "100%" :
                                    stage === "humanizing" ? "90%" :
                                        stage === "selecting" ? "70%" :
                                            stage === "critiquing" ? "50%" :
                                                stage === "drafting" ? "30%" : "10%"
                            }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
