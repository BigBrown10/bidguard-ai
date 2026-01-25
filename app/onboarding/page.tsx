"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Header } from "@/components/Header"

// ... imports

export default function OnboardingPage() {
    // ... logic ...

    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-y-auto">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
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
