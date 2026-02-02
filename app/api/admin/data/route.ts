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

// Lazy-loaded clients (created on first request, not at module load)
let supabaseAdmin: ReturnType<typeof createClient> | null = null
let supabase: ReturnType<typeof createClient> | null = null

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

function getSupabase() {
    if (!supabase) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            throw new Error("Missing Supabase configuration")
        }
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
    }
    return supabase
}

export async function GET(req: NextRequest) {
    try {
        // Get the auth token from cookies
        const authHeader = req.headers.get("authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace("Bearer ", "")

        // Verify the user
        const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        // Check if user is admin
        if (!ADMIN_EMAILS.includes((user.email || "").toLowerCase())) {
            return NextResponse.json({ error: "Access denied - not an admin" }, { status: 403 })
        }

        // Fetch ALL users using admin client (bypasses RLS)
        const adminClient = getSupabaseAdmin()
        const { data: users, error: usersError } = await adminClient
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })

        if (usersError) {
            console.error("[Admin API] Error fetching users:", usersError)
            return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
        }

        // Fetch ALL proposals using admin client
        const { data: proposals, error: proposalsError } = await adminClient
            .from("proposals")
            .select("*, profiles(company_name)")
            .order("created_at", { ascending: false })
            .limit(500)

        if (proposalsError) {
            console.error("[Admin API] Error fetching proposals:", proposalsError)
            return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 })
        }

        // Also get auth users count from Supabase auth
        const { data: authUsers } = await adminClient.auth.admin.listUsers()

        // Calculate stats
        const userCount = users?.length || 0
        const authUserCount = authUsers?.users?.length || 0
        const allProposals = proposals || []

        const stats = {
            userCount,
            authUserCount, // Total users in auth (may differ from profiles)
            proposalStats: {
                total: allProposals.length,
                completed: allProposals.filter((p: { status: string }) => p.status === "completed").length,
                failed: allProposals.filter((p: { status: string }) => p.status === "failed" || p.status === "error").length,
                queued: allProposals.filter((p: { status: string }) => p.status === "queued" || p.status === "processing").length,
            },
            creditStats: {
                total: users?.reduce((sum: number, u: { credits?: number }) => sum + (u.credits || 0), 0) || 0,
                used: users?.reduce((sum: number, u: { credits_used?: number }) => sum + (u.credits_used || 0), 0) || 0,
            }
        }

        return NextResponse.json({
            users: users || [],
            proposals: proposals || [],
            stats,
            authUsers: authUsers?.users?.map((u: { id: string; email?: string; created_at: string }) => ({
                id: u.id,
                email: u.email,
                created_at: u.created_at
            })) || []
        })

    } catch (error: unknown) {
        console.error("[Admin API] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
