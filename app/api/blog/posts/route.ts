import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Public Supabase client for reading blog posts
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get("category")
        const featured = searchParams.get("featured")
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = parseInt(searchParams.get("offset") || "0")

        let query = supabase
            .from("blog_posts")
            .select("id, slug, title, excerpt, category, featured, read_time, created_at")
            .eq("published", true)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1)

        if (category && category !== "all") {
            query = query.eq("category", category)
        }

        if (featured === "true") {
            query = query.eq("featured", true)
        }

        const { data, error } = await query

        if (error) {
            console.error("[Blog API] Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ posts: data || [] })

    } catch (error) {
        console.error("[Blog API] Error:", error)
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }
}
