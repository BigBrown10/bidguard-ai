"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Building2,
    Stethoscope,
    Truck,
    Shield,
    GraduationCap,
    Landmark,
    Leaf,
    Cpu,
    ArrowRight,
    Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const INDUSTRIES = [
    { id: "healthcare", label: "Healthcare & NHS", icon: Stethoscope, color: "bg-red-500/10 border-red-500/30 hover:border-red-500" },
    { id: "supply_chain", label: "Supply Chain & Logistics", icon: Truck, color: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500" },
    { id: "construction", label: "Construction & Built Environment", icon: Building2, color: "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500" },
    { id: "defence", label: "Defence & Security", icon: Shield, color: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500" },
    { id: "education", label: "Education & SEND", icon: GraduationCap, color: "bg-purple-500/10 border-purple-500/30 hover:border-purple-500" },
    { id: "government", label: "Central Government", icon: Landmark, color: "bg-gray-500/10 border-gray-500/30 hover:border-gray-500" },
    { id: "sustainability", label: "Sustainability & Net Zero", icon: Leaf, color: "bg-green-500/10 border-green-500/30 hover:border-green-500" },
    { id: "technology", label: "Technology & Digital", icon: Cpu, color: "bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500" },
]

export default function IndustryPage() {
    const router = useRouter()
    const [selectedIndustries, setSelectedIndustries] = React.useState<string[]>([])
    const [loading, setLoading] = React.useState(false)

    const toggleIndustry = (id: string) => {
        setSelectedIndustries(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    const handleContinue = async () => {
        if (selectedIndustries.length === 0) return
        setLoading(true)

        // Save to profile if logged in
        try {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await supabase.from('profiles').update({
                        industries: selectedIndustries,
                        updated_at: new Date().toISOString()
                    }).eq('id', user.id)
                }
            }
        } catch (err) {
            console.error("Failed to save industries:", err)
        }

        // Store locally for marketplace filtering
        localStorage.setItem("bidguard_industries", JSON.stringify(selectedIndustries))

        // Navigate to marketplace with filter
        router.push("/tenders")
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
                        Your <span className="text-primary text-glow">Industry</span>
                    </h1>
                    <p className="text-white/50 text-sm md:text-base max-w-md mx-auto">
                        Select your sectors to receive tailored bid recommendations from the UK Government marketplace.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
                >
                    {INDUSTRIES.map((industry, index) => {
                        const Icon = industry.icon
                        const isSelected = selectedIndustries.includes(industry.id)

                        return (
                            <motion.button
                                key={industry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                onClick={() => toggleIndustry(industry.id)}
                                className={`
                                    p-4 md:p-6 rounded-2xl border-2 transition-all duration-300
                                    flex flex-col items-center gap-3 text-center
                                    ${industry.color}
                                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black scale-105' : 'opacity-70 hover:opacity-100'}
                                `}
                            >
                                <Icon className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-white/60'}`} />
                                <span className={`text-xs md:text-sm font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                    {industry.label}
                                </span>
                            </motion.button>
                        )
                    })}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: selectedIndustries.length > 0 ? 1 : 0.3 }}
                    className="flex flex-col items-center gap-3"
                >
                    <button
                        onClick={handleContinue}
                        disabled={selectedIndustries.length === 0 || loading}
                        className="cyber-button w-full md:w-auto flex items-center justify-center gap-3 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Continue to Marketplace
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    <p className="text-white/30 text-xs">
                        {selectedIndustries.length} sector{selectedIndustries.length !== 1 ? 's' : ''} selected
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
