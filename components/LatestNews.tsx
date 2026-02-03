import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { LatestNewsView } from "./LatestNewsView"

// Initialize Supabase Client (Private or Anon key is fine for public data)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cached Data Fetching
const getLatestPosts = unstable_cache(
    async () => {
        const { data } = await supabase
            .from("blog_posts")
            .select("id, slug, title, excerpt, category, read_time, created_at")
            .eq("published", true)
            .order("created_at", { ascending: false })
            .limit(3)

        return data || []
    },
    ['latest-news-home'],
    { revalidate: 3600, tags: ['blog_posts'] }
)

export async function LatestNews() {
    const posts = await getLatestPosts()
    return <LatestNewsView posts={posts} />
}
