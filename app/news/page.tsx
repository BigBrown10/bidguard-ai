"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Newspaper, TrendingUp, Lightbulb, BookOpen,
    Calendar, ChevronRight, Sparkles, Loader2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface BlogPost {
    id: string
    slug: string
    title: string
    excerpt: string
    category: string
    featured: boolean
    read_time: string
    created_at: string
}

// Fallback static data for when DB is empty
const fallbackPosts: BlogPost[] = [
    {
        id: "1",
        slug: "how-to-win-nhs-tenders",
        category: "Strategy",
        title: "How to Win NHS Tenders: 5 Key Strategies",
        excerpt: "Social value and evidence-based responses are critical. Learn what evaluators actually look for in healthcare bids.",
        created_at: "2026-01-30",
        read_time: "4 min",
        featured: true,
    },
    {
        id: "2",
        slug: "ppn-06-21-carbon-reduction-plans",
        category: "Compliance",
        title: "PPN 06/21: Carbon Reduction Plans Explained",
        excerpt: "All UK government contracts over £5m now require Carbon Reduction Plans. Here's what you need to include.",
        created_at: "2026-01-28",
        read_time: "6 min",
        featured: true,
    },
    {
        id: "3",
        slug: "avoiding-common-bid-mistakes",
        category: "Tips",
        title: "Avoiding Common Bid Mistakes",
        excerpt: "From vague claims to missing evidence - the top 10 reasons bids get rejected and how to avoid them.",
        created_at: "2026-01-25",
        read_time: "5 min",
        featured: false,
    },
    {
        id: "4",
        slug: "procurement-reform-update-2026",
        category: "News",
        title: "Procurement Reform Update 2026",
        excerpt: "The Procurement Act brings major changes to public sector bidding. What contractors need to know.",
        created_at: "2026-01-22",
        read_time: "7 min",
        featured: false,
    },
    {
        id: "5",
        slug: "writing-social-value-responses",
        category: "Strategy",
        title: "Writing Social Value Responses That Win",
        excerpt: "Social value now accounts for 10-30% of most evaluations. Learn how to maximize your scores.",
        created_at: "2026-01-20",
        read_time: "5 min",
        featured: false,
    },
    {
        id: "6",
        slug: "evidence-that-evaluators-love",
        category: "Tips",
        title: "Evidence That Evaluators Love",
        excerpt: "Case studies, metrics, and testimonials - structuring evidence that proves your capability.",
        created_at: "2026-01-18",
        read_time: "4 min",
        featured: false,
    },
]

const categories = [
    { id: "all", label: "All", icon: Newspaper },
    { id: "Strategy", label: "Strategy", icon: TrendingUp },
    { id: "Tips", label: "Tips", icon: Lightbulb },
    { id: "Compliance", label: "Compliance", icon: BookOpen },
    { id: "News", label: "News", icon: Calendar },
]

export default function NewsPage() {
    const [activeCategory, setActiveCategory] = useState("all")
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPosts()
    }, [activeCategory])

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (activeCategory !== "all") params.set("category", activeCategory)

            const res = await fetch(`/api/blog/posts?${params}`)
            const data = await res.json()

            if (data.posts && data.posts.length > 0) {
                setPosts(data.posts)
            } else {
                // Use fallback if database is empty
                setPosts(fallbackPosts.filter(p =>
                    activeCategory === "all" || p.category === activeCategory
                ))
            }
        } catch {
            // Use fallback on error
            setPosts(fallbackPosts.filter(p =>
                activeCategory === "all" || p.category === activeCategory
            ))
        } finally {
            setLoading(false)
        }
    }

    const featuredPosts = posts.filter(item => item.featured)
    const regularPosts = posts.filter(item => !item.featured)

    return (
        <div className="min-h-screen bg-black text-white">
            <main className="container mx-auto max-w-6xl px-6 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Image
                            src="/logo.png"
                            alt="BidSwipe"
                            width={40}
                            height={40}
                            className="rounded-lg"
                        />
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            CONTRACT INTELLIGENCE
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        Bid <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Insights</span>
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Expert tips, compliance updates, and winning strategies for UK public sector tenders.
                    </p>
                </div>

                {/* Featured */}
                {!loading && featuredPosts.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {featuredPosts.slice(0, 2).map((item, index) => (
                            <motion.article
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={`/news/${item.slug}`} className="block">
                                    <div className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-all cursor-pointer h-full">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-4">
                                            {item.category}
                                        </span>
                                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h2>
                                        <p className="text-white/60 mb-4 line-clamp-2">{item.excerpt}</p>
                                        <div className="flex items-center justify-between text-sm text-white/40">
                                            <span>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="flex items-center gap-1">
                                                {item.read_time} read <ChevronRight className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                )}

                {/* Category Filters */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat.id
                                ? "bg-primary text-black"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {/* News List */}
                {!loading && (
                    <div className="space-y-4">
                        {(regularPosts.length > 0 ? regularPosts : posts).map((item, index) => (
                            <motion.article
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/news/${item.slug}`} className="block">
                                    <div className="group flex items-center gap-6 bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-white/20 hover:bg-white/[0.05] transition-all cursor-pointer">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                            {item.category === "Strategy" && <TrendingUp className="w-5 h-5 text-primary" />}
                                            {item.category === "Tips" && <Lightbulb className="w-5 h-5 text-yellow-400" />}
                                            {item.category === "Compliance" && <BookOpen className="w-5 h-5 text-green-400" />}
                                            {item.category === "News" && <Newspaper className="w-5 h-5 text-blue-400" />}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xs text-primary font-medium">{item.category}</span>
                                                <span className="text-xs text-white/30">{item.read_time}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-white/50 truncate">{item.excerpt}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors flex-shrink-0" />
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl">
                        <Image src="/logo.png" alt="BidSwipe" width={48} height={48} className="rounded-xl" />
                        <h3 className="text-xl font-bold">Want Personalized Bid Intelligence?</h3>
                        <p className="text-white/60 max-w-md">
                            Our AI analyzes your company profile and matches you with relevant tender opportunities.
                        </p>
                        <a
                            href="/tenders"
                            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Find Tenders
                        </a>
                    </div>
                </div>
            </main>
        </div>
    )
}
