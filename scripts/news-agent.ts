/**
 * News Content Agent
 * 
 * Scrapes procurement/tender news from various sources,
 * humanizes the content with AI, and posts to the /news page.
 * 
 * Sources:
 * - GOV.UK procurement news
 * - Public sector tender announcements
 * - Industry publications
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

// News sources to scrape
const NEWS_SOURCES = [
    {
        name: "GOV.UK Procurement",
        url: "https://www.gov.uk/search/news-and-communications?topical_events%5B%5D=public-procurement-reform",
        type: "government"
    },
    {
        name: "Contracts Finder",
        url: "https://www.gov.uk/contracts-finder",
        type: "tenders"
    }
]

// SEO keywords to naturally include
const SEO_KEYWORDS = [
    "government bids",
    "bid writing",
    "tender opportunities",
    "public sector contracts",
    "NHS tenders",
    "MOD contracts",
    "procurement UK",
    "how to win bids",
    "AI bid writing",
    "contract finder"
]

interface RawNewsItem {
    title: string
    source: string
    url?: string
    date?: string
    snippet?: string
}

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

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const genAI = new GoogleGenerativeAI(GEMINI_KEY)

/**
 * Scrape news from tender data already in the database
 */
async function scrapeNewsFromTenders(): Promise<RawNewsItem[]> {
    console.log("📰 Fetching recent tender data for news generation...")

    const { data: tenders, error } = await supabase
        .from("tenders")
        .select("title, buyer, description, value, sector, source_url, fetched_at")
        .order("fetched_at", { ascending: false })
        .limit(10)

    if (error || !tenders?.length) {
        console.log("⚠️ No tender data found, using fallback topics")
        return getFallbackNewsTopics()
    }

    return tenders.map(tender => ({
        title: tender.title,
        source: tender.buyer || "UK Government",
        url: tender.source_url,
        date: tender.fetched_at,
        snippet: `${tender.description} - Value: ${tender.value}`
    }))
}

/**
 * Fallback news topics when no tender data available
 */
function getFallbackNewsTopics(): RawNewsItem[] {
    return [
        {
            title: "UK Procurement Act 2023 Implementation Updates",
            source: "GOV.UK",
            snippet: "New regulations affecting how suppliers bid for public contracts"
        },
        {
            title: "NHS Digital Transformation Tender Pipeline",
            source: "NHS England",
            snippet: "Major healthcare IT contracts expected in coming months"
        },
        {
            title: "Defence Procurement Modernisation Programme",
            source: "Ministry of Defence",
            snippet: "MOD streamlines procurement for faster contract awards"
        },
        {
            title: "Social Value Requirements in Public Sector Bids",
            source: "Cabinet Office",
            snippet: "How to demonstrate social value in government tender submissions"
        },
        {
            title: "AI and Automation in Bid Writing",
            source: "Industry Analysis",
            snippet: "How technology is transforming the tender response process"
        }
    ]
}

/**
 * Humanize raw news into an engaging blog post using AI
 */
async function humanizeNews(newsItem: RawNewsItem): Promise<BlogPost | null> {
    console.log(`✍️ Humanizing: "${newsItem.title}"`)

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Select random SEO keywords
    const selectedKeywords = SEO_KEYWORDS
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)

    const prompt = `You are a procurement industry journalist writing for BidSwipe, an AI-powered bid writing platform.

Write a 500-700 word news article based on this information:
- Topic: ${newsItem.title}
- Source: ${newsItem.source}
- Details: ${newsItem.snippet || "Latest update on UK public sector procurement"}

Requirements:
1. Write in an engaging, professional but accessible tone
2. Explain why this matters for companies bidding on government contracts
3. Include practical insights for bid writers
4. Naturally incorporate these SEO keywords where relevant: ${selectedKeywords.join(", ")}
5. End with a brief mention that AI tools like BidSwipe can help with bid writing

IMPORTANT: Return ONLY a JSON object with these exact fields:
{
    "title": "Catchy headline (max 70 chars)",
    "excerpt": "Compelling summary (max 160 chars)", 
    "content": "Full markdown article",
    "category": "News|Strategy|Tips|Compliance"
}

Return valid JSON only, no markdown code blocks or other text.`

    try {
        const result = await model.generateContent(prompt)
        let text = result.response.text().trim()

        // Clean up response - remove markdown code blocks if present
        if (text.startsWith("```json")) {
            text = text.slice(7)
        }
        if (text.startsWith("```")) {
            text = text.slice(3)
        }
        if (text.endsWith("```")) {
            text = text.slice(0, -3)
        }
        text = text.trim()

        const parsed = JSON.parse(text)

        // Calculate read time
        const wordCount = parsed.content.split(/\s+/).length
        const readTime = Math.max(2, Math.ceil(wordCount / 200))

        // Generate slug
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
            category: parsed.category || "News",
            featured: false,
            seo_keywords: selectedKeywords,
            read_time: `${readTime} min`,
            published: true,
            created_at: new Date().toISOString()
        }

        console.log(`✅ Created: "${blogPost.title}"`)
        return blogPost

    } catch (error) {
        console.error(`❌ Failed to humanize:`, error)
        return null
    }
}

/**
 * Save blog post to database
 */
async function savePost(post: BlogPost): Promise<boolean> {
    console.log(`💾 Saving: ${post.title}`)

    // Check if slug already exists
    const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", post.slug)
        .single()

    if (existing) {
        console.log(`⏭️ Skipped (already exists): ${post.slug}`)
        return false
    }

    const { error } = await supabase
        .from("blog_posts")
        .insert({
            ...post,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error(`❌ Failed to save:`, error.message)
        return false
    }

    console.log(`✅ Saved to /news`)
    return true
}

/**
 * Main execution
 */
async function run() {
    console.log("🚀 News Content Agent Starting...")
    console.log("=".repeat(50))

    if (!GEMINI_KEY) {
        console.error("❌ GEMINI_API_KEY not configured")
        process.exit(1)
    }

    // 1. Get news items (from tenders or fallback)
    const newsItems = await scrapeNewsFromTenders()
    console.log(`📋 Found ${newsItems.length} news topics to process\n`)

    let successCount = 0

    // 2. Process each news item
    for (const item of newsItems.slice(0, 5)) { // Process max 5 at a time
        const post = await humanizeNews(item)

        if (post) {
            const saved = await savePost(post)
            if (saved) successCount++
        }

        // Rate limit - wait 2s between API calls
        await new Promise(r => setTimeout(r, 2000))
    }

    console.log("\n" + "=".repeat(50))
    console.log(`🏁 News Content Agent Complete!`)
    console.log(`✅ Published ${successCount} new articles to /news`)
    console.log(`📈 SEO keywords targeted: ${SEO_KEYWORDS.slice(0, 4).join(", ")}`)
}

// Export for module use
export { scrapeNewsFromTenders, humanizeNews, savePost, run }

// Run if executed directly
if (require.main === module) {
    run().catch(console.error)
}
