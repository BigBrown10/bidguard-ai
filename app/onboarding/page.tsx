"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { CompanyProfileForm } from '@/components/CompanyProfileForm'
import { Toaster } from 'sonner'

export default function OnboardingPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        const checkUser = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
                // Load existing data if any
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (data) setProfile(data)
            }
        }
        checkUser()
    }, [])

    if (!user) return null

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-y-auto">
            <Toaster theme="dark" position="top-center" />

            {/* Reduced blur for mobile performance */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-black uppercase text-white mb-2 tracking-tighter">
                        Company <span className="text-primary">Profile</span>
                    </h1>
                    <p className="text-white/60 text-sm md:text-base">
                        Configure your commercial identity.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel border-white/10"
                >
                    <CompanyProfileForm
                        userId={user.id}
                        initialData={profile}
                        onComplete={() => router.push('/tenders')}
                    />
                </motion.div>
            </div>
        </div>
    )
}
