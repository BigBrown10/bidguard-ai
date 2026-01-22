"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { LogOut, User as UserIcon, Settings, LayoutDashboard } from "lucide-react"

export function Header() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        if (!supabase) return

        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        if (!supabase) return
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <img
                        src="/logo-b.png"
                        alt="B"
                        className="h-10 w-auto object-contain mix-blend-screen hover:brightness-125 transition-all"
                    />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
                    <Link href="/tenders" className="transition-colors hover:text-primary hover:text-glow">
                        Live Tenders
                    </Link>
                    {user && (
                        <>
                            <Link href="/dashboard" className="transition-colors hover:text-white hover:text-glow">
                                Dashboard
                            </Link>
                            <Link href="/history" className="transition-colors hover:text-white hover:text-glow">
                                Win History
                            </Link>
                        </>
                    )}
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full pr-3 transition-colors border border-transparent hover:border-white/10"
                            >
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs ring-2 ring-black">
                                    {user.email?.[0].toUpperCase() || "U"}
                                </div>
                                <span className="text-sm text-white/80 hidden sm:block">
                                    {user.user_metadata?.first_name || "Agent"}
                                </span>
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-12 w-56 bg-black/90 border border-white/10 rounded-lg shadow-xl backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-white/10 mb-2">
                                            <p className="text-sm text-white font-medium truncate">{user.email}</p>
                                            <p className="text-xs text-white/50">Verified Operative</p>
                                        </div>

                                        <Link
                                            href="/onboarding" // Using onboarding as profile edit for now
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <UserIcon className="w-4 h-4" /> Company Profile
                                        </Link>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" /> Settings
                                        </Link>

                                        <div className="border-t border-white/10 my-2" />

                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link href="/login" className="cyber-button px-4 py-2 text-sm">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
