"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { FileUpload } from "@/components/FileUpload"
import { IngestionSchema, type IngestionFormData } from "@/lib/schemas"

export default function IngestPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [formData, setFormData] = React.useState<IngestionFormData>({
        projectName: searchParams.get("title") || "",
        clientName: searchParams.get("client") || "",
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
        console.log("Submitting form...", formData)
        if (!validate()) {
            const validationResult = IngestionSchema.safeParse(formData)
            if (!validationResult.success) {
                console.error("Validation failed", validationResult.error)
                alert(`Validation Failed:\n${validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')}`)
            }
            return
        }
        setIsSubmitting(true)

        // Save config for next steps
        localStorage.setItem("bidguard_config", JSON.stringify({
            projectName: formData.projectName,
            clientName: formData.clientName || "Unknown Client",
            companyUrl: formData.knowledgeUrl
        }))

        // Simulate upload/processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        router.push("/research")
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Header />
            <main className="container mx-auto max-w-3xl px-6 py-12">
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
                            <CardTitle>Documents</CardTitle>
                            <CardDescription>The system needs the RFP and your company profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FileUpload
                                label="Upload RFP (PDF) *"
                                value={formData.rfpFile}
                                onChange={(file) => setFormData({ ...formData, rfpFile: file })}
                                error={errors.rfpFile}
                            />

                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-black px-2 text-white/40">Company Intelligence</span>
                                    </div>
                                </div>

                                <FileUpload
                                    label="Upload Company Profile / Case Studies (PDF) *"
                                    value={formData.knowledgeFile}
                                    onChange={(file) => setFormData({ ...formData, knowledgeFile: file })}
                                    accept=".pdf"
                                    error={errors.knowledgeFile}
                                />
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
            </main>
        </div>
    )
}
