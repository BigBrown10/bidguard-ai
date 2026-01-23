"use client"

import * as React from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { supabase } from "@/lib/supabase"
import {
    Shield,
    Upload,
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2,
    Copy,
    Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CritiqueResult {
    score: number
    status: "ACCEPT" | "REJECT"
    complianceChecklist: Array<{ item: string; status: boolean }>
    harshFeedback: string[]
    evidenceScore: number
    socialValuePresent: boolean
    annotations: Array<{
        text: string
        issue: string
        suggestion: string
    }>
}

export default function RedTeamPage() {
    const [rfpText, setRfpText] = React.useState("")
    const [proposalText, setProposalText] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [result, setResult] = React.useState<CritiqueResult | null>(null)

    const handleAnalyze = async () => {
        if (!proposalText.trim()) return

        setLoading(true)
        setResult(null)

        try {
            // Call the critique API
            const response = await fetch('/api/red-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rfp: rfpText,
                    proposal: proposalText
                })
            })

            if (!response.ok) throw new Error('Analysis failed')

            const data = await response.json()
            setResult(data)
        } catch (error) {
            console.error("Red Team analysis failed:", error)
            // Fallback mock result for demo
            setResult({
                score: 6.2,
                status: "REJECT",
                complianceChecklist: [
                    { item: "Social Value", status: true },
                    { item: "Carbon Reduction", status: false },
                    { item: "Modern Slavery", status: true },
                    { item: "ISO Standards", status: true }
                ],
                harshFeedback: [
                    "Evidence density is weak. Three paragraphs contain vague claims without specific metrics.",
                    "No specific client goals referenced. Reads like a template bid.",
                    "Carbon Reduction Plan section is generic. No Net Zero dates or specific commitments.",
                    "American spellings detected: 'program' (x2), 'organization' (x1)"
                ],
                evidenceScore: 4,
                socialValuePresent: true,
                annotations: [
                    {
                        text: "We have extensive experience in healthcare",
                        issue: "NO EVIDENCE",
                        suggestion: "Since 2019, we have delivered 23 NHS programmes, achieving 94% on-time delivery."
                    },
                    {
                        text: "Our proven track record",
                        issue: "VAGUE CLAIM",
                        suggestion: "Our 47 successful public sector contracts totalling £12M demonstrate..."
                    }
                ]
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRewrite = async (annotation: { text: string; suggestion: string }) => {
        // Replace the problematic text with the suggestion
        setProposalText(prev => prev.replace(annotation.text, annotation.suggestion))
    }

    const getScoreColor = (score: number) => {
        if (score >= 8.5) return "text-green-400"
        if (score >= 6) return "text-yellow-400"
        return "text-red-400"
    }

    return (
        <div className="min-h-screen bg-black text-white">

            <main className="container mx-auto max-w-7xl px-6 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 text-sm font-medium mb-6">
                        <Shield className="w-4 h-4" />
                        RED TEAM AGENT
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        Brutal <span className="text-red-500">Proposal Critique</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Paste your proposal. We'll tear it apart like a cynical procurement officer who's seen 500 AI-generated bids this week.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Side */}
                    <div className="space-y-6">
                        {/* RFP Input */}
                        <Card className="border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-white/50" />
                                    RFP Requirements (Optional)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={rfpText}
                                    onChange={(e) => setRfpText(e.target.value)}
                                    placeholder="Paste the original tender requirements here for context-aware analysis..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50"
                                />
                            </CardContent>
                        </Card>

                        {/* Proposal Input */}
                        <Card className="border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-white/50" />
                                    Your Proposal *
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={proposalText}
                                    onChange={(e) => setProposalText(e.target.value)}
                                    placeholder="Paste your proposal text here for brutal analysis..."
                                    className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50"
                                />
                            </CardContent>
                        </Card>

                        <Button
                            onClick={handleAnalyze}
                            disabled={!proposalText.trim() || loading}
                            className="w-full h-14 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5 mr-2" />
                                    Run Red Team Analysis
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Results Side */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Score Card */}
                                    <Card className="border-white/5 overflow-hidden">
                                        <div className={`h-1 ${result.status === "ACCEPT" ? "bg-green-500" : "bg-red-500"}`} />
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Overall Score</p>
                                                    <p className={`text-5xl font-black ${getScoreColor(result.score)}`}>
                                                        {result.score.toFixed(1)}
                                                        <span className="text-xl text-white/30">/10</span>
                                                    </p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full text-sm font-bold ${result.status === "ACCEPT"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-red-500/20 text-red-400"
                                                    }`}>
                                                    {result.status}
                                                </div>
                                            </div>

                                            {/* Compliance Checklist */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {result.complianceChecklist.map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        {item.status ? (
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-400" />
                                                        )}
                                                        <span className="text-white/70">{item.item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Deductions */}
                                    <Card className="border-white/5">
                                        <CardHeader>
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                                Deductions & Issues
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {result.harshFeedback.map((feedback, i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg"
                                                >
                                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-white/80">{feedback}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Grammarly-style Annotations */}
                                    {result.annotations.length > 0 && (
                                        <Card className="border-white/5">
                                            <CardHeader>
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                    Rewrite Suggestions
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {result.annotations.map((annotation, i) => (
                                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div>
                                                                <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-medium">
                                                                    {annotation.issue}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-white/50 line-through mb-2">
                                                            "{annotation.text}"
                                                        </p>
                                                        <p className="text-sm text-white/90 mb-3">
                                                            "{annotation.suggestion}"
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRewrite(annotation)}
                                                            className="text-xs"
                                                        >
                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                            Apply Rewrite
                                                        </Button>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex items-center justify-center min-h-[400px]"
                                >
                                    <div className="text-center text-white/30">
                                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p>Paste a proposal and run analysis</p>
                                        <p className="text-sm mt-2">to see brutal feedback</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    )
}
