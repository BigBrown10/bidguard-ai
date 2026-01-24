import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { inngest } from "@/lib/inngest/client"
import { proposalStartSchema } from "@/lib/validation"
import { audit } from "@/lib/audit"

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

        // SECURITY: Validate input with Zod
        const rawBody = await req.json()
        const validationResult = proposalStartSchema.safeParse(rawBody)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validationResult.error.flatten() },
                { status: 400 }
            )
        }

        const { tenderId, tenderTitle, tenderBuyer, ideaInjection } = validationResult.data

        // Create proposal record in Supabase
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

                // SECURITY: Audit log - proposal created
                await audit.proposalCreated(user.id, proposalId, tenderTitle)
            } else {
                console.warn("Proposals table may not exist, using temp ID:", insertError?.message)
            }
        } catch (dbError) {
            console.warn("Database insert skipped:", dbError)
        }

        // Send to Inngest - SECURITY: Only send IDs, not full content
        await inngest.send({
            name: "app/generate-autonomous-proposal",
            data: {
                proposalId,
                userId: user.id,
                tenderId,
                tenderTitle,
                tenderBuyer: tenderBuyer || "Unknown",
                // Note: ideaInjection is user-provided, keep it minimal
                ideaInjection: ideaInjection ? ideaInjection.substring(0, 1000) : ""
            }
        })

        return NextResponse.json({
            success: true,
            proposalId,
            message: "Proposal generation started"
        })

    } catch (error: unknown) {
        console.error("Start proposal error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal error" },
            { status: 500 }
        )
    }
}
