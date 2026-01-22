
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use createBrowserClient so cookies are automatically handled
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null

if (!supabase) {
    console.warn("Supabase keys missing. Database functionality disabled.")
}
