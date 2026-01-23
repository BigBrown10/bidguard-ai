"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, FileText, Globe, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"

interface CompanyDetailsGateProps {
    isOpen: boolean
    onComplete: () => void
}

export function CompanyDetailsGate({ isOpen, onComplete }: CompanyDetailsGateProps) {
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        company_name: "",
        business_description: "",
        website: "",
        sectors: [] as string[]
    })

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

    const handleSectorToggle = (sector: string) => {
        setFormData(prev => ({
            ...prev,
            sectors: prev.sectors.includes(sector)
                ? prev.sectors.filter(s => s !== sector)
                : [...prev.sectors, sector]
        }))
    }

    const handleSubmit = async () => {
        if (!formData.company_name.trim()) return

        setLoading(true)

        try {
            if (!supabase) {
                console.error("Supabase not configured")
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
                    business_description: formData.business_description.trim(),
                    website: formData.website.trim(),
                    sectors: formData.sectors,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            onComplete()
        } catch (error) {
            console.error("Failed to save company details:", error)
        } finally {
            setLoading(false)
        }
    }

    const isValid = formData.company_name.trim().length > 0

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - no close on click */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl px-4"
                    >
                        <div className="bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="p-8 pb-6 text-center border-b border-white/5">
                                <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
                                <p className="text-white/60 text-sm">
                                    We need your company details to generate tailored, winning proposals.
                                </p>
                            </div>

                            {/* Form */}
                            <div className="p-8 space-y-6">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Company Name *
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
                                        Website
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
                                        About Your Company
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

                                {/* Sectors */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-3">
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
                            <div className="p-8 pt-4 border-t border-white/5">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isValid || loading}
                                    className="w-full h-12"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Continue to Bid Intelligence
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
