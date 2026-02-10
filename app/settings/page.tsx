"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2, User, Mail, Building2, Trash2, LogOut, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { CompanyProfileForm } from "@/components/CompanyProfileForm"

import { Header } from "@/components/Header"

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = React.useState<any>(null)
    const [profile, setProfile] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [deleting, setDeleting] = React.useState(false)

    React.useEffect(() => {
        const loadUser = async () => {
            if (!supabase) {
                setLoading(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                if (profileData) setProfile(profileData)
            }
            setLoading(false)
        }
        loadUser()
    }, [])

    const handleLogout = async () => {
        if (!supabase) return
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleDeleteAccount = async () => {
        if (!supabase || !user) return

        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone. All your data (saved tenders, proposals, profile) will be permanently deleted."
        )

        if (!confirmed) return

        setDeleting(true)

        try {
            // Delete user data from tables (Optional if cascade is set up, but safe to keep)
            await supabase.from('saved_tenders').delete().eq('user_id', user.id)
            await supabase.from('profiles').delete().eq('id', user.id)

            // Server Action to delete Auth User
            const { deleteUserAccount } = await import('@/app/auth/actions')
            const result = await deleteUserAccount(user.id)

            if (result && result.error) {
                throw new Error(result.error)
            }

            await supabase.auth.signOut()

            alert("Your account has been permanently deleted.")
            router.push('/')
        } catch (error) {
            console.error("Delete account error:", error)
            alert("Failed to delete account completely. Please contact support.")
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8 pb-8">
                        <p className="text-white/50 mb-6">You need to be logged in to access settings.</p>
                        <Link href="/login">
                            <Button>Sign In</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">

                <div className="mb-8">
                    <Link href="/favourites" className="text-white/50 hover:text-white text-sm flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Account Settings</h1>
                    <p className="text-white/50 mt-2">Manage your account and preferences</p>
                </div>

                <div className="space-y-6">

                    {/* Profile Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" /> Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider">Account Email</label>
                                    <p className="text-white flex items-center gap-2 mt-1 font-mono">
                                        <Mail className="w-4 h-4 text-primary" />
                                        {user.email}
                                    </p>
                                </div>
                                <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                    Authenticated
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-sm font-bold text-white mb-4">Company Intelligence</h3>
                                <CompanyProfileForm
                                    userId={user.id}
                                    initialData={profile}
                                    onComplete={() => {
                                        router.refresh()
                                        // Optional: Reload local state
                                        const loadUser = async () => {
                                            if (!supabase) return
                                            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                                            if (data) setProfile(data)
                                        }
                                        loadUser()
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Model Preference */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" /> AI Model Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-white/60 text-sm">
                                Select the underlying AI model used for generating your proposals.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Gemini 3 (Flash) */}
                                <div
                                    onClick={async () => {
                                        if (!supabase) return;
                                        setLoading(true); // Re-use loading or add specific state
                                        await supabase.from('profiles').update({ ai_model: 'gemini-flash' }).eq('id', user.id);
                                        setProfile({ ...profile, ai_model: 'gemini-flash' });
                                        setLoading(false);
                                    }}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all ${profile?.ai_model === 'gemini-flash' ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white">Gemini 3.0 Flash</h4>
                                        {profile?.ai_model === 'gemini-flash' && <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]" />}
                                    </div>
                                    <p className="text-xs text-white/50 mb-3">Google's latest high-speed reasoning model. Recommended for fast, accurate generation.</p>
                                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/70">DEFAULT</span>
                                </div>

                                {/* Perplexity (Legacy) */}
                                <div
                                    onClick={async () => {
                                        if (!supabase) return;
                                        setLoading(true);
                                        await supabase.from('profiles').update({ ai_model: 'perplexity' }).eq('id', user.id);
                                        setProfile({ ...profile, ai_model: 'perplexity' });
                                        setLoading(false);
                                    }}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all ${profile?.ai_model === 'perplexity' ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white">Perplexity Sonar</h4>
                                        {profile?.ai_model === 'perplexity' && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]" />}
                                    </div>
                                    <p className="text-xs text-white/50 mb-3">Legacy model with real-time web search capabilities.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <LogOut className="w-5 h-5" /> Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-white/60 text-sm mb-4">
                                Sign out of your account on this device.
                            </p>
                            <Button variant="outline" onClick={handleLogout}>
                                Sign Out
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-red-500/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                                <Trash2 className="w-5 h-5" /> Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-white/60 text-sm mb-4">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
