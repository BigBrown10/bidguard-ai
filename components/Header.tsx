"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { LogOut, User as UserIcon, Settings, LayoutDashboard, Menu, X, CreditCard } from "lucide-react"

export function Header() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [credits, setCredits] = useState<number | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        if (!supabase) return

        const client = supabase // Capture in local const for type narrowing

        const checkUser = async () => {
            const { data: { user } } = await client.auth.getUser()
            setUser(user)

            // Fetch credits if user is logged in
            if (user) {
                const { data: profile } = await client
                    .from("profiles")
                    .select("credits")
                    .eq("id", user.id)
                    .single()
                setCredits(profile?.credits ?? 3)
            }
        }
        checkUser()

        // Subscribe to auth changes
        const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                const { data: profile } = await client
                    .from("profiles")
                    .select("credits")
                    .eq("id", session.user.id)
                    .single()
                setCredits(profile?.credits ?? 3)
            } else {
                setCredits(null)
            }
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

                <div className="flex items-center gap-4">
                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
                        <Link href="/tenders" className="transition-colors hover:text-primary hover:text-glow">
                            Live Tenders
                        </Link>
                        {user && (
                            <>
                                <Link href="/favourites" className="transition-colors hover:text-white hover:text-glow">
                                    My Tenders
                                </Link>
                                <Link href="/dashboard" className="transition-colors hover:text-white hover:text-glow">
                                    Dashboard
                                </Link>

                                <Link href="/rate-proposal" className="transition-colors hover:text-yellow-400 hover:text-glow">
                                    Audit Tool
                                </Link>
                                <Link href="/newbid" className="text-primary font-bold hover:text-glow transition-colors">
                                    + New Bid
                                </Link>
                                <Link href="/pricing" className="transition-colors hover:text-white hover:text-glow">
                                    Pricing
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-white/70 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="relative">
                                {/* User Button (keeping existing logic) */}
                                <button
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full pr-3 transition-colors border border-transparent hover:border-white/10"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs ring-2 ring-black">
                                        {user.email?.[0].toUpperCase() || "U"}
                                    </div>
                                    <span className="text-sm text-white/80 hidden sm:block">
                                        {user.user_metadata?.first_name || ""}
                                    </span>
                                </button>

                                {/* User Dropdown */}
                                {menuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                        <div className="absolute right-0 top-12 w-56 bg-black/90 border border-white/10 rounded-lg shadow-xl backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-4 py-3 border-b border-white/10 mb-2">
                                                <p className="text-sm text-white font-medium truncate">{user.email}</p>
                                                <p className="text-xs text-white/50">Verified Operative</p>
                                            </div>

                                            {/* Credits Display */}
                                            <Link
                                                href="/pricing"
                                                className="flex items-center justify-between px-4 py-2 mx-2 mb-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-primary" />
                                                    <span className="text-sm text-white/80">Credits</span>
                                                </div>
                                                <span className={`text-lg font-bold ${credits === 0 ? 'text-red-400' : 'text-primary'}`}>
                                                    {credits ?? '...'}
                                                </span>
                                            </Link>

                                            <Link
                                                href="/onboarding"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <UserIcon className="w-4 h-4" /> Company Profile
                                            </Link>
                                            <Link
                                                href="/favourites"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <span className="text-lg leading-none">♥</span> My Tenders
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
                            <div className="hidden md:flex items-center gap-4">
                                <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                                    Login
                                </Link>
                                <Link href="/register" className="cyber-button px-4 py-2 text-sm">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-2">
                        <Link href="/tenders" onClick={() => setMobileMenuOpen(false)} className="py-2 text-white/70 hover:text-primary">
                            Live Tenders
                        </Link>
                        {user ? (
                            <>
                                <Link href="/favourites" onClick={() => setMobileMenuOpen(false)} className="py-2 text-white/70 hover:text-white">
                                    My Tenders
                                </Link>
                                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2 text-white/70 hover:text-white">
                                    Dashboard
                                </Link>
                                <Link href="/rate-proposal" onClick={() => setMobileMenuOpen(false)} className="py-2 text-white/70 hover:text-yellow-400">
                                    Audit Tool
                                </Link>
                                <Link href="/newbid" onClick={() => setMobileMenuOpen(false)} className="py-2 text-primary font-bold">
                                    + New Bid
                                </Link>
                                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-white/70 hover:text-white">
                                    Pricing
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-white/70">
                                    Login
                                </Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="py-2 text-primary">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}
