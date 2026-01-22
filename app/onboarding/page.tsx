"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Building2, Globe, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react'

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Form State
    const [companyName, setCompanyName] = useState('')
    const [website, setWebsite] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
            }
        }
        checkUser()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            if (!supabase) throw new Error("Supabase client not initialized")
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    company_name: companyName,
                    website: website,
                    business_description: description,
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error

            // Success - routing to dashboard
            router.push('/ingest')
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

            <div className="w-full max-w-2xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-xs uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3" />
                        System Initialization
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase text-white mb-2 tracking-tighter">
                        Identify <span className="text-primary text-glow">Protocol</span>
                    </h1>
                    <p className="text-white/60 text-lg">
                        Train the neural engine on your business DNA.
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="glass-panel p-8 md:p-10 space-y-8"
                >
                    {/* Company Name */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            Agency / Organization Name
                        </label>
                        <input
                            type="text"
                            required
                            className="cyber-input w-full p-4 text-lg font-bold"
                            placeholder="e.g. Arasaka Corp"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                        />
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            Digital Presence (Website)
                        </label>
                        <input
                            type="url"
                            className="cyber-input w-full p-4 text-white/80"
                            placeholder="https://..."
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/70 tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Operational Capabilities (Description)
                        </label>
                        <p className="text-xs text-white/40 mb-2">
                            Describe what you do, your key services, and your unique selling points. The AI will use this context to write winning bids.
                        </p>
                        <textarea
                            required
                            rows={6}
                            className="cyber-input w-full p-4 text-white/80 leading-relaxed resize-none"
                            placeholder="We are a cybersecurity consultancy specializing in..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={loading}
                            className="w-full cyber-button h-16 text-xl flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Upload Neural Profile
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-white/30 mt-4 uppercase tracking-widest">
                            Encrypted via Supabase Row-Level Security
                        </p>
                    </div>

                </motion.form>
            </div>
        </div>
    )
}
