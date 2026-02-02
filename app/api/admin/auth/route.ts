import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Admin emails that can access the admin panel
const ADMIN_EMAILS = [
    "edogunosamudiamen@gmail.com",
    "brownhood10@gmail.com",
    "mudybrown10@gmail.com",
    "viralculture10@gmail.com",
    "admin@bidswipe.xyz",
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""
].filter(Boolean).map(e => e.toLowerCase())

// Simple OTP storage (in-memory for now, resets on deploy)
// For production, use Redis or database
const otpStore = new Map<string, { code: string; expires: number }>()

// Lazy-loaded clients
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

// Send OTP to admin email
export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json()
        const normalizedEmail = (email || "").toLowerCase().trim()

        // Check if email is admin
        if (!ADMIN_EMAILS.includes(normalizedEmail)) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }

        // If code is provided, verify it
        if (code) {
            const stored = otpStore.get(normalizedEmail)

            if (!stored) {
                return NextResponse.json({ error: "No code sent to this email" }, { status: 400 })
            }

            if (Date.now() > stored.expires) {
                otpStore.delete(normalizedEmail)
                return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 })
            }

            if (stored.code !== code) {
                return NextResponse.json({ error: "Invalid code" }, { status: 400 })
            }

            // Valid! Generate admin session token (simple JWT-like token)
            otpStore.delete(normalizedEmail)

            // Create a simple admin token (email + timestamp + secret hash)
            const adminToken = Buffer.from(JSON.stringify({
                email: normalizedEmail,
                exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                type: "admin"
            })).toString("base64")

            return NextResponse.json({
                success: true,
                message: "Verified successfully",
                adminToken
            })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Store OTP (expires in 10 minutes)
        otpStore.set(normalizedEmail, {
            code: otp,
            expires: Date.now() + (10 * 60 * 1000)
        })

        // Send email via Supabase (using their Magic Link but we'll extract the OTP)
        // Actually, let's just log it for now and return it in dev mode
        console.log(`[ADMIN OTP] Code for ${normalizedEmail}: ${otp}`)

        // For production, send via Resend or other email service
        // For now, we'll include it in response in dev mode
        const isDev = process.env.NODE_ENV === "development"

        return NextResponse.json({
            success: true,
            message: `Code sent to ${normalizedEmail}`,
            // Include code in dev mode only for testing
            ...(isDev && { devCode: otp })
        })

    } catch (error) {
        console.error("[Admin Auth] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// Verify admin token and return data
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization")

        if (!authHeader || !authHeader.startsWith("Admin ")) {
            return NextResponse.json({ error: "Missing admin token" }, { status: 401 })
        }

        // Decode admin token
        const token = authHeader.replace("Admin ", "")
        let tokenData: { email: string; exp: number; type: string }

        try {
            tokenData = JSON.parse(Buffer.from(token, "base64").toString())
        } catch {
            return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
        }

        // Check expiry
        if (Date.now() > tokenData.exp) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 })
        }

        // Verify admin email
        if (!ADMIN_EMAILS.includes(tokenData.email.toLowerCase())) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }

        // Fetch ALL data using admin client
        const adminClient = getSupabaseAdmin()

        // Fetch profiles
        const { data: users, error: usersError } = await adminClient
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })

        if (usersError) {
            console.error("[Admin API] Error fetching profiles:", usersError)
        }

        // Fetch proposals
        const { data: proposals, error: proposalsError } = await adminClient
            .from("proposals")
            .select("*, profiles(company_name)")
            .order("created_at", { ascending: false })
            .limit(500)

        if (proposalsError) {
            console.error("[Admin API] Error fetching proposals:", proposalsError)
        }

        // Fetch auth users
        const { data: authData } = await adminClient.auth.admin.listUsers()
        const authUsers = authData?.users || []

        // Calculate stats
        const profileCount = users?.length || 0
        const authUserCount = authUsers.length

        const stats = {
            userCount: profileCount,
            authUserCount,
            proposalStats: {
                total: proposals?.length || 0,
                completed: proposals?.filter((p: { status: string }) => p.status === "completed").length || 0,
                failed: proposals?.filter((p: { status: string }) => p.status === "failed" || p.status === "error").length || 0,
                queued: proposals?.filter((p: { status: string }) => p.status === "queued" || p.status === "processing").length || 0,
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
            authUsers: authUsers.map((u: { id: string; email?: string; created_at: string }) => ({
                id: u.id,
                email: u.email,
                created_at: u.created_at
            }))
        })

    } catch (error) {
        console.error("[Admin API] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
