import { supabaseAdmin } from "@/lib/supabase-admin"

export interface CreditStatus {
    remaining: number
    used: number
    hasCredits: boolean
}

/**
 * Check if a user has credits remaining
 */
export async function checkCredits(userId: string): Promise<boolean> {
    if (!supabaseAdmin) {
        console.error("[Credits] supabaseAdmin not configured")
        return true // Fail open if not configured (dev mode)
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single()

    if (error || !data) {
        console.error("[Credits] Error checking credits:", error)
        return true // Fail open on error
    }

    return (data.credits ?? 3) > 0
}

/**
 * Get the full credit status for a user
 */
export async function getCreditStatus(userId: string): Promise<CreditStatus> {
    if (!supabaseAdmin) {
        return { remaining: 3, used: 0, hasCredits: true }
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("credits, credits_used")
        .eq("id", userId)
        .single()

    if (error || !data) {
        console.error("[Credits] Error getting credit status:", error)
        return { remaining: 3, used: 0, hasCredits: true }
    }

    const remaining = data.credits ?? 3
    const used = data.credits_used ?? 0

    return {
        remaining,
        used,
        hasCredits: remaining > 0
    }
}

/**
 * Use one credit for a user (decrements credits, increments credits_used)
 * Returns true if successful, false if no credits or error
 */
export async function useCredit(userId: string): Promise<boolean> {
    if (!supabaseAdmin) {
        console.warn("[Credits] supabaseAdmin not configured, skipping credit usage")
        return true
    }

    // First check if user has credits
    const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("credits, credits_used")
        .eq("id", userId)
        .single()

    if (fetchError || !profile) {
        console.error("[Credits] Error fetching profile:", fetchError)
        return false
    }

    const currentCredits = profile.credits ?? 3
    if (currentCredits <= 0) {
        console.log("[Credits] User has no credits remaining:", userId)
        return false
    }

    // Decrement credits
    const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
            credits: currentCredits - 1,
            credits_used: (profile.credits_used ?? 0) + 1
        })
        .eq("id", userId)

    if (updateError) {
        console.error("[Credits] Error using credit:", updateError)
        return false
    }

    console.log("[Credits] Used 1 credit for user:", userId, "Remaining:", currentCredits - 1)
    return true
}

/**
 * Add credits to a user account (admin function)
 */
export async function addCredits(userId: string, amount: number): Promise<boolean> {
    if (!supabaseAdmin) {
        console.error("[Credits] supabaseAdmin not configured")
        return false
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single()

    if (fetchError || !profile) {
        console.error("[Credits] Error fetching profile for credit add:", fetchError)
        return false
    }

    const currentCredits = profile.credits ?? 0

    const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: currentCredits + amount })
        .eq("id", userId)

    if (updateError) {
        console.error("[Credits] Error adding credits:", updateError)
        return false
    }

    console.log("[Credits] Added", amount, "credits to user:", userId, "New total:", currentCredits + amount)
    return true
}
