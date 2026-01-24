import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with SERVICE ROLE for Inngest background jobs
// This bypasses RLS and can update any record

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null

if (!supabaseAdmin) {
    console.warn("[SUPABASE ADMIN] Service role key missing. Inngest functions will not work.")
}
