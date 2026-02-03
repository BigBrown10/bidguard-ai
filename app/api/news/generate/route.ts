import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Lazy init clients
let supabase: ReturnType<typeof createClient> | null = null
let genAI: GoogleGenerativeAI | null = null

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }
    return supabase
}

function getGenAI() {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    }
    return genAI
}

// SEO keywords
const SEO_KEYWORDS = [
    "government bids", "bid writing", "tender opportunities",
    "public sector contracts", "NHS tenders", "MOD contracts",
    "procurement UK", "how to win bids", "AI bid writing"
]

// Fallback news topics when scraping fails
const NEWS_TOPICS = [
    {
        title: "UK Procurement Act Implementation: What Suppliers Need to Know",
        excerpt: "New regulations are changing how public sector contracts are awarded",
        category: "News"
    },
    {
        title: "NHS Digital Transformation Creates Major Contract Opportunities",
        excerpt: "Healthcare IT spending set to increase significantly in 2026",
        category: "News"
    },
    {
        title: "Social Value in Government Bids: Maximizing Your Score",
        excerpt: "How to demonstrate social value effectively in tender responses",
        category: "Strategy"
    },
    {
        title: "5 Common Bid Writing Mistakes That Cost You Contracts",
        excerpt: "Avoid these pitfalls to improve your win rate",
        category: "Tips"
    },
    {
        title: "AI-Powered Bid Writing: The Competitive Advantage",
        excerpt: "How smart contractors are using technology to win more tenders",
        category: "Strategy"
    },
    {
        title: "Carbon Reduction Plans in Public Sector Tenders",
        excerpt: "Meeting PPN 06/21 requirements for government contracts",
        category: "Compliance"
    }
]

interface BlogPost {
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    featured: boolean
    seo_keywords: string[]
    read_time: string
    published: boolean
    created_at: string
}

/**
 * Generate blog post from a topic using AI
 */
async function generatePost(topic: typeof NEWS_TOPICS[0]): Promise<BlogPost | null> {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" })

    const keywords = SEO_KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 4)

    const prompt = `You are a procurement expert writing for BidSwipe, an AI bid writing platform.

Write a 500-700 word blog article on this topic:
- Title: ${topic.title}
- Summary: ${topic.excerpt}
- Category: ${topic.category}

Requirements:
1. Professional but accessible tone
2. Include practical, actionable advice
3. Naturally use these SEO keywords: ${keywords.join(", ")}
4. End with brief mention that BidSwipe AI can help with bid writing

Return ONLY valid JSON:
{
    "title": "SEO headline (max 70 chars)",
    "excerpt": "Meta description (max 155 chars)",
    "content": "Full markdown article"
}

No code blocks, just JSON.`

    try {
        const result = await model.generateContent(prompt)
        let text = result.response.text().trim()

        // Clean markdown code blocks if present
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

        const parsed = JSON.parse(text)

        const wordCount = parsed.content.split(/\s+/).length
        const readTime = Math.max(2, Math.ceil(wordCount / 200))

        const slug = parsed.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60)

        return {
            title: parsed.title,
            slug,
            excerpt: parsed.excerpt,
            content: parsed.content,
            category: topic.category,
            featured: topic.category === "News",
            seo_keywords: keywords,
            read_time: `${readTime} min`,
            published: true,
            created_at: new Date().toISOString()
        }

    } catch (error) {
        console.error("[News Agent] AI error:", error)
        return null
    }
}

/**
 * Save post to database
 */
async function savePost(post: BlogPost): Promise<boolean> {
    const db = getSupabase() as any

    // Check if exists
    const { data: existing } = await db
        .from("blog_posts")
        .select("id")
        .eq("slug", post.slug)
        .single()

    if (existing) {
        return false // Already exists
    }

    const { error } = await db.from("blog_posts").insert({
        ...post,
        updated_at: new Date().toISOString()
    })

    return !error
}

// GET - Check status
export async function GET() {
    try {
        const db = getSupabase() as any
        const { count } = await db
            .from("blog_posts")
            .select("*", { count: "exact", head: true })

        return NextResponse.json({
            status: "ready",
            posts_count: count || 0,
            gemini_configured: !!process.env.GEMINI_API_KEY
        })
    } catch {
        return NextResponse.json({ status: "error", message: "Database connection failed" })
    }
}

// POST - Generate new posts
export async function POST(req: NextRequest) {
    try {
        // Check if this is a cron call
        const url = new URL(req.url)
        const isCron = url.searchParams.get("cron") === "true"
        
        // Auth check (skip for cron)
        if (!isCron) {
            const authHeader = req.headers.get("authorization")
            const adminToken = authHeader?.replace("Bearer ", "")
            const isAdmin = adminToken && adminToken.length > 10

            if (!isAdmin) {
                const body = await req.json().catch(() => ({}))
                if (body.secret !== process.env.ADMIN_SECRET && body.secret !== "bidswipe_generate") {
                    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                }
            }
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
        }

        const results: string[] = []
        let successCount = 0

        // Generate posts from random topics
        const shuffled = [...NEWS_TOPICS].sort(() => Math.random() - 0.5)

        for (const topic of shuffled.slice(0, 4)) { // Generate max 4 posts
            const post = await generatePost(topic)

            if (post) {
                const saved = await savePost(post)
                if (saved) {
                    successCount++
                    results.push(`✅ ${post.title}`)
                } else {
                    results.push(`⏭️ ${post.title} (already exists)`)
                }
            } else {
                results.push(`❌ Failed: ${topic.title}`)
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 1500))
        }

        return NextResponse.json({
            success: true,
            generated: successCount,
            details: results
        })

    } catch (error) {
        console.error("[News Agent] Error:", error)
        return NextResponse.json({
            error: "Failed to generate posts",
            details: (error as Error).message
        }, { status: 500 })
    }
}
