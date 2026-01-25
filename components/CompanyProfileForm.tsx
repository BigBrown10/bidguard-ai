"use client"

import * as React from "react"
import { Building2, Globe, FileText, Award, Trophy, Fingerprint, Sparkles, Loader2, ArrowRight, Save } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface CompanyProfileFormProps {
    userId: string
    initialData?: any
    onComplete: () => void
    isModal?: boolean
}

const ISO_OPTIONS = [
    { id: 'iso9001', label: 'ISO 9001 (Quality)' },
    { id: 'iso27001', label: 'ISO 27001 (Security)' },
    { id: 'cyberessentials', label: 'Cyber Essentials' },
]

export function CompanyProfileForm({ userId, initialData, onComplete, isModal = false }: CompanyProfileFormProps) {
    const [loading, setLoading] = React.useState(false)
    const [step, setStep] = React.useState<'edit' | 'researching'>('edit')

    // Form State
    const [formData, setFormData] = React.useState({
        company_name: initialData?.company_name || '',
        website: initialData?.website || '',
        business_description: initialData?.business_description || '',
        iso_certs: initialData?.iso_certs || [] as string[],
        achievements: initialData?.achievements || '',
        companies_house_number: initialData?.companies_house_number || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!supabase) throw new Error("Supabase client not initialized")

            // Minimal validation
            if (!formData.company_name || !formData.business_description) {
                toast.error("Missing Info", { description: "Company Name and Description are required." })
                setLoading(false)
                return
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    ...formData,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error

            toast.success("Profile Saved", { description: "Your intelligence unit is ready." })
            onComplete()

        } catch (error) {
            console.error('Save failed:', error)
            toast.error("Save Failed", { description: "Please try again." })
        } finally {
            setLoading(false)
        }
    }

    const toggleIso = (id: string) => {
        setFormData(prev => ({
            ...prev,
            iso_certs: prev.iso_certs.includes(id)
                ? prev.iso_certs.filter((c: string) => c !== id)
                : [...prev.iso_certs, id]
        }))
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${isModal ? 'p-0' : 'p-6'}`}>

            {/* Company Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Company Name *</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-primary" />
                        <Input
                            value={formData.company_name}
                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                            className="pl-10 bg-black/50 border-white/10"
                            placeholder="Acme Corp"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Website</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <Input
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="pl-10 bg-black/50 border-white/10"
                            placeholder="https://acme.com"
                        />
                    </div>
                </div>
            </div>

            {/* Core Description */}
            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Business Description *</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-primary" />
                    <textarea
                        value={formData.business_description}
                        onChange={e => setFormData({ ...formData, business_description: e.target.value })}
                        className="w-full h-32 pl-10 pt-3 bg-black/50 border border-white/10 rounded-md text-sm text-white focus:border-primary/50 focus:outline-none resize-none"
                        placeholder="We specialize in..."
                        required
                    />
                </div>
                <p className="text-[10px] text-white/30 text-right">Used by AI to write relevant bids.</p>
            </div>

            {/* Certifications - Simplified */}
            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Certifications</label>
                <div className="flex flex-wrap gap-2">
                    {ISO_OPTIONS.map(iso => (
                        <button
                            key={iso.id}
                            type="button"
                            onClick={() => toggleIso(iso.id)}
                            className={`px-3 py-2 rounded-md text-xs font-medium border transition-all ${formData.iso_certs.includes(iso.id)
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-black/30 border-white/10 text-white/50 hover:border-white/30'
                                }`}
                        >
                            {iso.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Key Achievements</label>
                <div className="relative">
                    <Trophy className="absolute left-3 top-3 w-4 h-4 text-yellow-500" />
                    <textarea
                        value={formData.achievements}
                        onChange={e => setFormData({ ...formData, achievements: e.target.value })}
                        className="w-full h-20 pl-10 pt-3 bg-black/50 border border-white/10 rounded-md text-sm text-white focus:border-primary/50 focus:outline-none resize-none"
                        placeholder="e.g. Delivered £10M project for NHS..."
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                </Button>
            </div>

        </form>
    )
}
