"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CompanyProfileModal } from "@/components/CompanyProfileModal"
import { usePathname } from "next/navigation"

export function OnboardingGate({ children }: { children: React.ReactNode }) {
    const [showGate, setShowGate] = useState(false)
    const [loading, setLoading] = useState(true)
    const pathname = usePathname()

    useEffect(() => {
        const checkProfile = async () => {
            // Skip checking on auth pages to avoid loops
            if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/auth') || pathname === '/') {
                setLoading(false)
                return
            }

            if (!supabase) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_complete')
                    .eq('id', user.id)
                    .single()

                if (!profile || !profile.onboarding_complete) {
                    setShowGate(true)
                }
            } catch (e) {
                console.error("Gate check failed", e)
            } finally {
                setLoading(false)
            }
        }

        checkProfile()
    }, [pathname])

    // If strictly gating, we might want to hide children while loading, 
    // but that causes flicker. Let's just show the modal over content.

    return (
        <>
            {children}

            <CompanyProfileModal
                isOpen={showGate}
                onClose={() => {
                    // Blocking: Do not allow close if gate is active
                    // Unless we are on a safe page? No, strict rule.
                }}
                onComplete={() => {
                    setShowGate(false)
                    // Refresh or redirect?
                    window.location.reload()
                }}
            />
        </>
    )
}
