"use client"

import * as React from "react"
import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    FileText, Edit3, Wand2, Copy, Check,
    Sparkles, Target, BookOpen, Zap, Save, Eye,
    ChevronLeft, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import ReactMarkdown from 'react-markdown'
import { BANNED_WORDS } from "@/lib/schemas"

// Quick fix suggestions type
interface QuickFix {
    id: string
    type: 'passive_voice' | 'ai_phrase' | 'weak_opener' | 'improvement'
    original: string
    suggestion: string
    reason: string
}

// Inner component that uses useSearchParams
function WarRoomContent() {
    const searchParams = useSearchParams()
    const proposalId = searchParams.get('id')

    const [originalText, setOriginalText] = useState<string>("")
    const [editedText, setEditedText] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [quickFixes, setQuickFixes] = useState<QuickFix[]>([])
    const [analyzing, setAnalyzing] = useState(false)

    // Load proposal from localStorage or API
    useEffect(() => {
        const loadProposal = async () => {
            // First try localStorage (from draft flow)
            const storedFinal = localStorage.getItem("bidguard_final")
            if (storedFinal) {
                const data = JSON.parse(storedFinal)
                setOriginalText(data.finalText || "")
                setEditedText(data.finalText || "")
            }

            // If we have a proposalId, fetch from API
            if (proposalId && proposalId !== 'temp') {
                try {
                    const res = await fetch(`/api/proposals/${proposalId}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (data.proposal?.final_content) {
                            setOriginalText(data.proposal.final_content)
                            setEditedText(data.proposal.final_content)
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch proposal:", e)
                }
            }

            setLoading(false)
        }

        loadProposal()
    }, [proposalId])

    // Analyze text for quick fixes
    const analyzeText = useCallback(() => {
        setAnalyzing(true)
        const fixes: QuickFix[] = []

        // Check for passive voice patterns
        const passivePatterns = [
            { pattern: /will be delivered/gi, suggestion: "we will deliver" },
            { pattern: /is proposed/gi, suggestion: "we propose" },
            { pattern: /has been implemented/gi, suggestion: "we implemented" },
            { pattern: /was developed/gi, suggestion: "we developed" },
            { pattern: /are designed/gi, suggestion: "we design" },
        ]

        passivePatterns.forEach(({ pattern, suggestion }) => {
            const match = pattern.exec(editedText)
            if (match) {
                fixes.push({
                    id: `passive-${fixes.length}`,
                    type: 'passive_voice',
                    original: match[0],
                    suggestion: suggestion,
                    reason: "Passive voice weakens your proposal. Active voice shows ownership."
                })
            }
        })

        // Check for AI-ish phrases
        const aiPhrases = [
            { phrase: "leverage", replacement: "use" },
            { phrase: "utilize", replacement: "use" },
            { phrase: "synergy", replacement: "collaboration" },
            { phrase: "paradigm shift", replacement: "major change" },
            { phrase: "holistic approach", replacement: "comprehensive approach" },
            { phrase: "innovative solution", replacement: "effective solution" },
            { phrase: "cutting-edge", replacement: "modern" },
            { phrase: "best-in-class", replacement: "leading" },
        ]

        aiPhrases.forEach(({ phrase, replacement }) => {
            if (editedText.toLowerCase().includes(phrase)) {
                fixes.push({
                    id: `ai-${fixes.length}`,
                    type: 'ai_phrase',
                    original: phrase,
                    suggestion: replacement,
                    reason: "This phrase is commonly flagged as AI-generated. Consider a more human alternative."
                })
            }
        })

        // Check for banned words
        BANNED_WORDS.forEach(word => {
            if (editedText.toLowerCase().includes(word.toLowerCase())) {
                fixes.push({
                    id: `banned-${fixes.length}`,
                    type: 'ai_phrase',
                    original: word,
                    suggestion: "[remove or rephrase]",
                    reason: "This word is on the banned list for AI detection."
                })
            }
        })

        setQuickFixes(fixes)
        setAnalyzing(false)
    }, [editedText])

    // Apply a quick fix
    const applyFix = (fix: QuickFix) => {
        const regex = new RegExp(fix.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        setEditedText(prev => prev.replace(regex, fix.suggestion))
        setQuickFixes(prev => prev.filter(f => f.id !== fix.id))
    }

    // Copy to clipboard
    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(editedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Save changes
    const saveChanges = async () => {
        setSaving(true)

        // Save to localStorage
        const storedFinal = localStorage.getItem("bidguard_final")
        if (storedFinal) {
            const data = JSON.parse(storedFinal)
            data.finalText = editedText
            localStorage.setItem("bidguard_final", JSON.stringify(data))
        }

        // If we have a proposal ID, save to API
        if (proposalId && proposalId !== 'temp') {
            try {
                await fetch(`/api/proposals/${proposalId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ final_content: editedText })
                })
            } catch (e) {
                console.error("Failed to save:", e)
            }
        }

        setTimeout(() => setSaving(false), 500)
    }

    // Word count
    const wordCount = editedText.split(/\s+/).filter(Boolean).length

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!editedText) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Card className="max-w-md border-white/10">
                    <CardContent className="pt-8 text-center space-y-4">
                        <FileText className="w-12 h-12 text-white/20 mx-auto" />
                        <h2 className="text-xl font-bold text-white">No Proposal Found</h2>
                        <p className="text-white/50 text-sm">
                            Generate a proposal first, then come back to edit it.
                        </p>
                        <Button onClick={() => window.location.href = '/tenders'}>
                            Find Tenders
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-white/50 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </a>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                War Room
                            </h1>
                            <p className="text-xs text-white/40 uppercase tracking-widest">
                                Proposal Editor
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs text-white/40 border border-white/10 px-3 py-1.5 rounded">
                            {wordCount} words
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-white/70"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {showPreview ? 'Edit' : 'Preview'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            className="text-white/70"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button onClick={saveChanges} disabled={saving}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Main Editor */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {showPreview ? (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Card className="border-white/10">
                                        <CardHeader className="border-b border-white/5">
                                            <CardTitle className="flex items-center gap-2 text-sm">
                                                <BookOpen className="w-4 h-4" />
                                                Document Preview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="prose prose-invert prose-lg max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-primary" {...props} />,
                                                        h2: ({ ...props }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-white" {...props} />,
                                                        h3: ({ ...props }) => <h3 className="text-lg font-medium mb-2 mt-4 text-white/80" {...props} />,
                                                        p: ({ ...props }) => <p className="mb-4 leading-7 text-white/80" {...props} />,
                                                        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                                        ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
                                                        strong: ({ ...props }) => <strong className="font-bold text-white" {...props} />,
                                                    }}
                                                >
                                                    {editedText}
                                                </ReactMarkdown>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="editor"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <Card className="border-white/10">
                                        <CardHeader className="border-b border-white/5">
                                            <CardTitle className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    <Edit3 className="w-4 h-4" />
                                                    Edit Proposal
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={analyzeText}
                                                    disabled={analyzing}
                                                    className="text-xs"
                                                >
                                                    {analyzing ? (
                                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                    ) : (
                                                        <Wand2 className="w-3 h-3 mr-1" />
                                                    )}
                                                    Analyze
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <textarea
                                                value={editedText}
                                                onChange={(e) => setEditedText(e.target.value)}
                                                className="w-full min-h-[600px] bg-transparent text-white/90 p-6 resize-none focus:outline-none font-serif text-base leading-relaxed"
                                                placeholder="Your proposal text..."
                                            />
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar - Quick Fixes */}
                    <div className="space-y-4">
                        <Card className="border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    Quick Fixes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {quickFixes.length === 0 ? (
                                    <div className="text-center py-6 text-white/40 text-sm">
                                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        Click &quot;Analyze&quot; to find improvements
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {quickFixes.slice(0, 5).map((fix) => (
                                            <motion.div
                                                key={fix.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-3 bg-white/5 rounded-lg border border-white/10"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${fix.type === 'passive_voice' ? 'bg-amber-500/20 text-amber-400' :
                                                        fix.type === 'ai_phrase' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {fix.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    <div className="text-red-400/80 line-through">&quot;{fix.original}&quot;</div>
                                                    <div className="text-green-400">→ &quot;{fix.suggestion}&quot;</div>
                                                </div>
                                                <p className="text-[10px] text-white/40 mt-2">{fix.reason}</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full mt-2 text-xs h-7"
                                                    onClick={() => applyFix(fix)}
                                                >
                                                    Apply Fix
                                                </Button>
                                            </motion.div>
                                        ))}
                                        {quickFixes.length > 5 && (
                                            <p className="text-xs text-white/40 text-center">
                                                +{quickFixes.length - 5} more issues
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card className="border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Document Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/50">Words</span>
                                    <span className="font-mono">{wordCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Characters</span>
                                    <span className="font-mono">{editedText.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Issues Found</span>
                                    <span className="font-mono text-amber-400">{quickFixes.length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

// Default export wraps in Suspense for useSearchParams
export default function WarRoomPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <WarRoomContent />
        </Suspense>
    )
}
