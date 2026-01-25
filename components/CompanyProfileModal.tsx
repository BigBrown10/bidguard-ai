"use client"

import * as React from "react"
import { X, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { CompanyProfileForm } from "./CompanyProfileForm"

interface CompanyProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete: () => void
}

export function CompanyProfileModal({ isOpen, onClose, onComplete }: CompanyProfileModalProps) {
    const [userId, setUserId] = React.useState<string | null>(null)
    const [initialData, setInitialData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (isOpen) {
            loadProfile()
        }
    }, [isOpen])

    const loadProfile = async () => {
        setLoading(true)
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUserId(user.id)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) setInitialData(profile)
        }
        setLoading(false)
    }

    if (!isOpen || !userId) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="relative w-full max-w-2xl bg-[#090909] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="shrink-0 border-b border-white/10 p-5 flex justify-between items-center bg-[#090909]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Company Profile
                        </h2>
                        <p className="text-white/50 text-xs mt-1">
                            Your intelligence unit's identity.
                        </p>
                    </div>
                    {/* Only show close button if gate is NOT forcing it open? 
                        Actually OnboardingGate suppresses the onClose callback or handles it.
                        Here we just provide the button, but if parent provides empty onClose, it won't do anything.
                    */}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-white/50">Loading...</div>
                    ) : (
                        <CompanyProfileForm
                            userId={userId}
                            initialData={initialData}
                            onComplete={onComplete}
                            isModal={true}
                        />
                    )}
                </div>

            </div>
        </div>
    )
}
