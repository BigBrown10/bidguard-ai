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

// Credit packages
const CREDIT_PACKAGES = {
    starter: { credits: 10, price: 1900, name: "Starter Pack" },      // $19
    pro: { credits: 50, price: 7900, name: "Pro Pack" },              // $79
    enterprise: { credits: 200, price: 24900, name: "Enterprise Pack" } // $249
}

// Create checkout session
export async function POST(req: NextRequest) {
    try {
        const { packageId, userId, userEmail, returnUrl } = await req.json()

        if (!packageId || !CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 })
        }

        if (!userId) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
        }

        const pkg = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]

        // Create Stripe checkout session
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: pkg.name,
                            description: `${pkg.credits} BidSwipe Credits`,
                            images: ["https://bidswipe.xyz/logo.png"]
                        },
                        unit_amount: pkg.price
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
            cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
            customer_email: userEmail,
            metadata: {
                userId,
                packageId,
                credits: pkg.credits.toString()
            }
        })

        return NextResponse.json({
            sessionId: session.id,
            url: session.url
        })

    } catch (error) {
        console.error("[Stripe] Checkout error:", error)
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
    }
}

// Get available packages
export async function GET() {
    return NextResponse.json({
        packages: Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => ({
            id,
            ...pkg,
            priceFormatted: `$${(pkg.price / 100).toFixed(2)}`
        }))
    })
}
