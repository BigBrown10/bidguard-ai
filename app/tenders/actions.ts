"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Tender } from "@/lib/mock-tenders"

export async function saveTenderAction(tender: Tender, _userId: string) {
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized: No session found")
    }

    const { error } = await supabase.from('saved_tenders').insert({
        user_id: user.id, // Use the secure user value
        tender_data: tender,
        status: 'saved'
    })

    if (error) {
        console.error("Error saving tender:", error)
        throw new Error("Failed to save tender")
    }

    return { success: true }
}
