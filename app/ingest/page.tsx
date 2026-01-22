"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { FileUpload } from "@/components/FileUpload"
import { IngestionSchema, type IngestionFormData } from "@/lib/schemas"

import { Suspense } from "react"

function IngestContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [formData, setFormData] = React.useState<IngestionFormData>({
        projectName: searchParams.get("title") || "",
        clientName: searchParams.get("client") || "",
        rfpText: searchParams.get("description") || "",
        rfpFile: null,
        knowledgeFile: null,
        knowledgeUrl: "",
        knowledgeUrl: "",
        companyContext: "",
        userStrategy: "", // New optional field
    })
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Clear RFP Text if File is uploaded (optional logic, but keeps UI clean)
    // Actually, let's allow both or manual override.

    // NEW: Auto-fill profile & Pending Tender Import
    React.useEffect(() => {
        const loadInitData = async () => {
            // 1. Check for pending tender from Marketplace
            const pendingImport = localStorage.getItem("pending_tender_import")
            if (pendingImport) {
                try {
                    const tender = JSON.parse(pendingImport)
                    setFormData(prev => ({
                        ...prev,
                        projectName: tender.title || prev.projectName,
                        clientName: tender.buyer || prev.clientName,
                        rfpText: tender.description || prev.rfpText,
                    }))
                    // Clear it so it doesn't persist on refresh/subsequent visits unwantedly
                    localStorage.removeItem("pending_tender_import")
                } catch (e) {
                    console.error("Failed to parse tender import", e)
                }
            }

            // 2. Load User Profile
            if (!supabase) return
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        knowledgeUrl: prev.knowledgeUrl || profile.website || "",
                        companyContext: prev.companyContext || profile.business_description || "",
                    }))
                }
            }
        }
        loadInitData()
    }, [])

    const validate = () => {
        const result = IngestionSchema.safeParse(formData)
        if (!result.success) {
            const fieldErrors: Record<string, string> = {}
            result.error.issues.forEach((issue) => {
                if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message
            })
            setErrors(fieldErrors)
            return false
        }
        setErrors({})
        return true
    }

    const handleSubmit = async () => {
        if (!validate()) return
        setIsSubmitting(true)

        // Save config for next steps
        localStorage.setItem("bidguard_config", JSON.stringify({
            projectName: formData.projectName,
            clientName: formData.clientName || "Unknown Client",
            companyUrl: formData.knowledgeUrl,
            companyUrl: formData.knowledgeUrl,
            companyContext: formData.companyContext, // Pass context
            userStrategy: formData.userStrategy, // Pass user ideas
            rfpText: formData.rfpText // Store text context
        }))

        // Simulate upload/processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        router.push("/research")
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary text-glow">New Bid Strategy</h1>
                <p className="text-white/60">Upload your RFP and company knowledge to begin the Red Team process.</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>Basic information about the procurement opportunity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Project Name <span className="text-primary">*</span></label>
                        <Input
                            placeholder="e.g. UK Government Digital Services Framework"
                            value={formData.projectName}
                            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                            className={errors.projectName ? "border-red-500" : ""}
                        />
                        {errors.projectName && <p className="text-xs text-red-500">{errors.projectName}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Client Name (Optional)</label>
                        <Input
                            placeholder="e.g. Cabinet Office"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>RFP Context</CardTitle>
                    <CardDescription>Provide the requirements. You can upload a PDF or paste text.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Paste Requirements / Description</label>
                        <textarea
                            className="cyber-input w-full h-32 p-3 bg-black/40 resize-none text-sm"
                            placeholder="Paste the tender description or requirements here..."
                            value={formData.rfpText || ""}
                            onChange={(e) => setFormData({ ...formData, rfpText: e.target.value })}
                        />
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-white/30 text-xs uppercase">OR Upload Document</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <FileUpload
                        label="Upload RFP (PDF)"
                        value={formData.rfpFile}
                        onChange={(file) => setFormData({ ...formData, rfpFile: file })}
                        error={errors.rfpFile}
                    />

                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-2 text-white/40">Company Intelligence</span>
                            </div>
                        </div>

                        <FileUpload
                            label="Upload Company Profile / Case Studies (PDF)"
                            value={formData.knowledgeFile}
                            onChange={(file) => setFormData({ ...formData, knowledgeFile: file })}
                            accept=".pdf"
                            error={errors.knowledgeFile}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Company Overview & Capabilities</label>
                            <textarea
                                className="cyber-input w-full h-24 p-3 bg-black/40 resize-none text-sm"
                                placeholder="Paste your capabilities: 'We are ISO 27001 certified, have 50 staff, and specialize in...'"
                                value={formData.companyContext || ""}
                                onChange={(e) => setFormData({ ...formData, companyContext: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-primary">Your Strategy / Key Points (Optional)</label>
                            <p className="text-xs text-white/50 mb-2">Tell the AI what to focus on. If you leave this blank, the AI will invent a strategy.</p>
                            <textarea
                                className="cyber-input w-full h-24 p-3 bg-black/40 resize-none text-sm border-primary/30 focus:border-primary"
                                placeholder="e.g. 'Focus on our local presence in Derby', 'Highlight our apprenticeship scheme', 'We want to undercut on price'"
                                value={formData.userStrategy || ""}
                                onChange={(e) => setFormData({ ...formData, userStrategy: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col items-end gap-2 pt-4">
                {Object.keys(errors).length > 0 && (
                    <p className="text-sm text-red-600 font-medium">Please fix the errors above before proceeding.</p>
                )}
                <Button size="lg" onClick={handleSubmit} disabled={isSubmitting} className="min-w-[200px] text-lg">
                    {isSubmitting ? "Analyzing..." : "Initialize Agent Swarm"}
                </Button>
            </div>
        </div>
    )
}

export default function IngestPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <main className="container mx-auto max-w-3xl px-6 py-12">
                <Suspense fallback={<div className="text-center text-white/50">Loading Interface...</div>}>
                    <IngestContent />
                </Suspense>
            </main>
        </div>
    )
}
