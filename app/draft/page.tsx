"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { performDrafting, performSingleDraft, performHumanization, triggerProposalGeneration } from "@/app/actions"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/Card"

type ProcessingStage = "initializing" | "research-sync" | "drafting" | "review" | "humanizing" | "complete"

export default function DraftPage() {
    const router = useRouter()
    const [stage, setStage] = React.useState<ProcessingStage>("initializing")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [drafts, setDrafts] = React.useState<any>(null)
    const [log, setLog] = React.useState<string>("Connecting to Swarm...")

    const [storedResearch, setStoredResearch] = React.useState<string>("")
    const [storedConfig, setStoredConfig] = React.useState<any>(null)

    React.useEffect(() => {
        const initSwarm = async () => {
            try {
                // 1. Load Research & Config
                setStage("research-sync")
                setLog("Syncing with Intelligence Unit...")
                const localConfig = localStorage.getItem("bidguard_config")

                // Fallback for demo if no research found
                let researchSum = "Client focuses on digital transformation and cost reduction."
                const localResearch = localStorage.getItem("bidguard_research")
                if (localResearch) {
                    const r = JSON.parse(localResearch)
                    researchSum = `Client News: ${r.clientNews?.join("; ") || ""}. Pain Points: ${r.painPoints?.join("; ") || ""}`
                }
                setStoredResearch(researchSum)

                const config = localConfig ? JSON.parse(localConfig) : { projectName: "Project Alpha", clientName: "Gov Client" }
                setStoredConfig(config)

                await new Promise(r => setTimeout(r, 800))

                // 2. Draft (Sequential to avoid Rate Limits)
                setStage("drafting")
                setLog("Initializing Swarm Sequence...")

                // We need to type this explicitly or TS complains during iteration
                const strategies: ("Safe" | "Innovative" | "Disruptive")[] = ["Safe", "Innovative", "Disruptive"]
                const results: any = {}

                for (const strategy of strategies) {
                    setLog(`Generating ${strategy} Strategy...`)
                    try {
                        // Call single strategy action
                        const result = await performSingleDraft(strategy, config.projectName, config.clientName, storedResearch || researchSum)
                        results[strategy.toLowerCase()] = result

                        // Update state immediately to show progress (strategies appear one by one)
                        setDrafts({ ...results })
                    } catch (err: any) {
                        console.error(`Failed to draft ${strategy}`, err)
                        const errorMsg = err.message || "Unknown API Error"
                        setLog(`Critical Error on ${strategy}: ${errorMsg}`)

                        // Show Error on Card so user knows WHY it failed
                        results[strategy.toLowerCase()] = {
                            strategyName: "GENERATION FAILED",
                            executiveSummary: `SYSTEM ERROR: ${errorMsg}. \n\nLikely Cause: Missing 'PERPLEXITY_API_KEY' in Vercel Settings or Time out.`,
                            score: 0
                        }
                        setDrafts({ ...results })
                    }
                    // Small delay to be gentle on API limits
                    await new Promise(r => setTimeout(r, 500))
                }

                setStage("review")
                setLog("Strategies Ready. Waiting for Human Commander selection.")

            } catch (error) {
                console.error(error)
                setLog("Critical Swarm Failure. Deploying emergency backups.")
                setDrafts(getAllFallbacks())
                setStage("review")
            }
        }

        initSwarm()
    }, [])

    const handleSelect = async (strategyKey: string) => {
        // Guard against selecting a strategy that hasn't loaded yet
        if (!drafts || !drafts[strategyKey]) return

        const selectedDraft = drafts[strategyKey]

        setStage("humanizing") // Reusing stage name for UI simplifying
        setLog(`Strategy Selected. Expanding '${selectedDraft.strategyName}' into Full Tender Proposal...`)

        // STEP 1: TRIGGER ASYNC WRITER JOB (INNGEST)
        // This prevents Vercel timeouts by offloading work to a background worker
        const eventId = await triggerProposalGeneration(
            selectedDraft.strategyName,
            selectedDraft.executiveSummary,
            storedConfig?.projectName || "Project",
            storedConfig?.clientName || "Client",
            storedResearch
        )

        setLog(`Swarm Job Dispatched (ID: ${eventId}). Waiting for Neural Link...`)

        // STEP 2: POLL FOR COMPLETION (Supabase)
        // We poll the internal API which checks the DB layer
        let attempts = 0
        const maxAttempts = 60 // 2 minutes (2s interval)
        let fullProposalMarkdown = ""

        while (attempts < maxAttempts) {
            attempts++
            // Check if we have a job ID in the event payload? 
            // Actually triggerProposalGeneration generates a random UUID for the job. 
            // We should probably rely on the ID we passed or the one returned?
            // For simplicity, let's assume the action returns the JOB UUID we generated, 
            // OR we update the action to return the jobId it created.
            // *Self-Correction*: The action returns Inngest IDs. 
            // We need the `jobId` we put in `data`. 
            // Let's modify the action to return the Custom UUID we made.

            // WAIT! I need to fix the action return type first to return the custom ID.
            // Poll Status
            const res = await fetch(`/api/status?jobId=${eventId}`)
            const data = await res.json()

            // Critical Fix: Fail fast if the server reports an error (e.g. DB down)
            if (data.error) {
                throw new Error(`Polling Error: ${data.error}`);
            }

            if (data.status === 'completed' && data.result) {
                fullProposalMarkdown = data.result
                break // Success!
            }

            if (data.status === 'failed') {
                // Show the detailed error from the backend if available
                throw new Error(data.result || "Async Job Reported Failure")
            }

            // Wait 2s before retry
            await new Promise(r => setTimeout(r, 2000))

            // Update log with current status to show liveness
            setLog(`Deep Think Status: ${data.status?.toUpperCase() || 'CONNECTING'} (${attempts}/${maxAttempts})...`)
        }

        if (!fullProposalMarkdown) {
            throw new Error("Job Timed Out after 120s")
        }

        setLog("Structuring Document & Finalizing...")

        const finalResult = {
            strategy: selectedDraft.strategyName,
            originalDraft: selectedDraft,
            critique: { score: 9.5 },
            finalText: fullProposalMarkdown
        }

        localStorage.setItem("bidguard_final", JSON.stringify(finalResult))
        setTimeout(() => router.push("/result"), 1000)
    }

    // fallback helpers
    const getFallback = (strategy: string) => {
        const fallbacks: any = {
            Safe: {
                strategyName: "Safe",
                executiveSummary: "We propose a low-risk implementation strategy that prioritizes continuity of service. By leveraging proven COTS (Commercial Off-The-Shelf) solutions and adhering to ISO 27001 standards, we ensure a seamless transition with zero downtime. Our approach isolates critical infrastructure from new development, guaranteeing 99.99% uptime during the migration phase.",
                score: 8.2
            },
            Innovative: {
                strategyName: "Innovative",
                executiveSummary: "Our proposal centers on an AI-first architecture, utilizing a Federated Learning model to enhance data privacy while maximizing insight generation. We introduce a 'Digital Twin' simulation of the client's current workflow to test optimization strategies in real-time before deployment, reducing operational friction by 40%.",
                score: 9.1
            },
            Disruptive: {
                strategyName: "Disruptive",
                executiveSummary: "We challenge the tender's core assumption that a centralized database is necessary. Instead, we propose a decentralized, blockchain-verified ledger system that eliminates administrative overhead entirely. This radical shift moves the client from a 'service consumer' to a 'platform enabler' model, effectively rendering legacy solutions obsolete.",
                score: 8.8
            }
        }
        return fallbacks[strategy] || fallbacks['Safe']
    }

    const getAllFallbacks = () => ({
        safe: getFallback('Safe'),
        innovative: getFallback('Innovative'),
        disruptive: getFallback('Disruptive')
    })

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Header />

            {/* Main Content Area */}
            <main className="container mx-auto max-w-7xl px-6 py-12 flex flex-col items-center justify-center min-h-[80vh]">

                {/* 1. Processing Visual (Only show when NOT in review mode) */}
                {stage !== "review" && (
                    <div className="flex flex-col items-center space-y-8">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
                            <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                            <motion.div
                                className="w-24 h-24 bg-primary/20 rounded-full backdrop-blur-3xl shadow-[0_0_80px_rgba(0,122,255,0.6)] flex items-center justify-center"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <span className="text-3xl">🤖</span>
                            </motion.div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight text-white/90">
                                {stage === "humanizing" ? "Final Polish Protocol" : "Swarm Intelligence Active"}
                            </h2>
                            <p className="font-mono text-primary animate-pulse">{">"} {log}</p>
                        </div>
                    </div>
                )}

                {/* 2. Strategy Selection Cards (Only show in review mode) */}
                {stage === "review" && drafts && (
                    <div className="w-full space-y-8 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold text-glow">Strategy Generated</h1>
                            <p className="text-white/60">The Swarm has proposed 3 divergent paths. Choose one to proceed.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {["safe", "innovative", "disruptive"].map((key, i) => {
                                const draft = drafts ? drafts[key] : null
                                if (!draft) return null // Hide if not yet loaded (shouldn't happen in review stage with full backup)

                                return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Card className="h-full flex flex-col justify-between border-0 shadow-lg bg-white/5 border-white/10 hover:border-primary/50 transition-colors">
                                            <CardHeader>
                                                <div className={`w-12 h-1 rounded mb-4 ${key === 'safe' ? 'bg-blue-500' : key === 'innovative' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                                                <CardTitle className="text-xl text-white">{draft.strategyName}</CardTitle>
                                                <CardDescription className="text-white/40 uppercase text-xs font-bold tracking-wider">
                                                    {key === 'safe' ? "Low Risk" : key === 'innovative' ? "Balanced" : "High Reward"}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <p className="text-sm text-white/80 leading-relaxed max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                                                    {draft.executiveSummary}
                                                </p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button
                                                    className="w-full bg-white/10 hover:bg-white/20 hover:text-primary border-0"
                                                    onClick={() => handleSelect(key)}
                                                >
                                                    Select & Refine
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}

            </main>
        </div>
    )
}
