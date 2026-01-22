"use server"

import { supabase } from "@/lib/supabase"
import { Tender } from "@/lib/mock-tenders"

export async function saveTenderAction(tender: Tender, userId: string) {
    if (!supabase) throw new Error("Supabase not initialized")

    const { error } = await supabase.from('saved_tenders').insert({
        user_id: userId,
        tender_data: tender, // Store the full object so we don't need to re-fetch
        status: 'saved'
    })

    if (error) {
        console.error("Error saving tender:", error)
        throw new Error("Failed to save tender")
    }

    return { success: true }
}
