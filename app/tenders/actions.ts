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
    console.log("[TENDERS ACTION] Fetching tenders from cache...")
    let tenders: Tender[] = []

    // 1. Fetch from Supabase cache (or fallback to live API internally)
    const cachedData = await getCachedTenders()
    if (cachedData && cachedData.length > 0) {
        tenders = cachedData
        console.log(`[TENDERS ACTION] Got ${tenders.length} tenders from cache`)
    } else {
        console.log("[TENDERS ACTION] Cache empty, using Mock Data")
        const { MOCK_TENDERS } = await import("@/lib/mock-tenders")
        tenders = MOCK_TENDERS
    }

    // 2. Filter out "Handled" tenders (Saved or Discarded)
    // We need the user session to know what to filter
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

        if (user) {
            // Get IDs of tenders this user has touched
            // Note: We are storing the whole tender object in 'tender_data', so we check against ID inside JSON
            // Or simpler: The schema doesn't have a 'tender_id' column, it has 'tender_data' JSONB.
            // We can query: select tender_data->>'id' from saved_tenders where user_id = ...
            const { data: handledTenders } = await supabase
                .from('saved_tenders')
                .select('tender_data')
                .eq('user_id', user.id)

            if (handledTenders && handledTenders.length > 0) {
                const handledIds = new Set(handledTenders.map((row: any) => row.tender_data.id))
                // Filter the list
                tenders = tenders.filter(t => !handledIds.has(t.id))
            }
        }
    } catch (err) {
        console.warn("Could not filter tenders (Auth/DB error):", err)
    }

    return tenders
}
