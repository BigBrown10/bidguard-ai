"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, FileText, Globe, ArrowRight, Loader2, Sparkles, CheckCircle2, Award, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"

interface CompanyDetailsGateProps {
    isOpen: boolean
    onComplete: () => void
    onSkip?: () => void
}

const ISO_OPTIONS = [
    { id: 'iso9001', label: 'ISO 9001' },
    { id: 'iso14001', label: 'ISO 14001' },
    { id: 'iso27001', label: 'ISO 27001' },
    { id: 'iso45001', label: 'ISO 45001' },
    { id: 'cyberessentials', label: 'Cyber Essentials' },
]

export function CompanyDetailsGate({ isOpen, onComplete, onSkip }: CompanyDetailsGateProps) {
    const [step, setStep] = React.useState<'form' | 'researching' | 'suggest' | 'saving'>('form')
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        company_name: "",
        business_description: "",
        website: "",
        sectors: [] as string[],
        isoCerts: [] as string[],
        achievements: "",
        companies_house_number: "",
    })
    const [aiSuggestion, setAiSuggestion] = React.useState("")

    const SECTORS = [
        "Healthcare / NHS",
        "Technology / Digital",
        "Defence / Security",
        "Construction",
        "Education",
        "Transport / Infrastructure",
        "Professional Services",
        "Energy / Utilities"
    ]

    // Load existing profile on open
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
                company_name: profile.company_name || "",
                business_description: profile.business_description || "",
                website: profile.website || "",
                sectors: profile.sectors || [],
                isoCerts: profile.iso_certs || [],
                achievements: profile.achievements || "",
                companies_house_number: profile.companies_house_number || "",
            })
        }
    }

    const handleSectorToggle = (sector: string) => {
        setFormData(prev => ({
            ...prev,
            sectors: prev.sectors.includes(sector)
                ? prev.sectors.filter(s => s !== sector)
                : [...prev.sectors, sector]
        }))
    }

    const handleIsoToggle = (id: string) => {
        setFormData(prev => ({
            ...prev,
            isoCerts: prev.isoCerts.includes(id)
                ? prev.isoCerts.filter(c => c !== id)
                : [...prev.isoCerts, id]
        }))
    }

    const handleResearch = async () => {
        if (!formData.company_name.trim()) return
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
                if (data.suggestion && data.suggestion.length > formData.business_description.length) {
                    setAiSuggestion(data.suggestion)
                    setStep('suggest')
                    return
                }
            }
            // Fallback - save without AI
            await handleSubmit()
        } catch (e) {
            console.error('Research failed:', e)
            await handleSubmit()
        }
    }

    const handleSubmit = async (useAiSuggestion = false) => {
        setStep('saving')
        setLoading(true)

        try {
            if (!supabase) {
                onComplete()
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                window.location.href = '/login'
                return
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    company_name: formData.company_name.trim(),
                    business_description: useAiSuggestion ? aiSuggestion : formData.business_description.trim(),
                    website: formData.website.trim(),
                    sectors: formData.sectors,
                    iso_certs: formData.isoCerts,
                    achievements: formData.achievements.trim(),
                    companies_house_number: formData.companies_house_number.trim(),
                    onboarding_complete: true,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            onComplete()
        } catch (error) {
            console.error("Failed to save company details:", error)
            setStep('form')
        } finally {
            setLoading(false)
        }
    }

    const isValid = formData.company_name.trim().length > 0 && formData.business_description.trim().length > 0

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl px-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            {step === 'form' && (
                                <>
                                    {/* Header */}
                                    <div className="p-8 pb-6 text-center border-b border-white/5">
                                        <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                            <Building2 className="w-8 h-8 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
                                        <p className="text-white/60 text-sm">
                                            Required to generate tailored, winning proposals.
                                        </p>
                                    </div>

                                    {/* Form */}
                                    <div className="p-8 space-y-5">
                                        {/* Company Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">
                                                Company Name <span className="text-primary">*</span>
                                            </label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                                <input
                                                    type="text"
                                                    value={formData.company_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                                                    placeholder="Acme Consulting Ltd"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>

                                        {/* Website */}
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">
                                                Website (for AI Research)
                                            </label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                                <input
                                                    type="url"
                                                    value={formData.website}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                                    placeholder="https://acme-consulting.co.uk"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>

                                        {/* Business Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">
                                                About Your Company <span className="text-primary">*</span>
                                            </label>
                                            <div className="relative">
                                                <FileText className="absolute left-4 top-4 w-4 h-4 text-white/30" />
                                                <textarea
                                                    value={formData.business_description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, business_description: e.target.value }))}
                                                    placeholder="We are a leading provider of digital transformation services specializing in NHS and public sector..."
                                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* ISO Certifications */}
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4 text-yellow-400" />
                                                Certifications
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {ISO_OPTIONS.map(iso => (
                                                    <button
                                                        key={iso.id}
                                                        type="button"
                                                        onClick={() => handleIsoToggle(iso.id)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formData.isoCerts.includes(iso.id)
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {formData.isoCerts.includes(iso.id) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                                        {iso.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sectors */}
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">
                                                Primary Sectors
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {SECTORS.map(sector => (
                                                    <button
                                                        key={sector}
                                                        onClick={() => handleSectorToggle(sector)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formData.sectors.includes(sector)
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {sector}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-8 pt-4 border-t border-white/5 flex gap-3">
                                        {onSkip && (
                                            <Button variant="outline" onClick={onSkip} className="flex-1">
                                                Skip for now
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleResearch}
                                            disabled={!isValid || loading}
                                            className="flex-1 gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Save & Research
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            )}

                            {step === 'researching' && (
                                <div className="p-16 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <h3 className="text-xl font-bold text-white">Researching Your Company...</h3>
                                    <p className="text-white/50">AI is analyzing your online presence</p>
                                </div>
                            )}

                            {step === 'suggest' && (
                                <div className="p-8 space-y-6">
                                    <div className="text-center">
                                        <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                                        <h3 className="text-xl font-bold text-white">AI Enhanced Description</h3>
                                        <p className="text-white/50 text-sm">We found more about your company!</p>
                                    </div>

                                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                                        <p className="text-white/80 text-sm whitespace-pre-wrap">{aiSuggestion}</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => handleSubmit(false)} className="flex-1">
                                            Keep Mine
                                        </Button>
                                        <Button onClick={() => handleSubmit(true)} className="flex-1 gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Use AI Version
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'saving' && (
                                <div className="p-16 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <h3 className="text-xl font-bold text-white">Saving Profile...</h3>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

