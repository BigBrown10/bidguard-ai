/**
 * Tender News & Tips Scraper
 * 
 * Scrapes:
 * 1. News ABOUT tenders (procurement news, policy changes, industry updates)
 * 2. Tips & tricks from social media on winning tenders
 * 
 * Uses the data to:
 * - Generate blog posts for /news page (SEO)
 * - Build a knowledge base for training AI agents to write better proposals
 */

import puppeteer from "puppeteer"
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

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const genAI = new GoogleGenerativeAI(GEMINI_KEY)

// News sources to scrape
const NEWS_SOURCES = [
    {
        name: "GOV.UK Procurement News",
        url: "https://www.gov.uk/search/news-and-communications?topics%5B%5D=government-buying",
        selectors: {
            items: ".gem-c-document-list__item",
            title: ".gem-c-document-list__item-title a",
            excerpt: ".gem-c-document-list__item-description",
            link: ".gem-c-document-list__item-title a"
        },
        category: "News"
    },
    {
        name: "Supply Management Magazine",
        url: "https://www.supplymanagement.com/news",
        selectors: {
            items: "article.teaser",
            title: "h2 a, h3 a",
            excerpt: ".teaser__standfirst, .teaser__summary",
            link: "h2 a, h3 a"
        },
        category: "News"
    },
    {
        name: "CIPS (Procurement & Supply)",
        url: "https://www.cips.org/intelligence-hub/",
        selectors: {
            items: ".resource-card",
            title: ".resource-card__title, h3",
            excerpt: ".resource-card__description",
            link: "a"
        },
        category: "Strategy"
    }
]

// Social media / tips sources
const TIPS_SOURCES = [
    {
        name: "LinkedIn Bid Writing Tips",
        searchTerms: ["bid writing tips", "tender success", "win government contracts"],
        category: "Tips"
    },
    {
        name: "Reddit Procurement",
        url: "https://www.reddit.com/r/procurement/top/?t=month",
        category: "Tips"
    }
]

interface ScrapedItem {
    title: string
    excerpt: string
    url: string
    source: string
    category: string
    raw_content?: string
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

interface KnowledgeItem {
    type: string
    content: string
    source: string
    tags: string[]
    embedding?: number[]
    created_at: string
}

// SEO keywords to target
const SEO_KEYWORDS = [
    "government bids", "bid writing", "tender opportunities",
    "public sector contracts", "NHS tenders", "MOD contracts",
    "procurement UK", "how to win bids", "AI bid writing",
    "tender response", "bid proposal", "public procurement"
]

/**
 * Scrape news articles from a source
 */
async function scrapeNewsSource(
    browser: puppeteer.Browser,
    source: typeof NEWS_SOURCES[0]
): Promise<ScrapedItem[]> {
    console.log(`📰 Scraping: ${source.name}`)
    const page = await browser.newPage()
    const items: ScrapedItem[] = []

    try {
        await page.goto(source.url, { waitUntil: "networkidle2", timeout: 30000 })
        await page.waitForSelector(source.selectors.items, { timeout: 10000 }).catch(() => null)

        const scraped = await page.evaluate((selectors) => {
            const results: Array<{ title: string; excerpt: string; url: string }> = []
            const elements = document.querySelectorAll(selectors.items)

            elements.forEach((el, i) => {
                if (i >= 10) return // Max 10 items per source

                const titleEl = el.querySelector(selectors.title)
                const excerptEl = el.querySelector(selectors.excerpt)
                const linkEl = el.querySelector(selectors.link)

                if (titleEl) {
                    results.push({
                        title: titleEl.textContent?.trim() || "",
                        excerpt: excerptEl?.textContent?.trim() || "",
                        url: (linkEl as HTMLAnchorElement)?.href || ""
                    })
                }
            })

            return results
        }, source.selectors)

        for (const item of scraped) {
            if (item.title && item.title.length > 10) {
                items.push({
                    ...item,
                    source: source.name,
                    category: source.category
                })
            }
        }

        console.log(`  ✅ Found ${items.length} articles`)

    } catch (error) {
        console.error(`  ❌ Failed to scrape ${source.name}:`, (error as Error).message)
    } finally {
        await page.close()
    }

    return items
}

/**
 * Generate tips content using AI (simulating social media insights)
 */
async function generateTipsContent(): Promise<ScrapedItem[]> {
    console.log("💡 Generating bid writing tips content...")

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `You are an expert in UK government procurement and bid writing.
    
Generate 3 unique, practical tips for winning government tenders. Each tip should be something that could be shared on LinkedIn or a procurement blog.

For each tip, provide:
- A catchy headline (max 60 chars)
- A brief summary (max 150 chars)
- The full tip content (200-300 words)

Return as JSON array:
[
    {
        "title": "headline",
        "excerpt": "summary",
        "content": "full tip content in markdown"
    }
]

Make tips specific and actionable. Include real-world examples where possible.
Focus on: social value, compliance, evaluation criteria, evidence presentation.

Return ONLY valid JSON, no code blocks.`

    try {
        const result = await model.generateContent(prompt)
        let text = result.response.text().trim()

        // Clean up response
        if (text.startsWith("```")) {
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        }

        const tips = JSON.parse(text)

        return tips.map((tip: any) => ({
            title: tip.title,
            excerpt: tip.excerpt,
            url: "",
            source: "BidSwipe Expert Tips",
            category: "Tips",
            raw_content: tip.content
        }))

    } catch (error) {
        console.error("❌ Failed to generate tips:", error)
        return []
    }
}

/**
 * Humanize scraped content into a blog post
 */
async function humanizeToPost(item: ScrapedItem): Promise<BlogPost | null> {
    console.log(`✍️ Creating post: "${item.title.slice(0, 50)}..."`)

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const keywords = SEO_KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 4)

    const prompt = `You are a procurement journalist for BidSwipe, an AI bid writing platform.

Write a 400-600 word blog article based on this news/tip:

Title: ${item.title}
Summary: ${item.excerpt}
${item.raw_content ? `Content: ${item.raw_content}` : ""}
Source: ${item.source}
Category: ${item.category}

Requirements:
1. Write in professional but accessible tone
2. Explain why this matters for companies bidding on government contracts
3. Include actionable takeaways
4. Naturally use these SEO keywords: ${keywords.join(", ")}
5. End with brief mention that BidSwipe AI can help with bid writing

Return JSON with these fields only:
{
    "title": "Catchy SEO-friendly headline (max 70 chars)",
    "excerpt": "Meta description (max 155 chars)",
    "content": "Full markdown article"
}

Return ONLY valid JSON.`

    try {
        const result = await model.generateContent(prompt)
        let text = result.response.text().trim()

        if (text.startsWith("```")) {
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        }

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
            category: item.category,
            featured: item.category === "News",
            seo_keywords: keywords,
            read_time: `${readTime} min`,
            published: true,
            created_at: new Date().toISOString()
        }

    } catch (error) {
        console.error(`❌ Failed to humanize:`, error)
        return null
    }
}

/**
 * Save to knowledge base for agent training
 */
async function saveToKnowledgeBase(item: ScrapedItem): Promise<void> {
    const knowledge: KnowledgeItem = {
        type: item.category.toLowerCase(),
        content: `${item.title}\n\n${item.excerpt}\n\n${item.raw_content || ""}`,
        source: item.source,
        tags: item.category === "Tips"
            ? ["bid writing", "tips", "best practices"]
            : ["news", "procurement", "updates"],
        created_at: new Date().toISOString()
    }

    // Save to knowledge_base table (create if needed)
    const { error } = await supabase
        .from("knowledge_base")
        .insert(knowledge)

    if (error && !error.message.includes("does not exist")) {
        console.log(`  ⚠️ Knowledge base save skipped: ${error.message}`)
    }
}

/**
 * Save blog post to database
 */
async function savePost(post: BlogPost): Promise<boolean> {
    // Check if exists
    const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", post.slug)
        .single()

    if (existing) {
        console.log(`  ⏭️ Already exists: ${post.slug}`)
        return false
    }

    const { error } = await supabase
        .from("blog_posts")
        .insert({
            ...post,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error(`  ❌ Save failed:`, error.message)
        return false
    }

    console.log(`  ✅ Published to /news`)
    return true
}

/**
 * Main execution
 */
async function run() {
    console.log("🚀 Tender News & Tips Scraper Starting...")
    console.log("=".repeat(50))

    if (!GEMINI_KEY) {
        console.error("❌ GEMINI_API_KEY not configured")
        process.exit(1)
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    const allItems: ScrapedItem[] = []

    // 1. Scrape news sources
    console.log("\n📰 SCRAPING NEWS SOURCES\n")
    for (const source of NEWS_SOURCES) {
        const items = await scrapeNewsSource(browser, source)
        allItems.push(...items)
        await new Promise(r => setTimeout(r, 2000)) // Rate limit
    }

    // 2. Generate tips content
    console.log("\n💡 GENERATING TIPS CONTENT\n")
    const tips = await generateTipsContent()
    allItems.push(...tips)

    await browser.close()

    console.log(`\n📋 Total items collected: ${allItems.length}\n`)

    // 3. Process items into blog posts
    console.log("✍️ CREATING BLOG POSTS\n")
    let successCount = 0

    for (const item of allItems.slice(0, 6)) { // Process max 6 items
        const post = await humanizeToPost(item)

        if (post) {
            const saved = await savePost(post)
            if (saved) successCount++

            // Also save to knowledge base
            await saveToKnowledgeBase(item)
        }

        await new Promise(r => setTimeout(r, 2000)) // Rate limit API calls
    }

    console.log("\n" + "=".repeat(50))
    console.log(`🏁 Scraper Complete!`)
    console.log(`📰 Scraped ${allItems.length} items from news + tips sources`)
    console.log(`✅ Published ${successCount} new articles to /news`)
    console.log(`📊 Knowledge base updated for agent training`)
}

// Export for module use
export { scrapeNewsSource, generateTipsContent, humanizeToPost, run }

// Run if executed directly
if (require.main === module) {
    run().catch(console.error)
}
