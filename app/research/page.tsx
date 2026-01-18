"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { ProcessingHUD } from "@/components/ProcessingHUD"
import { TerminalLog, type LogEntry } from "@/components/TerminalLog"
import { performResearch } from "@/app/actions"

export default function ResearchPage() {
    const router = useRouter()
    const [logs, setLogs] = React.useState<LogEntry[]>([])
    const [complete, setComplete] = React.useState(false)

    const addLog = (message: string, type: LogEntry["type"] = "info") => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36),
            timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
            message,
            type
        }])
    }

    React.useEffect(() => {
        const runLiveResearch = async () => {
            // Get data from previous step
            const storedConfig = localStorage.getItem("bidguard_config");
            const config = storedConfig ? JSON.parse(storedConfig) : { projectName: "UK Digital Transformation", clientName: "UK Gov" };

            addLog(`Initializing Live Research Agent for: ${config.projectName}`, "info");

            try {
                addLog("Scanning public sector tenders...", "info");
                // REAL API CALL
                const result = await performResearch(config.projectName, config.companyUrl);

                addLog(`FOUND: ${result.clientNews?.length || 0} recent news items`, "success");
                addLog(`ANALYSIS: Identified ${result.painPoints?.length || 0} client pain points`, "warning");

                // Save Research for next step
                localStorage.setItem("bidguard_research", JSON.stringify(result));

                addLog("Research Complete. Handing off to Drafting Swarm.", "success");
                setComplete(true);

                // Auto-redirect after delay
                setTimeout(() => router.push("/draft"), 2000);

            } catch (error) {
                console.error(error);
                addLog("Research failed. Using cached fallback.", "error");
                setComplete(true);
                // Fallback mock
                localStorage.setItem("bidguard_research", JSON.stringify({
                    clientNews: [],
                    painPoints: ["Legacy Systems"],
                    evidenceBullets: ["Proven track record"]
                }));
                setTimeout(() => router.push("/draft"), 2000);
            }
        }

        runLiveResearch()

        return () => { }
    }, [])

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Header />
            <ProcessingHUD isProcessing={!complete} status={complete ? "Waiting" : "Researching..."} />

            <main className="container mx-auto max-w-4xl px-6 py-12 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-glow">Market Intelligence</h1>
                    <p className="text-white/60">The Researcher Agent is scanning the live web for competitive advantages.</p>
                </div>

                <TerminalLog logs={logs} />

                {/* Auto-redirecting message */}
                {complete && (
                    <div className="flex justify-center animate-fade-in pt-8">
                        <p className="text-primary animate-pulse font-mono">Redirecting to Swarm Core...</p>
                    </div>
                )}
            </main>
        </div>
    )
}
