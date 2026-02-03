import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Public Supabase client for reading blog posts
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("slug", slug)
            .eq("published", true)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        return NextResponse.json({ post: data })

    } catch (error) {
        console.error("[Blog API] Error:", error)
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
    }
}
