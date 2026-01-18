"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { ProcessingHUD } from "@/components/ProcessingHUD"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { motion } from "framer-motion"

export default function DraftPage() {
    const router = useRouter()
    const [phase, setPhase] = React.useState<"drafting" | "critiquing" | "complete">("drafting")

    // Mock Data
    const strategies = [
        { name: "Safe", color: "bg-blue-500", score: 8.2, status: "REJECT" },
        { name: "Innovative", color: "bg-purple-500", score: 9.1, status: "ACCEPT" },
        { name: "Disruptive", color: "bg-orange-500", score: 8.8, status: "ACCEPT" },
    ]

    React.useEffect(() => {
        // Simulate Draft Phase
        setTimeout(() => setPhase("critiquing"), 2000)
        // Simulate Critique Phase
        setTimeout(() => setPhase("complete"), 4500)
    }, [])

    return (
        <div className="min-h-screen bg-[#FBFBFD]">
            <Header />
            <ProcessingHUD
                isProcessing={phase !== "complete"}
                status={phase === "drafting" ? "Generative Drafting..." : "Red Team Critiquing..."}
            />

            <main className="container mx-auto max-w-7xl px-6 py-12 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Strategy Generation</h1>
                    <p className="text-muted-foreground">The swarm is generating and stress-testing three distinct bid approaches.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {strategies.map((strat, index) => (
                        <motion.div
                            key={strat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                        >
                            <Card className="h-full flex flex-col justify-between overflow-hidden border-0 shadow-lg ring-1 ring-black/5">
                                <div className={`h-2 w-full ${strat.color}`} />
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {strat.name}
                                        {phase === "complete" && (
                                            <span className={`text-sm px-2 py-1 rounded-full ${strat.score >= 8.5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                {strat.score} / 10
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {phase === "drafting" ? "Generating..." : "Strategy generated."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    {phase === "drafting" ? (
                                        <div className="space-y-3 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 text-sm">
                                            <p className="italic text-muted-foreground">
                                                &quot;Focuses on proven track record and compliance. Minimizes risk perception...&quot;
                                            </p>
                                            {phase === "complete" && (
                                                <div className="p-3 bg-zinc-50 rounded-lg border text-xs">
                                                    <p className="font-semibold text-red-600 mb-1">Critique:</p>
                                                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                                        <li>Lacks competitive differentiator.</li>
                                                        <li>Evidence is solid but generic.</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                {phase === "complete" && (
                                    <CardFooter>
                                        <Button className="w-full" variant={strat.score >= 8.5 ? "default" : "secondary"} onClick={() => router.push("/result")}>
                                            {strat.score >= 8.5 ? "Select & Finalise" : "Refine"}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}
