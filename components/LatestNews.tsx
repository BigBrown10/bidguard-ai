"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Calendar, Clock, Newspaper } from "lucide-react"

interface BlogPost {
    id: string
    slug: string
    title: string
    excerpt: string
    category: string
    read_time: string
    created_at: string
}

export function LatestNews() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch only 3 latest posts
                const res = await fetch("/api/blog/posts?limit=3")
                const data = await res.json()
                if (data.posts) {
                    setPosts(data.posts.slice(0, 3))
                }
            } catch (error) {
                console.error("Failed to fetch news", error)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    if (!loading && posts.length === 0) return null

    return (
        <section className="py-24 bg-black relative border-t border-white/10">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-4">
                            Latest Intelligence
                        </h2>
                        <p className="text-white/60 text-lg max-w-xl">
                            Strategic insights, procurement updates, and industry analysis.
                        </p>
                    </div>
                    <Link
                        href="/news"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group"
                    >
                        View all articles
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {loading ? (
                        // Skeletons
                        [1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 h-[300px] animate-pulse">
                                <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
                                <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
                                <div className="h-4 bg-white/10 rounded w-full mb-2" />
                                <div className="h-4 bg-white/10 rounded w-2/3" />
                            </div>
                        ))
                    ) : (
                        posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    href={`/news/${post.slug}`}
                                    className="block h-full bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3 text-xs text-blue-400 mb-4 font-mono uppercase tracking-wider">
                                        <span className="bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                                            {post.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-white/40">
                                            <Clock className="w-3 h-3" />
                                            {post.read_time}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-white/60 text-sm line-clamp-3 mb-6">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center text-sm text-white/40 group-hover:text-white transition-colors mt-auto">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </section>
    )
}
