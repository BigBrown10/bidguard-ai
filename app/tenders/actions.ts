"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Tender } from "@/lib/mock-tenders"

export type ActionResponse = {
    success: boolean
    error?: string
}

export async function saveTenderAction(tender: Tender, _userId: string): Promise<ActionResponse> {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        // Get the User from the session (secure source of truth)
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error("Auth Error in Action:", userError)
            return { success: false, error: "Unauthorized: Invalid session" }
        }

        // Check for duplicate before saving
        const { data: existing } = await supabase
            .from('saved_tenders')
            .select('id')
            .eq('user_id', user.id)
            .filter('tender_data->>id', 'eq', tender.id)
            .maybeSingle()

        if (existing) {
            console.log("Tender already saved, skipping duplicate")
            return { success: true } // Silent success - already saved
        }

        const { error } = await supabase.from('saved_tenders').insert({
            user_id: user.id,
            tender_data: tender,
            status: 'saved'
        })

        if (error) {
            console.error("Supabase Insert Error:", error)
            return { success: false, error: `Database Error: ${error.message}` }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Save Action Unexpected Error:", error)
        return { success: false, error: error.message || "Unknown server error" }
    }
}

// NEW: Reject (Discard) Tender Action
export async function rejectTenderAction(tender: Tender, _userId: string): Promise<ActionResponse> {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }

        // Save as 'discarded'
        const { error } = await supabase.from('saved_tenders').insert({
            user_id: user.id,
            tender_data: tender, // We store the data so we can recreate history if needed
            status: 'discarded'
        })
        if (error) console.error("Reject Insert Error:", error) // log but don't fail hard

        return { success: true }
    } catch (e) {
        return { success: false, error: "Server Error" }
    }
}

import { getCachedTenders } from "@/lib/gov-api"

export async function fetchTendersAction(): Promise<Tender[]> {
    console.log("[TENDERS ACTION] Fetching tenders...")

    // 1. Parallelize Initial Fetches: Cache + Auth
    // getCachedTenders is now cached via unstable_cache, so it's fast
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookies().then(c => c.getAll()) // Async cookies access fix
                },
                setAll(cookiesToSet) {
                    try {
                        cookies().then(c => {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                c.set(name, value, options)
                            )
                        })
                    } catch { }
                }
            }
        }
    )

    const [tenders, authResult] = await Promise.all([
        getCachedTenders().then(data => data && data.length > 0 ? data : import("@/lib/mock-tenders").then(m => m.MOCK_TENDERS)),
        supabase.auth.getUser()
    ])

    const user = authResult.data.user
    let finalTenders = tenders

    // 2. If User Exists, Parallelize Profile & Saved Tenders Fetches
    if (user) {
        try {
            const [handledResult, profileResult] = await Promise.all([
                supabase.from('saved_tenders').select('tender_data').eq('user_id', user.id),
                supabase.from('profiles').select('sectors, business_description').eq('id', user.id).single()
            ])

            // Filter Handled
            if (handledResult.data && handledResult.data.length > 0) {
                const handledIds = new Set(handledResult.data.map((row: any) => row.tender_data.id))
                finalTenders = finalTenders.filter((t: Tender) => !handledIds.has(t.id))
            }

            // Personalize (Score)
            if (profileResult.data) {
                const profile = profileResult.data
                const userSectors = (profile.sectors || []).map((s: string) => s.toLowerCase())
                const descriptionKeywords = (profile.business_description || '')
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((w: string) => w.length > 4)

                const scoredTenders = finalTenders.map((tender: Tender) => {
                    let score = 0
                    const tenderSector = tender.sector?.toLowerCase() || ''
                    const tenderDesc = tender.description?.toLowerCase() || ''
                    const tenderTitle = tender.title?.toLowerCase() || ''

                    if (userSectors.some((s: string) => tenderSector.includes(s) || s.includes(tenderSector))) {
                        score += 50
                    }

                    descriptionKeywords.forEach((kw: string) => {
                        if (tenderDesc.includes(kw) || tenderTitle.includes(kw)) {
                            score += 5
                        }
                    })

                    return { ...tender, _score: score }
                })

                scoredTenders.sort((a: any, b: any) => (b._score || 0) - (a._score || 0))
                finalTenders = scoredTenders.map(({ _score, ...rest }: any) => rest as Tender)
                console.log(`[TENDERS ACTION] Personalized ${finalTenders.length} tenders for user`)
            }
        } catch (err) {
            console.warn("Personalization failed:", err)
        }
    }

    return finalTenders
}
