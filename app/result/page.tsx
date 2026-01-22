"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Download, RefreshCw, Loader2 } from "lucide-react"
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

    // Clean text from AI artifacts
    const cleanText = (text: string) => {
        if (!text) return ""
        let cleaned = text
            .replace(/\[\d+\]/g, '') // Remove citations
            .replace(/\[.*?\]/g, '')
            .replace(/\(Word count:.*?\)/gi, '')
            .replace(/—/g, ', ')
            .replace(/\*\*/g, '')

        // Remove banned words (case insensitive)
        BANNED_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi')
            cleaned = cleaned.replace(regex, '')
        })

        return cleaned.replace(/\s+/g, ' ').trim()
    }

    // Strict PDF Export using html-to-image + jsPDF approach
    const handleExportPDF = async () => {
        if (!contentRef.current) return
        setExporting(true)

        try {
            // Dynamic import for client-side only
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
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const imgWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            let heightLeft = imgHeight
            let position = 0

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight

            // Handle multi-page
            while (heightLeft > 0) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
            }

            pdf.save(`BidGuard_Proposal_${Date.now()}.pdf`)
        } catch (error) {
            console.error("PDF Export failed:", error)
            // Fallback to print
            window.print()
        } finally {
            setExporting(false)
        }
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const wordCount = result.finalText ? result.finalText.split(/\s+/).length : 0
    const winPercentage = Math.min(Math.round((wordCount / 2000) * 100), 100)

    // Derive compliance from text analysis
    const complianceItems: ComplianceItem[] = [
        { id: "social_value", label: "Social Value", checked: /social value/i.test(result.finalText) },
        { id: "carbon", label: "Carbon Reduction", checked: /carbon|net zero|sustainability/i.test(result.finalText) },
        { id: "iso", label: "ISO Standards", checked: /iso \d+|iso9001|iso27001/i.test(result.finalText) },
        { id: "slavery", label: "Modern Slavery", checked: /modern slavery/i.test(result.finalText) }
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between print:hidden">
                <h1 className="text-lg font-bold">Final Proposal</h1>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/draft'}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="container mx-auto max-w-6xl px-4 py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* PDF Content Container */}
                        <div
                            ref={contentRef}
                            className="bg-white text-black p-8 md:p-12 rounded-2xl shadow-lg"
                            style={{ fontFamily: 'Georgia, serif' }}
                        >
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 uppercase" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3 mt-6 uppercase" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-medium mb-2 mt-4" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-4 leading-7 text-justify" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                }}
                            >
                                {cleanText(result.finalText)}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Sidebar (Hidden on mobile, visible on desktop) */}
                    <div className="hidden lg:block space-y-6 print:hidden">
                        {/* Win Meter */}
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle className="text-sm">Win Probability</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <WinMeter percentage={winPercentage} size={100} />
                            </CardContent>
                        </Card>

                        {/* Compliance */}
                        <ComplianceSidebar items={complianceItems} />

                        {/* Word Count */}
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-3xl font-bold text-white">{wordCount}</p>
                                <p className="text-xs text-white/50 uppercase tracking-widest">Words</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Mobile Stats Row */}
                <div className="lg:hidden mt-6 grid grid-cols-3 gap-4 print:hidden">
                    <Card className="text-center p-4">
                        <WinMeter percentage={winPercentage} size={60} strokeWidth={4} />
                    </Card>
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold">{wordCount}</p>
                        <p className="text-[10px] text-white/50 uppercase">Words</p>
                    </Card>
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold text-green-400">
                            {complianceItems.filter(i => i.checked).length}/{complianceItems.length}
                        </p>
                        <p className="text-[10px] text-white/50 uppercase">Compliant</p>
                    </Card>
                </div>
            </main>
        </div>
    )
}

