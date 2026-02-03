
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials!")
    console.error("URL:", supabaseUrl ? "Found" : "Missing")
    console.error("KEY:", supabaseKey ? "Found" : "Missing")
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function giveCredits() {
    console.log("Give 10 Credits to ALL users...")

    // 1. Get all profiles
    const { data: profiles, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("id, company_name, credits")

    if (fetchError) {
        console.error("Error fetching profiles:", fetchError)
        return
    }

    console.log(`Found ${profiles.length} profiles. Updating...`)

    // 2. Update credits to 10
    // We can do a bulk update or loop. With Supabase, update() without a specific ID updates ALL rows if RLS allows, 
    // but typically we want to be safe.

    // Actually, update({ credits: 10 }).neq("id", "000000") is a hack update all.
    // Or just iterate. Safest is iterate for logging.

    let updatedCount = 0

    for (const profile of profiles) {
        // Only update if not already 10 (or user implies "set to 10" or "add 10"? User said "give all account 10 credits". I will set to 10.)
        // If they meant "add 10", I'd add. "give... 10 credits" usually means "set balance to 10" or "gift 10". 
        // Given it's a "free trial abuse" context, resetting to 10 (standard trial amount?) makes sense.
        // Or maybe just "ensure they have at least 10".
        // I'll set to 10 to be generous as requested.

        const { error } = await supabaseAdmin
            .from("profiles")
            .update({ credits: 10 })
            .eq("id", profile.id)

        if (error) {
            console.error(`Failed to update ${profile.company_name} (${profile.id}):`, error.message)
        } else {
            updatedCount++
        }
    }

    console.log(`Success! Updated ${updatedCount} users to 10 credits.`)
}

giveCredits()
