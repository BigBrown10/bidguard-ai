"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Building2, Globe, FileText, ArrowRight, Loader2, Sparkles, Trophy, Fingerprint } from 'lucide-react'

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Form State
    const [companyName, setCompanyName] = useState('')
    const [website, setWebsite] = useState('')
    const [description, setDescription] = useState('')
    const [achievements, setAchievements] = useState('')
    const [marketIntel, setMarketIntel] = useState('')

    useEffect(() => {
        // Check if user is logged in & Load Data
        const checkUser = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
                loadProfile(user.id)
            }
        }
        checkUser()
    }, [])

    const loadProfile = async (userId: string) => {
        if (!supabase) return
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) {
            setCompanyName(data.company_name || '')
            setWebsite(data.website || '')
            setDescription(data.business_description || '')
            // Note: Schema update might be needed for achievements/intel if not present, 
            // but we can store them in description for now or assume schema extension.
            // For now, I'll assume they will be part of the profile or I'll append to description if schema strictly defined.
            // Wait, I should stick to the requested UX. 
            // I'll add them to state, and save them. If columns don't exist, I might need to migrate schema.
            // Let's check schema.sql? actually I will just add them to the upsert and let Supabase handle if columns exist, 
            // OR simpler: append them to the 'business_description' internally effectively if I can't migrate DB easily.
            // Re-reading user request: "register form... tell them to add achivements etc".
            // I'll treat them as separate UI fields but maybe concatenate for the AI context if I can't migrate.
            // Actually, best to just save them. I'll check schema later. For now, UI first.
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            if (!supabase) throw new Error("Supabase client not initialized")

            // Combine description with extra intel if no specific columns
            const fullDescription = `
${description}

KEY ACHIEVEMENTS:
${achievements}

MARKET INTELLIGENCE:
${marketIntel}
            `.trim()

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    company_name: companyName,
                    website: website,
                    business_description: fullDescription,
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error

            // Success - routing
            router.push('/tenders') // Route to tenders as per flow? or ingest? User said "needed to feed the form"
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to save profile. Please check console.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-black uppercase text-white mb-2 tracking-tighter">
                        Company <span className="text-primary text-glow">Intelligence</span>
                    </h1>
                    <p className="text-white/60 text-lg">
                        Configure your neural profile for automated bidding.
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="glass-panel p-8 md:p-10 space-y-8"
                >
                    {/* Basic Info Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                Organization Name
                            </label>
                            <input
                                type="text"
                                required
                                className="cyber-input w-full p-4 font-bold"
                                placeholder="e.g. Arasaka Corp"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" />
                                Website
                            </label>
                            <input
                                type="url"
                                className="cyber-input w-full p-4"
                                placeholder="https://..."
                                value={website}
                                onChange={e => setWebsite(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Core Capabilities
                        </label>
                        <p className="text-xs text-white/40 mb-2">
                            What are your key services and strengths?
                        </p>
                        <textarea
                            required
                            rows={4}
                            className="cyber-input w-full p-4 leading-relaxed resize-none"
                            placeholder="We specialize in..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Achievements */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-secondary" />
                            Key Achievements
                        </label>
                        <p className="text-xs text-white/40 mb-2">
                            List major wins, certifications, or awards that build credibility.
                        </p>
                        <textarea
                            rows={3}
                            className="cyber-input w-full p-4 leading-relaxed resize-none"
                            placeholder="- ISO 27001 Certified&#10;- Delivered £5M project for NHS&#10;- Winner of Tech Excellence Award"
                            value={achievements}
                            onChange={e => setAchievements(e.target.value)}
                        />
                    </div>

                    {/* Market Intel (Insider) */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-accent" />
                            Market Intelligence (Optional)
                        </label>
                        <p className="text-xs text-white/40 mb-2">
                            Any inside knowledge? Competitor weaknesses? Specific angles to exploit?
                        </p>
                        <textarea
                            rows={3}
                            className="cyber-input w-full p-4 leading-relaxed resize-none border-accent/20 focus:border-accent"
                            placeholder="Competitor X is weak on security compliance..."
                            value={marketIntel}
                            onChange={e => setMarketIntel(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-1/3 cyber-button bg-transparent border border-white/10 hover:bg-white/5 h-16 text-sm uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-2/3 cyber-button h-16 text-xl flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Save Profile
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                </motion.form>
            </div>
        </div>
    )
}
