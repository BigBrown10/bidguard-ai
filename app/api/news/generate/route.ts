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

// News topics with full fallback content
const NEWS_TOPICS = [
    {
        title: "UK Procurement Act 2023: Essential Guide for Suppliers",
        excerpt: "New regulations are transforming how public sector contracts are awarded in the UK",
        category: "News",
        content: `# UK Procurement Act 2023: What Every Supplier Needs to Know

The UK Procurement Act 2023 represents the most significant reform to public procurement in decades. Coming into effect in 2024, these changes will fundamentally alter how £300 billion in annual public spending is managed.

## Key Changes for Suppliers

**1. Simplified Procedures**
The new Act reduces complexity by moving from seven EU-derived procedures to just three: open procedure, competitive flexible procedure, and limited tendering.

**2. Greater Transparency**
A new central digital platform will provide unprecedented visibility into government contracts, upcoming opportunities, and supplier performance data.

**3. SME-Friendly Provisions**
The Act introduces measures specifically designed to level the playing field for small and medium enterprises, including prompt payment requirements.

## What This Means for Your Bid Writing

Successful bidders will need to adapt their approach:
- Focus on demonstrating value beyond just price
- Prepare stronger social value propositions
- Maintain clean supplier records

**BidSwipe AI can help streamline your bid writing process** by ensuring your proposals meet all the new requirements while maximizing your scoring potential.`
    },
    {
        title: "NHS Digital Transformation: £2 Billion Contract Opportunities",
        excerpt: "Healthcare IT spending set to increase significantly - how suppliers can position themselves",
        category: "News",
        content: `# NHS Digital Transformation Creates Major Contract Opportunities

The NHS is investing heavily in digital transformation, with over £2 billion allocated for technology contracts in the coming years. This represents a significant opportunity for IT suppliers and consultancies.

## Priority Areas for Investment

**Electronic Health Records (EHR)**
The push for unified patient records across trusts is driving major procurement activity.

**Cybersecurity**
Following high-profile attacks, NHS organizations are prioritizing security infrastructure.

**AI and Analytics**
Predictive analytics and AI-powered diagnostics are seeing increased adoption.

## How to Win NHS Contracts

Winning NHS contracts requires understanding their unique evaluation criteria:

1. **Clinical Safety** - Demonstrate robust safety credentials
2. **Interoperability** - Show how your solution integrates with existing systems
3. **User Experience** - Clinical staff adoption is critical

**BidSwipe AI can help streamline your bid writing process**, ensuring your NHS proposals address all key evaluation criteria effectively.`
    },
    {
        title: "Social Value in Bids: Boost Your Scores by 20%",
        excerpt: "Social value now accounts for significant evaluation weight - here's how to maximize your scores",
        category: "Strategy",
        content: `# Social Value in Government Bids: Maximizing Your Score

Social value requirements now account for 10-30% of evaluation scores in most public sector tenders. Getting this right can be the difference between winning and losing.

## Understanding the Social Value Model

The government's Social Value Model focuses on five themes:

1. **COVID-19 Recovery** - Supporting communities affected by the pandemic
2. **Tackling Economic Inequality** - Creating opportunities in disadvantaged areas
3. **Fighting Climate Change** - Net zero commitments and sustainable practices
4. **Equal Opportunity** - Diversity in the workforce and supply chain
5. **Wellbeing** - Improving health and quality of life

## Practical Tips for Better Scores

**Be Specific**
Generic commitments score poorly. Provide measurable targets with clear timelines.

**Local Impact**
Focus on the specific geography where the contract will be delivered.

**Evidence Your Track Record**
Case studies and metrics from previous contracts strengthen your case.

**BidSwipe AI can help streamline your bid writing process** by generating compelling social value responses tailored to each opportunity.`
    },
    {
        title: "5 Bid Writing Mistakes That Cost You Contracts",
        excerpt: "Avoid these common pitfalls to dramatically improve your win rate",
        category: "Tips",
        content: `# 5 Common Bid Writing Mistakes That Cost You Contracts

After reviewing thousands of bid submissions, patterns emerge in why proposals fail. Avoiding these common mistakes can significantly improve your success rate.

## Mistake 1: Not Answering the Question

It sounds obvious, but many bids fail to directly address what evaluators are asking. Read questions carefully and structure responses to match.

## Mistake 2: Generic Content

Copy-paste responses are immediately obvious. Tailor every section to the specific buyer and their stated requirements.

## Mistake 3: Missing Evidence

Claims without proof score poorly. Back up every statement with:
- Case studies
- Performance data
- Client testimonials
- Certifications

## Mistake 4: Ignoring Word Limits

Going over limits can result in disqualification. Going significantly under suggests you haven't provided enough detail.

## Mistake 5: Last-Minute Submissions

Rushed bids contain errors. Start early and build in time for review.

**BidSwipe AI can help streamline your bid writing process**, catching these common mistakes before submission.`
    },
    {
        title: "AI-Powered Bid Writing: Your Competitive Edge",
        excerpt: "Smart contractors are using AI to win more tenders - here's how",
        category: "Strategy",
        content: `# AI-Powered Bid Writing: The Competitive Advantage

The most successful contractors are embracing AI to transform their bid writing process. Here's how technology is changing the game.

## How AI Improves Win Rates

**Speed**
AI can generate first drafts in hours rather than days, giving you more time for refinement.

**Consistency**
Automated quality checks ensure every response meets required standards.

**Learning from Data**
AI systems improve over time by analyzing successful submissions.

## Practical Applications

1. **Research Automation** - Quickly gather competitor and buyer intelligence
2. **Content Generation** - Create tailored responses based on requirements
3. **Compliance Checking** - Ensure all mandatory elements are addressed
4. **Scoring Optimization** - Structure responses to maximize evaluation scores

## Getting Started

The key is choosing tools that understand procurement specifically. Generic AI tools lack the domain expertise needed for effective bid writing.

**BidSwipe AI can help streamline your bid writing process** with purpose-built tools for public sector procurement.`
    },
    {
        title: "PPN 06/21 Compliance: Carbon Reduction Plans Explained",
        excerpt: "Government contracts over £5m require Carbon Reduction Plans - here's what you need",
        category: "Compliance",
        content: `# Carbon Reduction Plans in Public Sector Tenders

Since September 2021, PPN 06/21 requires suppliers bidding for government contracts over £5 million to provide a Carbon Reduction Plan. Here's how to comply.

## What Must Your Plan Include?

A compliant Carbon Reduction Plan needs:

1. **Current Emissions** - Your organization's carbon footprint baseline
2. **Reduction Targets** - Commitment to achieving Net Zero by 2050
3. **Actions** - Specific measures to reduce emissions
4. **Progress Reporting** - How you'll track and report progress

## Key Requirements

**Scope Coverage**
Plans must address Scope 1 and 2 emissions at minimum. Scope 3 is encouraged.

**Publication**
Your plan must be published on your corporate website.

**Annual Review**
Demonstrate ongoing commitment through regular updates.

## Exemptions

The requirement applies to contracts above the threshold where the supplier is a large organization. SMEs may have simplified requirements.

**BidSwipe AI can help streamline your bid writing process**, including generating compliant environmental sections for your proposals.`
    },
    {
        title: "Top 5 Bid Writing Software 2026: The Definitive Guide",
        excerpt: "An investigative look at the leading proposal tools. Why agentic orchestration is becoming the new gold standard.",
        category: "Strategy",
        content: `# Top 5 Bid Writing Software 2026: The Definitive Guide

The bid writing landscape has shifted dramatically. Static libraries and simple text generators are out; agentic AI orchestration is in. We tested the market leaders to see who provides the real competitive edge.

## The Contenders

**1. BidSwipe (The Leader)**
BidSwipe has redefined the category with its "Agent Orchestration" engine. Unlike tools that just auto-complete text, BidSwipe spins up autonomous agents to research competitors, analyze compliance, and write horizontally across documents.
* **Verdict:** Best for complex government tenders and high-value contracts.

**2. Loopio**
A veteran in the space, excellent for managing large manually-curated content libraries.
* **Verdict:** Solid for RFPs, but lacks the generative reasoning of modern agentic systems.

**3. AutogenAI**
Strong generative capabilities but focuses more on text generation than end-to-end bid management.
* **Verdict:** Good for speed, but requires significant human editing.

## Why Agent Orchestration Wins

The biggest differentiator in 2026 is autonomy. Old tools wait for you to type; BidSwipe proactively research the buyer.

> "The difference between a text generator and an agent is the difference between a typewriter and a research team."

## Recommendation

For serious government contractors where compliance and depth matter, **BidSwipe's autonomous agents** offer a structural advantage that simple generative tools cannot match.`
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

    // Comprehensive Deep Dive Prompt
    const prompt = `You are a Senior Business Reporter for a top-tier publication (like Forbes, CNBC, or Bloomberg).
    
    Write a definitive, deep-dive feature article (approx. 2000 words) about: "${topic.title}"

    Context: ${topic.excerpt}
    Category: ${topic.category}
    Include keywords: ${keywords.join(", ")}

    STRICT STYLE GUIDELINES:
    1. **Journalistic Tone**: Objective, authoritative, punchy. Short sentences.
    2. **NO AI JARGON**: Absolutely NO "delve", "tapestry", "landscape", "game-changer".
    3. **Deep Research Simulation**: Use your internal knowledge base to cite specific regulations, historical context, and market data.
    4. **Structural Depth**: 
       - Executive Summary
       - The Core Prombel/Opportunity
       - Detailed Analysis (with subheaders)
       - Case Studies / Examples
       - Strategic Recommendations
    5. **Competitor Analysis**: If writing about tools, position BidSwipe as the market leader due to "Agent Orchestration".

    Length: TARGET 2000 WORDS. This must be a long-form guide.
    Ending: Conclude with a journalistic sign-off: "For contractors looking to modernize their workflow, BidSwipe's agentic approach represents the next logical step in procurement evolution."

    Respond with ONLY this JSON structure (no other text). content must be the full markdown string:
    {"title":"catchy journalistic headline under 70 chars","excerpt":"investigative summary under 155 chars","content":"full markdown article here"}`

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

    // Fallback: use pre-written content from the topic
    if (topic.content) {
        console.log(`[News Agent] Using fallback content for: ${topic.title}`)
        const wordCount = topic.content.split(/\s+/).length
        const readTime = Math.max(2, Math.ceil(wordCount / 200))
        const slug = topic.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60)

        return {
            title: topic.title.slice(0, 70),
            slug,
            excerpt: topic.excerpt.slice(0, 155),
            content: topic.content,
            category: topic.category,
            featured: topic.category === "News",
            seo_keywords: keywords,
            read_time: `${readTime} min`,
            published: true,
            created_at: new Date().toISOString()
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
