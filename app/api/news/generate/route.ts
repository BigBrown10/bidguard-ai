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
 * Extract JSON from a response that might have extra text
 */
function extractJSON(text: string): object | null {
    // Try direct parse first
    try {
        return JSON.parse(text)
    } catch {
        // Try to find JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*"title"[\s\S]*"excerpt"[\s\S]*"content"[\s\S]*\}/)
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0])
            } catch {
                // Continue to next attempt
            }
        }

        // Try cleaning markdown code blocks
        let cleaned = text
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .replace(/^\s*[\r\n]+/, "")
            .trim()

        try {
            return JSON.parse(cleaned)
        } catch {
            return null
        }
    }
}

/**
 * Generate blog post from a topic using AI with retries
 */
async function generatePost(topic: typeof NEWS_TOPICS[0], retries = 2): Promise<BlogPost | null> {
    const model = getGenAI().getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    })

    const keywords = SEO_KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 4)

    // Simpler, more structured prompt for reliable JSON
    const prompt = `Write a blog article about: "${topic.title}"

Context: ${topic.excerpt}
Category: ${topic.category}
Include keywords: ${keywords.join(", ")}

Write 500 words. End with "BidSwipe AI can help streamline your bid writing process."

Respond with ONLY this JSON structure (no other text):
{"title":"catchy headline under 70 chars","excerpt":"meta description under 155 chars","content":"full markdown article here"}`

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()

            const parsed = extractJSON(text) as { title: string; excerpt: string; content: string } | null

            if (!parsed || !parsed.title || !parsed.content) {
                console.error(`[News Agent] Invalid response structure, attempt ${attempt + 1}`)
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, 1000))
                    continue
                }
                return null
            }

            const wordCount = parsed.content.split(/\s+/).length
            const readTime = Math.max(2, Math.ceil(wordCount / 200))

            const slug = parsed.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 60)

            return {
                title: parsed.title.slice(0, 70),
                slug,
                excerpt: (parsed.excerpt || topic.excerpt).slice(0, 155),
                content: parsed.content,
                category: topic.category,
                featured: topic.category === "News",
                seo_keywords: keywords,
                read_time: `${readTime} min`,
                published: true,
                created_at: new Date().toISOString()
            }

        } catch (error) {
            console.error(`[News Agent] Attempt ${attempt + 1} failed:`, error)
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 1000))
            }
        }
    }

    return null
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
