/**
 * SEO Content Agent
 * 
 * Generates blog posts from tender data to boost SEO rankings for "bids" keywords.
 * Uses Google Gemini AI to write articles about:
 * - Recent tender opportunities
 * - Bid writing tips
 * - Industry insights
 * - Compliance updates
 * 
 * Can publish to:
 * - /news page (Supabase blog_posts table)
 * - Medium (via API)
 * - Substack (via API)
 */

import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()
dotenv.config({ path: ".env.local" })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GEMINI_KEY = process.env.GEMINI_API_KEY!

// SEO Keywords to target
const SEO_KEYWORDS = [
    "government bids",
    "bid writing",
    "tender opportunities",
    "public sector contracts",
    "NHS tenders",
    "MOD contracts",
    "procurement UK",
    "how to win bids",
    "bid management",
    "tender writing services",
    "AI bid writing",
    "autonomous bid writer",
    "contract finder UK",
    "public sector procurement",
    "bid proposal template"
]

// Article types to generate
const ARTICLE_TYPES = [
    {
        type: "tender_highlight",
        title_template: "Major {sector} Tender Alert: {title}",
        prompt: `Write a 600-800 word SEO-optimized blog post about a recent government tender opportunity. 
        Include:
        - An attention-grabbing headline
        - Summary of the opportunity
        - Why it matters for contractors
        - Key requirements and what to include in a bid
        - How AI can help write winning proposals
        
        Use these SEO keywords naturally: {keywords}
        
        Tender details: {tender_details}
        
        End with a call to action to try BidSwipe's AI bid writer.`
    },
    {
        type: "bid_tips",
        title_template: "{count} Essential Tips for Winning {sector} Contracts in 2026",
        prompt: `Write a 700-900 word SEO-optimized blog post with practical bid writing tips.
        Include:
        - Numbered tips (at least 5)
        - Real examples where possible
        - Common mistakes to avoid
        - How AI tools are changing bid writing
        
        Use these SEO keywords naturally: {keywords}
        
        Focus on sector: {sector}
        
        End with a call to action to try BidSwipe's AI bid writer.`
    },
    {
        type: "industry_insight",
        title_template: "The Future of {sector} Procurement: Trends and Opportunities",
        prompt: `Write a 600-800 word SEO-optimized thought leadership article about procurement trends.
        Include:
        - Current market analysis
        - Upcoming changes in regulations
        - Opportunities for contractors
        - How technology is transforming bidding
        
        Use these SEO keywords naturally: {keywords}
        
        Focus on sector: {sector}
        
        End with a call to action to try BidSwipe's AI bid writer.`
    },
    {
        type: "compliance",
        title_template: "UK Procurement Compliance 2026: What Bidders Need to Know",
        prompt: `Write a 700-900 word SEO-optimized article about compliance requirements for UK government tenders.
        Include:
        - Key compliance areas (social value, sustainability, data protection)
        - Recent regulatory changes
        - How to demonstrate compliance in bids
        - Common compliance pitfalls
        
        Use these SEO keywords naturally: {keywords}
        
        End with a call to action to try BidSwipe's AI bid writer.`
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
    medium_url?: string
    substack_url?: string
    created_at: string
}

interface Tender {
    id: string
    title: string
    buyer: string
    description: string
    value: string
    sector: string
    source_url: string
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const genAI = new GoogleGenerativeAI(GEMINI_KEY)

async function generateArticle(
    type: typeof ARTICLE_TYPES[0],
    tender?: Tender,
    sector: string = "public sector"
): Promise<BlogPost | null> {
    console.log(`📝 Generating ${type.type} article...`)

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Select random keywords for this article
    const selectedKeywords = SEO_KEYWORDS
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .join(", ")

    // Build the prompt
    let prompt = type.prompt
        .replace("{keywords}", selectedKeywords)
        .replace("{sector}", sector)
        .replace("{count}", String(Math.floor(Math.random() * 3) + 5))

    if (tender) {
        prompt = prompt.replace("{tender_details}", JSON.stringify({
            title: tender.title,
            buyer: tender.buyer,
            description: tender.description,
            value: tender.value,
            sector: tender.sector
        }, null, 2))
    }

    prompt += `
    
    IMPORTANT: Format the response as JSON with these exact fields:
    {
        "title": "SEO-optimized headline (max 70 chars)",
        "excerpt": "Compelling meta description (max 160 chars)",
        "content": "Full markdown article content",
        "category": "Strategy|Tips|Compliance|News"
    }
    
    Only return valid JSON, no other text.`

    try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = text
        if (text.includes("```json")) {
            jsonStr = text.split("```json")[1].split("```")[0].trim()
        } else if (text.includes("```")) {
            jsonStr = text.split("```")[1].split("```")[0].trim()
        }

        const parsed = JSON.parse(jsonStr)

        // Calculate read time (avg 200 words per minute)
        const wordCount = parsed.content.split(/\s+/).length
        const readTime = Math.ceil(wordCount / 200)

        // Generate slug from title
        const slug = parsed.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60)

        const blogPost: BlogPost = {
            title: parsed.title,
            slug,
            excerpt: parsed.excerpt,
            content: parsed.content,
            category: parsed.category,
            featured: type.type === "tender_highlight",
            seo_keywords: selectedKeywords.split(", "),
            read_time: `${readTime} min`,
            published: true,
            created_at: new Date().toISOString()
        }

        console.log(`✅ Generated: "${blogPost.title}"`)
        return blogPost

    } catch (error) {
        console.error(`❌ Failed to generate article:`, error)
        return null
    }
}

async function saveToDatabase(post: BlogPost): Promise<boolean> {
    console.log(`💾 Saving to database: ${post.title}`)

    const { error } = await supabase.from("blog_posts").upsert({
        ...post,
        updated_at: new Date().toISOString()
    }, {
        onConflict: "slug"
    })

    if (error) {
        console.error(`❌ Failed to save:`, error.message)
        return false
    }

    console.log(`✅ Saved to database`)
    return true
}

async function publishToMedium(post: BlogPost): Promise<string | null> {
    const MEDIUM_TOKEN = process.env.MEDIUM_ACCESS_TOKEN
    const MEDIUM_USER_ID = process.env.MEDIUM_USER_ID

    if (!MEDIUM_TOKEN || !MEDIUM_USER_ID) {
        console.log("⚠️ Medium credentials not configured, skipping")
        return null
    }

    console.log(`📤 Publishing to Medium: ${post.title}`)

    try {
        const response = await fetch(
            `https://api.medium.com/v1/users/${MEDIUM_USER_ID}/posts`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${MEDIUM_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: post.title,
                    contentFormat: "markdown",
                    content: post.content,
                    tags: post.seo_keywords.slice(0, 5),
                    publishStatus: "public",
                    canonicalUrl: `https://bidswipe.xyz/news/${post.slug}`
                })
            }
        )

        if (!response.ok) {
            throw new Error(`Medium API error: ${response.status}`)
        }

        const data = await response.json()
        console.log(`✅ Published to Medium: ${data.data.url}`)
        return data.data.url

    } catch (error) {
        console.error(`❌ Failed to publish to Medium:`, error)
        return null
    }
}

async function publishToSubstack(post: BlogPost): Promise<string | null> {
    // Substack doesn't have a public API, but we can use their email API
    // or integrate with their unofficial API
    const SUBSTACK_EMAIL = process.env.SUBSTACK_EMAIL
    const SUBSTACK_PASSWORD = process.env.SUBSTACK_PASSWORD
    const SUBSTACK_PUBLICATION = process.env.SUBSTACK_PUBLICATION

    if (!SUBSTACK_EMAIL || !SUBSTACK_PUBLICATION) {
        console.log("⚠️ Substack credentials not configured, skipping")
        return null
    }

    console.log(`📤 Would publish to Substack: ${post.title}`)
    // Substack integration would require headless browser or unofficial API
    // For now, log the intention
    return null
}

async function fetchRecentTenders(): Promise<Tender[]> {
    console.log("🔍 Fetching recent tenders from database...")

    const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .order("fetched_at", { ascending: false })
        .limit(5)

    if (error) {
        console.error("❌ Failed to fetch tenders:", error.message)
        return []
    }

    console.log(`✅ Found ${data?.length || 0} recent tenders`)
    return data || []
}

async function run() {
    console.log("🚀 SEO Content Agent Starting...")
    console.log("=".repeat(50))

    if (!GEMINI_KEY) {
        console.error("❌ GEMINI_API_KEY not configured")
        process.exit(1)
    }

    // 1. Fetch recent tenders for content ideas
    const tenders = await fetchRecentTenders()

    const postsToGenerate: Array<{
        type: typeof ARTICLE_TYPES[0]
        tender?: Tender
        sector?: string
    }> = []

    // 2. Generate tender highlight articles
    if (tenders.length > 0) {
        postsToGenerate.push({
            type: ARTICLE_TYPES.find(t => t.type === "tender_highlight")!,
            tender: tenders[0],
            sector: tenders[0].sector
        })
    }

    // 3. Generate tips article
    postsToGenerate.push({
        type: ARTICLE_TYPES.find(t => t.type === "bid_tips")!,
        sector: tenders[0]?.sector || "NHS"
    })

    // 4. Generate insight article
    postsToGenerate.push({
        type: ARTICLE_TYPES.find(t => t.type === "industry_insight")!,
        sector: tenders[0]?.sector || "Defence"
    })

    // 5. Generate compliance article
    postsToGenerate.push({
        type: ARTICLE_TYPES.find(t => t.type === "compliance")!
    })

    console.log(`\n📋 Generating ${postsToGenerate.length} articles...\n`)

    let successCount = 0

    for (const config of postsToGenerate) {
        const post = await generateArticle(config.type, config.tender, config.sector)

        if (post) {
            // Save to database
            const saved = await saveToDatabase(post)
            if (saved) successCount++

            // Publish to external platforms
            const mediumUrl = await publishToMedium(post)
            if (mediumUrl) {
                await supabase.from("blog_posts").update({ medium_url: mediumUrl }).eq("slug", post.slug)
            }

            const substackUrl = await publishToSubstack(post)
            if (substackUrl) {
                await supabase.from("blog_posts").update({ substack_url: substackUrl }).eq("slug", post.slug)
            }
        }

        // Small delay between generations
        await new Promise(r => setTimeout(r, 2000))
    }

    console.log("\n" + "=".repeat(50))
    console.log(`🏁 SEO Content Agent Complete!`)
    console.log(`✅ Generated ${successCount}/${postsToGenerate.length} articles`)
    console.log(`📈 These will help rank for keywords like: ${SEO_KEYWORDS.slice(0, 3).join(", ")}`)
}

// Export for use as module
export { generateArticle, saveToDatabase, publishToMedium, run }

// Run if executed directly
if (require.main === module) {
    run().catch(console.error)
}
