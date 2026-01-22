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

        const { error } = await supabase.from('saved_tenders').insert({
            user_id: user.id, // Use the secure user value
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
