"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { ProcessingHUD } from "@/components/ProcessingHUD"
import { TerminalLog, type LogEntry } from "@/components/TerminalLog"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

// In a real app, this would use Server Actions and streaming
// For prototype, we simulate the agent steps
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
        const runSimulation = async () => {
            addLog("Initializing Research Agent (Model: sonar-pro)...")
            await new Promise(r => setTimeout(r, 1000))

            addLog("Reading RFP requirements...", "info")
            await new Promise(r => setTimeout(r, 1500))

            addLog("Connecting to Perplexity Live Web Index...", "warning")
            await new Promise(r => setTimeout(r, 1000))

            addLog("FOUND: Recent contract award £12m to Capita (Nov 2024)", "success")
            await new Promise(r => setTimeout(r, 800))

            addLog("FOUND: Client strategic shift to 'Cloud First' policy", "success")
            await new Promise(r => setTimeout(r, 1200))

            addLog("ANALYZING: Competitor weakness identified in customer service", "info")
            await new Promise(r => setTimeout(r, 1500))

            addLog("Synthesizing evidence bullets...", "info")
            await new Promise(r => setTimeout(r, 1000))

            addLog("Research Complete. Ready for Drafting.", "success")
            setComplete(true)
        }

        runSimulation()

        return () => { }
    }, [])

    return (
        <div className="min-h-screen bg-[#FBFBFD]">
            <Header />
            <ProcessingHUD isProcessing={!complete} status={complete ? "Waiting" : "Researching..."} />

            <main className="container mx-auto max-w-4xl px-6 py-12 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
                    <p className="text-muted-foreground">The Researcher Agent is scanning the live web for competitive advantages.</p>
                </div>

                <TerminalLog logs={logs} />

                {complete && (
                    <div className="flex justify-end animate-fade-in">
                        <Button size="lg" onClick={() => router.push("/draft")}>
                            Proceed to Drafting Strategy
                        </Button>
                    </div>
                )}

                {/* Preview of gathered data could go here */}
                {complete && (
                    <Card className="animate-fade-in delay-100">
                        <CardHeader><CardTitle>Key Findings</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li>Recent contract award £12m to Capita (Nov 2024)</li>
                                <li>Client strategic shift to &quot;Cloud First&quot; policy</li>
                                <li>Competitor weakness identified in customer service</li>
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
