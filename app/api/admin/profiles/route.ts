import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Admin emails that can access this endpoint
const ADMIN_EMAILS = [
    "edogunosamudiamen@gmail.com",
    "brownhood10@gmail.com",
    "mudybrown10@gmail.com",
    "viralculture10@gmail.com",
    "admin@bidswipe.xyz",
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""
].filter(Boolean).map(e => e.toLowerCase())

// Lazy-loaded admin client
let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase admin configuration")
        }
        supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        )
    }
    return supabaseAdmin
}

// Verify admin token
function verifyAdminToken(authHeader: string | null): { valid: boolean; email?: string; error?: string } {
    if (!authHeader || !authHeader.startsWith("Admin ")) {
        return { valid: false, error: "Missing admin token" }
    }

    try {
        const token = authHeader.replace("Admin ", "")
        const data = JSON.parse(Buffer.from(token, "base64").toString())

        if (Date.now() > data.exp) {
            return { valid: false, error: "Token expired" }
        }

        if (!ADMIN_EMAILS.includes(data.email.toLowerCase())) {
            return { valid: false, error: "Not authorized" }
        }

        return { valid: true, email: data.email }
    } catch {
        return { valid: false, error: "Invalid token" }
    }
}

// Create a new profile for an auth user
export async function POST(req: NextRequest) {
    try {
        const auth = verifyAdminToken(req.headers.get("authorization"))
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error }, { status: 401 })
        }

        const { userId, email, credits = 50 } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }

        const adminClient = getSupabaseAdmin()

        // Create profile - use type assertion for untyped client
        const profileData = {
            id: userId,
            company_name: email?.split("@")[0] || "User",
            business_description: "",
            industry: "",
            credits: credits,
            credits_used: 0
        }

        const { error } = await (adminClient as any)
            .from("profiles")
            .insert(profileData)

        if (error) {
            console.error("[Admin Profiles] Create error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `Profile created with ${credits} credits` })

    } catch (error) {
        console.error("[Admin Profiles] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// Update a profile (adjust credits, etc.)
export async function PATCH(req: NextRequest) {
    try {
        const auth = verifyAdminToken(req.headers.get("authorization"))
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error }, { status: 401 })
        }

        const { userId, creditAdjustment } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }

        const adminClient = getSupabaseAdmin() as any

        // Get current credits
        const { data: profile, error: fetchError } = await adminClient
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single()

        if (fetchError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 })
        }

        const newCredits = Math.max(0, ((profile as any).credits || 0) + (creditAdjustment || 0))

        // Update credits
        const { error: updateError } = await adminClient
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userId)

        if (updateError) {
            console.error("[Admin Profiles] Update error:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, newCredits })

    } catch (error) {
        console.error("[Admin Profiles] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
