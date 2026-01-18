"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { FileUpload } from "@/components/FileUpload"
import { IngestionSchema, type IngestionFormData } from "@/lib/schemas"

export default function IngestPage() {
    const router = useRouter()
    const [formData, setFormData] = React.useState<IngestionFormData>({
        projectName: "",
        clientName: "",
        rfpFile: null,
        knowledgeFile: null,
        knowledgeUrl: "",
    })
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)

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

        // Simulate upload/processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // In a real app, we would upload files here and create a session
        // For now, we'll store basic info in local storage or URL params if needed
        // But since we are mock-first for the "Intelligence" phase, we'll just push to research

        router.push("/research")
    }

    return (
        <div className="min-h-screen bg-[#FBFBFD]">
            <Header />
            <main className="container mx-auto max-w-3xl px-6 py-12">
                <div className="space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-primary">New Bid Strategy</h1>
                        <p className="text-muted-foreground">Upload your RFP and company knowledge to begin the Red Team process.</p>
                    </div>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                            <CardDescription>Basic information about the procurement opportunity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Project Name</label>
                                <Input
                                    placeholder="e.g. UK Government Digital Services Framework"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                    className={errors.projectName ? "border-red-500" : ""}
                                />
                                {errors.projectName && <p className="text-xs text-red-500">{errors.projectName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client Name (Optional)</label>
                                <Input
                                    placeholder="e.g. Cabinet Office"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                            <CardDescription>The system needs the RFP and your company profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FileUpload
                                label="Upload RFP (PDF)"
                                value={formData.rfpFile}
                                onChange={(file) => setFormData({ ...formData, rfpFile: file })}
                                error={errors.rfpFile}
                            />

                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-muted-foreground">Company Intelligence</span>
                                    </div>
                                </div>

                                <FileUpload
                                    label="Upload Company Profile / Case Studies (PDF)"
                                    value={formData.knowledgeFile}
                                    onChange={(file) => setFormData({ ...formData, knowledgeFile: file })}
                                    accept=".pdf"
                                    error={errors.knowledgeFile}
                                />
                                {/* Fallback to URL if needed, but PDF is primary */}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button size="lg" onClick={handleSubmit} disabled={isSubmitting} className="min-w-[200px]">
                            {isSubmitting ? "Analyzing..." : "Initialize Agent Swarm"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
