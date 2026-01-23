import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { inngest } from "@/lib/inngest/client"

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch { }
                    },
                },
            }
        )

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { tenderId, tenderTitle, tenderBuyer, ideaInjection } = await req.json()

        if (!tenderId || !tenderTitle) {
            return NextResponse.json({ error: "Missing tender data" }, { status: 400 })
        }

        // Create proposal record in Supabase (if table exists)
        let proposalId = `temp-${Date.now()}`

        try {
            const { data: proposal, error: insertError } = await supabase
                .from('proposals')
                .insert({
                    user_id: user.id,
                    tender_id: tenderId,
                    tender_title: tenderTitle,
                    tender_buyer: tenderBuyer || "Unknown",
                    idea_injection: ideaInjection || null,
                    status: 'queued'
                })
                .select('id')
                .single()

            if (!insertError && proposal) {
                proposalId = proposal.id
            } else {
                console.warn("Proposals table may not exist, using temp ID:", insertError?.message)
            }
        } catch (dbError) {
            console.warn("Database insert skipped:", dbError)
        }

        // Send to Inngest for background processing
        await inngest.send({
            name: "app/generate-autonomous-proposal",
            data: {
                proposalId,
                userId: user.id,
                tenderId,
                tenderTitle,
                tenderBuyer,
                ideaInjection: ideaInjection || ""
            }
        })

        return NextResponse.json({
            success: true,
            proposalId,
            message: "Proposal generation started"
        })

    } catch (error: any) {
        console.error("Start proposal error:", error)
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        )
    }
}
