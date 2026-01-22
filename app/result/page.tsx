"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Download, RefreshCw, Loader2, FileText } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { WinMeter } from "@/components/WinMeter"
import { ComplianceSidebar, ComplianceItem } from "@/components/ComplianceSidebar"
import { BANNED_WORDS } from "@/lib/schemas"

export default function ResultPage() {
    const [result, setResult] = React.useState<any>(null)
    const [exporting, setExporting] = React.useState(false)
    const contentRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const storedFinal = localStorage.getItem("bidguard_final")
        if (storedFinal) {
            setResult(JSON.parse(storedFinal))
        }
    }, [])

    // Clean text from AI artifacts - PRESERVE MARKDOWN STRUCTURE
    const cleanText = (text: string) => {
        if (!text) return ""
        let cleaned = text
            .replace(/\[\d+\]/g, '')  // Remove [1], [2] citations
            .replace(/\(Word count:.*?\)/gi, '')  // Remove word count notes

        // Remove banned words (case insensitive) but preserve sentence structure
        BANNED_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi')
            cleaned = cleaned.replace(regex, '')
        })

        // Clean up double spaces but preserve line breaks for markdown
        return cleaned.replace(/  +/g, ' ').trim()
    }

    // PDF Export
    const handleExportPDF = async () => {
        if (!contentRef.current) return
        setExporting(true)

        try {
            const html2canvas = (await import('html2canvas')).default
            const { jsPDF } = await import('jspdf')

            const element = contentRef.current
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

            const imgWidth = 210
            const pageHeight = 297
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            let heightLeft = imgHeight
            let position = 0

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight

            while (heightLeft > 0) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
            }

            pdf.save(`BidGuard_Proposal_${Date.now()}.pdf`)
        } catch (error) {
            console.error("PDF Export failed:", error)
            window.print()
        } finally {
            setExporting(false)
        }
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const wordCount = result.finalText ? result.finalText.split(/\s+/).length : 0
    const winPercentage = Math.min(Math.round((result.critique?.score || 7) * 10), 100)

    const complianceItems: ComplianceItem[] = [
        { id: "social_value", label: "Social Value", checked: /social value/i.test(result.finalText || '') },
        { id: "carbon", label: "Carbon Reduction", checked: /carbon|net zero|sustainability/i.test(result.finalText || '') },
        { id: "iso", label: "ISO Standards", checked: /iso \d+|iso9001|iso27001/i.test(result.finalText || '') },
        { id: "slavery", label: "Modern Slavery", checked: /modern slavery/i.test(result.finalText || '') }
    ]

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 print:bg-white print:text-black">
            <main className="container mx-auto max-w-5xl px-6 py-12 space-y-8 print:p-0">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Final Proposal</h1>
                        <p className="text-white/60">The Swarm has selected and humanized the optimum strategy.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button className='bg-white/10 hover:bg-white/20' onClick={() => window.location.href = '/draft'}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                        <Button onClick={handleExportPDF} disabled={exporting}>
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="mr-2 h-4 w-4" /> Export PDF</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">

                    {/* Main Content - BLACK BACKGROUND */}
                    <Card className="lg:col-span-2 border-0 shadow-lg print:shadow-none print:border-none">
                        <CardHeader>
                            <CardTitle className="flex justify-between print:hidden">
                                Proposal Document
                                <span className="text-xs font-normal text-white/60 bg-white/10 px-2 py-1 rounded">
                                    Strategy: {result.originalDraft?.strategyName?.toUpperCase() || "OPTIMIZED"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Hidden div for PDF (white background) */}
                            <div ref={contentRef} className="hidden">
                                <div className="bg-white text-black p-8" style={{ fontFamily: 'Georgia, serif' }}>
                                    <ReactMarkdown>{cleanText(result.finalText)}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Visible content - DARK THEME */}
                            <div className="prose prose-invert prose-sm max-w-none text-white/90 whitespace-pre-wrap font-serif leading-relaxed print:text-black print:prose p-8 bg-black/40 rounded-xl border border-white/5 print:bg-white print:border-0">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-primary uppercase" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-white uppercase" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg font-medium mb-2 mt-4 text-white/80" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-4 leading-7 text-white/80" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                    }}
                                >
                                    {cleanText(result.finalText)}
                                </ReactMarkdown>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar - ORIGINAL STYLE */}
                    <div className="space-y-6 print:hidden">
                        <Card className="border-0 shadow-sm">
                            <CardHeader><CardTitle className="text-lg">Bid Guard Analysis</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-center">
                                    <WinMeter percentage={winPercentage} size={100} />
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <span className="text-xs uppercase text-white/50 font-bold">Word Count</span>
                                    <div className="flex items-end gap-2 text-white">
                                        <span className="text-xl font-bold">{wordCount}</span>
                                        <span className="text-xs pb-1 text-white/50">words</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <ComplianceSidebar items={complianceItems} />
                    </div>
                </div>
            </main>
        </div>
    )
}


