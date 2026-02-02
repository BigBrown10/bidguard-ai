import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

// Lazy-load Stripe to avoid initialization errors during build
let stripe: Stripe | null = null

function getStripe(): Stripe {
    if (!stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not configured")
        }
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2026-01-28.clover"
        })
    }
    return stripe
}

// Webhook secret for verifying events
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

// Lazy-loaded Supabase admin client
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

// Handle Stripe webhooks
export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get("stripe-signature")

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 })
        }

        let event: Stripe.Event

        try {
            // Verify the webhook signature
            if (webhookSecret) {
                event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
            } else {
                // In development, parse without verification
                console.warn("[Stripe Webhook] No webhook secret configured, parsing without verification")
                event = JSON.parse(body) as Stripe.Event
            }
        } catch (err) {
            console.error("[Stripe Webhook] Signature verification failed:", err)
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }

        console.log(`[Stripe Webhook] Received event: ${event.type}`)

        // Handle checkout.session.completed
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session

            const userId = session.metadata?.userId
            const credits = parseInt(session.metadata?.credits || "0", 10)
            const packageId = session.metadata?.packageId

            if (!userId || !credits) {
                console.error("[Stripe Webhook] Missing userId or credits in metadata")
                return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
            }

            console.log(`[Stripe Webhook] Adding ${credits} credits to user ${userId}`)

            // Add credits to user's profile
            const adminClient = getSupabaseAdmin() as any

            // Get current credits
            const { data: profile, error: fetchError } = await adminClient
                .from("profiles")
                .select("credits")
                .eq("id", userId)
                .single()

            if (fetchError) {
                console.error("[Stripe Webhook] Error fetching profile:", fetchError)
                return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
            }

            const currentCredits = profile?.credits || 0
            const newCredits = currentCredits + credits

            // Update credits
            const { error: updateError } = await adminClient
                .from("profiles")
                .update({ credits: newCredits })
                .eq("id", userId)

            if (updateError) {
                console.error("[Stripe Webhook] Error updating credits:", updateError)
                return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
            }

            // Log the purchase in a purchases table (optional)
            await adminClient
                .from("purchases")
                .insert({
                    user_id: userId,
                    stripe_session_id: session.id,
                    package_id: packageId,
                    credits_added: credits,
                    amount_paid: session.amount_total,
                    currency: session.currency
                })
                .catch((err: Error) => {
                    // Don't fail if purchases table doesn't exist
                    console.warn("[Stripe Webhook] Could not log purchase:", err)
                })

            console.log(`[Stripe Webhook] Successfully added ${credits} credits to user ${userId}. New total: ${newCredits}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error("[Stripe Webhook] Error:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
}

// Stripe webhooks don't need verification for GET
export async function GET() {
    return NextResponse.json({ status: "Stripe webhook endpoint active" })
}
