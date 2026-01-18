"use client"

import * as React from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { FileText, Download } from "lucide-react"

export default function ResultPage() {
    const [result, setResult] = React.useState<any>(null)

    React.useEffect(() => {
        const storedFinal = localStorage.getItem("bidguard_final")
        if (storedFinal) {
            setResult(JSON.parse(storedFinal))
        }
    }, [])

    const handlePrint = () => {
        window.print()
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="animate-pulse">Loading Final Result...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 print:bg-white print:text-black">
            <div className="print:hidden">
                <Header />
            </div>

            <main className="container mx-auto max-w-5xl px-6 py-12 space-y-8 print:p-0">
                <div className="flex justify-between items-center print:hidden">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Final Proposal</h1>
                        <p className="text-white/60">The Swarm has selected and humanized the optimum strategy.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={handlePrint}>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF / Print
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                    {/* Main Content */}
                    <Card className="lg:col-span-2 border-0 shadow-lg print:shadow-none print:border-none">
                        <CardHeader>
                            <CardTitle className="flex justify-between print:hidden">
                                Proposal Document
                                <span className="text-xs font-normal text-white/60 bg-white/10 px-2 py-1 rounded">
                                    Strategy: {result.strategy.toUpperCase()}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-invert prose-sm max-w-none text-white/90 whitespace-pre-wrap font-serif leading-relaxed print:text-black print:prose p-8 bg-black/40 rounded-xl border border-white/5 print:bg-white print:border-0">
                                <h1 className="text-2xl font-bold mb-4 print:text-black">Executive Summary</h1>
                                {result.finalText}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar Stats (Hidden on Print) */}
                    <div className="space-y-6 print:hidden">
                        <Card className="border-0 shadow-sm">
                            <CardHeader><CardTitle className="text-lg">Bid Guard Analysis</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-xs uppercase text-white/50 font-bold">Winning Strategy Score</span>
                                    <div className="flex items-end gap-2 text-primary">
                                        <span className="text-3xl font-bold">{result.critique.score}</span>
                                        <span className="text-sm pb-1 text-white/50">/ 10</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs uppercase text-white/50 font-bold">AI Detection Risk</span>
                                    <div className="flex items-end gap-2 text-green-500">
                                        <span className="text-3xl font-bold">Low</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-primary/10">
                            <CardHeader><CardTitle className="text-lg">Compliance Audit</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-white/80">
                                    <li className="flex gap-2 items-center"><FileText className="h-4 w-4 text-green-500" /> Social Value Included</li>
                                    <li className="flex gap-2 items-center"><FileText className="h-4 w-4 text-green-500" /> Modern Slavery Act</li>
                                    <li className="flex gap-2 items-center"><FileText className="h-4 w-4 text-green-500" /> GDPR Reference</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
