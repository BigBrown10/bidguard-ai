"use client"

import * as React from "react"
import { X, Sparkles, Loader2, CheckCircle2, Building2, Globe, FileText, Award } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { supabase } from "@/lib/supabase"

interface CompanyProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete: () => void
}

const ISO_OPTIONS = [
    { id: 'iso9001', label: 'ISO 9001 (Quality Management)' },
    { id: 'iso14001', label: 'ISO 14001 (Environmental)' },
    { id: 'iso27001', label: 'ISO 27001 (Information Security)' },
    { id: 'iso45001', label: 'ISO 45001 (Health & Safety)' },
    { id: 'cyberessentials', label: 'Cyber Essentials / Plus' },
]

export function CompanyProfileModal({ isOpen, onClose, onComplete }: CompanyProfileModalProps) {
    const [step, setStep] = React.useState<'form' | 'researching' | 'suggest' | 'saving'>('form')
    const [formData, setFormData] = React.useState({
        company_name: '',
        website: '',
        business_description: '',
        sectors: [] as string[],
        isoCerts: [] as string[],
        achievements: '',
        companies_house_number: '',
    })
    const [aiSuggestion, setAiSuggestion] = React.useState('')
    const [error, setError] = React.useState('')

    // Reset on open
    React.useEffect(() => {
        if (isOpen) {
            setStep('form')
            loadExistingProfile()
        }
    }, [isOpen])

    const loadExistingProfile = async () => {
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile && profile.company_name) {
            setFormData({
                company_name: profile.company_name || '',
                website: profile.website || '',
                business_description: profile.business_description || '',
                sectors: profile.sectors || [],
                isoCerts: profile.iso_certs || [],
                achievements: profile.achievements || '',
                companies_house_number: profile.companies_house_number || '',
            })
        }
    }

    const handleResearch = async () => {
        if (!formData.company_name) {
            setError('Company name is required')
            return
        }
        setError('')
        setStep('researching')

        try {
            const res = await fetch('/api/company-research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: formData.company_name,
                    website: formData.website,
                    currentDescription: formData.business_description,
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.suggestion && data.suggestion !== formData.business_description) {
                    setAiSuggestion(data.suggestion)
                    setStep('suggest')
                } else {
                    await saveProfile()
                }
            } else {
                // Fallback - save without AI enhancement
                await saveProfile()
            }
        } catch (e) {
            console.error('Research failed:', e)
            await saveProfile()
        }
    }

    const saveProfile = async (useAiSuggestion = false) => {
        setStep('saving')

        if (!supabase) {
            onComplete()
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('Not authenticated')
            setStep('form')
            return
        }

        const { error: updateError } = await supabase.from('profiles').upsert({
            id: user.id,
            company_name: formData.company_name,
            website: formData.website,
            business_description: useAiSuggestion ? aiSuggestion : formData.business_description,
            sectors: formData.sectors,
            iso_certs: formData.isoCerts,
            achievements: formData.achievements,
            companies_house_number: formData.companies_house_number,
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
        })

        if (updateError) {
            setError(updateError.message)
            setStep('form')
            return
        }

        onComplete()
    }

    const toggleIso = (id: string) => {
        setFormData(prev => ({
            ...prev,
            isoCerts: prev.isoCerts.includes(id)
                ? prev.isoCerts.filter(c => c !== id)
                : [...prev.isoCerts, id]
        }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/10 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-black border-b border-white/10 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-primary" />
                            Set Up Company Profile
                        </h2>
                        <p className="text-white/50 text-sm mt-1">Required to access BID generation features</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {step === 'form' && (
                        <>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Company Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    Company Name <span className="text-primary">*</span>
                                </label>
                                <Input
                                    placeholder="e.g. Acme Solutions Ltd"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                />
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                    Website (Optional)
                                </label>
                                <Input
                                    placeholder="https://www.example.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                                <p className="text-xs text-white/40">We'll research your site to enhance your profile</p>
                            </div>

                            {/* About */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-green-400" />
                                    About Your Company <span className="text-primary">*</span>
                                </label>
                                <textarea
                                    className="w-full h-28 p-3 bg-black/60 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none focus:border-primary/50 focus:outline-none"
                                    placeholder="Describe your company, services, expertise, and unique selling points..."
                                    value={formData.business_description}
                                    onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                                />
                            </div>

                            {/* ISO Certifications */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-yellow-400" />
                                    Certifications
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ISO_OPTIONS.map(iso => (
                                        <button
                                            key={iso.id}
                                            type="button"
                                            onClick={() => toggleIso(iso.id)}
                                            className={`p-3 rounded-lg border text-left text-sm transition-all ${formData.isoCerts.includes(iso.id)
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'
                                                }`}
                                        >
                                            {formData.isoCerts.includes(iso.id) && <CheckCircle2 className="w-4 h-4 inline mr-2" />}
                                            {iso.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Key Achievements (Optional)</label>
                                <textarea
                                    className="w-full h-20 p-3 bg-black/60 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none focus:border-primary/50 focus:outline-none"
                                    placeholder="e.g. Won £5M NHS contract in 2023, Delivered 50+ government projects..."
                                    value={formData.achievements}
                                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                                />
                            </div>

                            {/* Companies House Number */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Companies House Number (Optional)</label>
                                <Input
                                    placeholder="e.g. 12345678"
                                    value={formData.companies_house_number}
                                    onChange={(e) => setFormData({ ...formData, companies_house_number: e.target.value })}
                                />
                                <p className="text-xs text-white/40">For verification badge on your proposals</p>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose}>
                                    Skip for now
                                </Button>
                                <Button onClick={handleResearch} className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Save & Research
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'researching' && (
                        <div className="py-16 text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                            <h3 className="text-xl font-bold text-white">Researching Your Company...</h3>
                            <p className="text-white/50">AI is analyzing your online presence to enhance your profile</p>
                        </div>
                    )}

                    {step === 'suggest' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-white">AI Suggested Improvement</h3>
                                <p className="text-white/50 text-sm">Based on our research, we found additional information</p>
                            </div>

                            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                                <h4 className="text-sm font-bold text-primary mb-2">Suggested Description:</h4>
                                <p className="text-white/80 text-sm whitespace-pre-wrap">{aiSuggestion}</p>
                            </div>

                            <div className="flex justify-center gap-3">
                                <Button variant="outline" onClick={() => saveProfile(false)}>
                                    Keep My Original
                                </Button>
                                <Button onClick={() => saveProfile(true)} className="gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Use AI Version
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'saving' && (
                        <div className="py-16 text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                            <h3 className="text-xl font-bold text-white">Saving Profile...</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
