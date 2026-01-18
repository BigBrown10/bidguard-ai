"use client"

import * as React from "react"
import { Header } from "@/components/Header"
import { ProcessingHUD } from "@/components/ProcessingHUD"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { FileText, Download, Wand2 } from "lucide-react"

export default function ResultPage() {
    const [isHumanizing, setIsHumanizing] = React.useState(false)
    const [isHumanized, setIsHumanized] = React.useState(false)
    const [text, setText] = React.useState(`
    Executive Summary
    
    We are delighted to submit this proposal for the [Project Name]. Our innovative approach leverages cutting-edge technology to deliver significant cost savings and operational efficiency. By integrating our proprietary AI-driven analytics platform, we will transform your current workflow, ensuring real-time data visibility and enhanced decision-making capabilities. 
    
    Our team brings extensive experience in the UK public sector, having successfully delivered similar transformational projects for the Department for Transport and HMRC. We understand the unique challenges of this environment and are committed to delivering social value through local job creation and sustainable supply chain practices.
    
    Key Benefits:
    - 30% reduction in processing time.
    - Full compliance with the Modern Slavery Act.
    - Net Zero aligned delivery model.
    `)

    const handleHumanize = async () => {
        setIsHumanizing(true)
        // Simulate API call to Humanizer Agent
        await new Promise(r => setTimeout(r, 2000))
        setText(`
    Executive Summary
    
    We are pleased to present this proposal for [Project Name]. Our approach focuses on using advanced technology to reduce costs and improve how you work. By adopting our AI analytics platform, you will gain clearer visibility of your data in real-time, enabling better decision-making across the organisation.
    
    With a strong track record in the UK public sector, including major projects for the Department for Transport and HMRC, we understand the specific pressures you face. We are fully committed to delivering tangible social value, from creating local jobs to ensuring our supply chain remains sustainable.
    
    Key Benefits:
    - Processes completed 30% faster.
    - rigorous adherence to the Modern Slavery Act.
    - A delivery model that supports your Net Zero targets.
    `)
        setIsHumanized(true)
        setIsHumanizing(false)
    }

    return (
        <div className="min-h-screen bg-[#FBFBFD]">
            <Header />
            <ProcessingHUD isProcessing={isHumanizing} status="Humanizing Tone..." />

            <main className="container mx-auto max-w-5xl px-6 py-12 space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Final Proposal</h1>
                        <p className="text-muted-foreground">Review, refine, and export your winning bid.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handleHumanize} disabled={isHumanizing || isHumanized}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            {isHumanized ? "Tone Humanized" : "Humanize Tone"}
                        </Button>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-0 shadow-lg spatial-card">
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                Proposal Document
                                <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                                    {isHumanized ? "Version: Humanized (UK)" : "Version: Draft v1"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                                {text}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-0 shadow-sm">
                            <CardHeader><CardTitle className="text-lg">Bid Guard Analysis</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-xs uppercase text-muted-foreground font-bold">Readability Score</span>
                                    <div className="flex items-end gap-2 text-primary">
                                        <span className="text-3xl font-bold">{isHumanized ? "72" : "58"}</span>
                                        <span className="text-sm pb-1 text-muted-foreground">/ 100</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs uppercase text-muted-foreground font-bold">AI Detection Risk</span>
                                    <div className="flex items-end gap-2 text-green-600">
                                        <span className="text-3xl font-bold">{isHumanized ? "Low" : "High"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-blue-50/50">
                            <CardHeader><CardTitle className="text-lg">Compliance Audit</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex gap-2 items-center text-green-700"><FileText className="h-4 w-4" /> Social Value Included</li>
                                    <li className="flex gap-2 items-center text-green-700"><FileText className="h-4 w-4" /> Modern Slavery Act</li>
                                    <li className="flex gap-2 items-center text-green-700"><FileText className="h-4 w-4" /> GDPR Reference</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
