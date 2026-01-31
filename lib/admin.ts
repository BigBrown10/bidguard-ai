import { supabaseAdmin } from "@/lib/supabase-admin"

// Whitelist of admin emails - add your email here
const ADMIN_EMAILS = [
    "admin@bidswipe.xyz",
    // Add more admin emails as needed
    process.env.ADMIN_EMAIL || ""
].filter(Boolean)

/**
 * Check if an email is an admin
 */
export function isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Get all users with their profiles
 */
export async function getAllUsers() {
    if (!supabaseAdmin) {
        console.error("[Admin] supabaseAdmin not configured")
        return []
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("[Admin] Error fetching users:", error)
        return []
    }

    return data || []
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
    if (!supabaseAdmin) return 0

    const { count, error } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })

    if (error) {
        console.error("[Admin] Error counting users:", error)
        return 0
    }

    return count || 0
}

/**
 * Get all proposals with user info
 */
export async function getAllProposals() {
    if (!supabaseAdmin) {
        console.error("[Admin] supabaseAdmin not configured")
        return []
    }

    const { data, error } = await supabaseAdmin
        .from("proposals")
        .select("*, profiles(company_name)")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("[Admin] Error fetching proposals:", error)
        return []
    }

    return data || []
}

/**
 * Get proposal statistics
 */
export async function getProposalStats() {
    if (!supabaseAdmin) {
        return { total: 0, completed: 0, failed: 0, queued: 0 }
    }

    const { data, error } = await supabaseAdmin
        .from("proposals")
        .select("status")

    if (error) {
        console.error("[Admin] Error fetching proposal stats:", error)
        return { total: 0, completed: 0, failed: 0, queued: 0 }
    }

    const proposals = data || []
    return {
        total: proposals.length,
        completed: proposals.filter(p => p.status === "completed").length,
        failed: proposals.filter(p => p.status === "failed" || p.status === "error").length,
        queued: proposals.filter(p => p.status === "queued" || p.status === "processing").length,
    }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: string): Promise<boolean> {
    if (!supabaseAdmin) {
        console.error("[Admin] supabaseAdmin not configured")
        return false
    }

    // Delete profile first (cascade should handle related data)
    const { error } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId)

    if (error) {
        console.error("[Admin] Error deleting user:", error)
        return false
    }

    console.log("[Admin] Deleted user:", userId)
    return true
}

/**
 * Adjust credits for a user (admin only)
 */
export async function adjustCredits(userId: string, amount: number): Promise<boolean> {
    if (!supabaseAdmin) {
        console.error("[Admin] supabaseAdmin not configured")
        return false
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single()

    if (fetchError || !profile) {
        console.error("[Admin] Error fetching profile:", fetchError)
        return false
    }

    const currentCredits = profile.credits ?? 0
    const newCredits = Math.max(0, currentCredits + amount) // Never go below 0

    const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", userId)

    if (updateError) {
        console.error("[Admin] Error adjusting credits:", updateError)
        return false
    }

    console.log("[Admin] Adjusted credits for user:", userId, "New total:", newCredits)
    return true
}

/**
 * Get total credits across all users
 */
export async function getTotalCredits(): Promise<{ total: number, used: number }> {
    if (!supabaseAdmin) {
        return { total: 0, used: 0 }
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("credits, credits_used")

    if (error) {
        console.error("[Admin] Error fetching credits:", error)
        return { total: 0, used: 0 }
    }

    const profiles = data || []
    return {
        total: profiles.reduce((sum, p) => sum + (p.credits || 0), 0),
        used: profiles.reduce((sum, p) => sum + (p.credits_used || 0), 0),
    }
}
