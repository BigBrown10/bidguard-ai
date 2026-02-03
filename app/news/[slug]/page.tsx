"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Clock, Tag, Share2, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"

interface BlogPost {
    id: string
    slug: string
    title: string
    excerpt: string
    content: string
    category: string
    featured: boolean
    seo_keywords: string[]
    read_time: string
    medium_url?: string
    substack_url?: string
    created_at: string
}

export default function BlogPostPage() {
    const params = useParams()
    const slug = params.slug as string

    const [post, setPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (slug) {
            fetchPost()
        }
    }, [slug])

    const fetchPost = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/blog/posts/${slug}`)
            const data = await res.json()

            if (data.error) {
                setError(data.error)
            } else {
                setPost(data.post)
            }
        } catch {
            setError("Failed to load article")
        } finally {
            setLoading(false)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: post?.title,
                text: post?.excerpt,
                url: window.location.href
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Article Not Found</h1>
                <p className="text-white/60">This article may have been moved or deleted.</p>
                <Link href="/news" className="px-4 py-2 bg-primary text-black rounded-lg font-medium">
                    Back to News
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <main className="container mx-auto max-w-4xl px-6 py-12">
                {/* Back Link */}
                <Link
                    href="/news"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-primary transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to News
                </Link>

                {/* Article Header */}
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                            {post.category}
                        </span>
                        {post.featured && (
                            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                                Featured
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                        {post.title}
                    </h1>

                    <p className="text-xl text-white/60 mb-6">
                        {post.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {post.read_time} read
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>

                    {/* External links */}
                    {(post.medium_url || post.substack_url) && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                            {post.medium_url && (
                                <a
                                    href={post.medium_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-white/60 hover:text-primary"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Read on Medium
                                </a>
                            )}
                            {post.substack_url && (
                                <a
                                    href={post.substack_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-white/60 hover:text-primary"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Read on Substack
                                </a>
                            )}
                        </div>
                    )}
                </motion.header>

                {/* Article Content */}
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-invert prose-lg max-w-none"
                >
                    <div className="
                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-10 [&>h2]:mb-4
                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-3
                        [&>p]:text-white/80 [&>p]:leading-relaxed [&>p]:mb-4
                        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:text-white/70 [&>ul>li]:mb-2
                        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:text-white/70 [&>ol>li]:mb-2
                        [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-white/60
                        [&>code]:bg-white/10 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded
                        [&>a]:text-primary [&>a]:underline
                    ">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                </motion.article>

                {/* Keywords/Tags */}
                {post.seo_keywords && post.seo_keywords.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-2 text-white/40 mb-4">
                            <Tag className="w-4 h-4" />
                            <span className="text-sm">Topics</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {post.seo_keywords.map((keyword, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-white/5 text-white/60 rounded-lg text-sm"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl text-center">
                    <Image src="/logo.png" alt="BidSwipe" width={48} height={48} className="mx-auto rounded-xl mb-4" />
                    <h3 className="text-xl font-bold mb-2">Ready to Win More Bids?</h3>
                    <p className="text-white/60 mb-6">
                        Let our AI write winning proposals for you in minutes, not days.
                    </p>
                    <Link
                        href="/register"
                        className="inline-block px-8 py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Start Free Trial
                    </Link>
                </div>
            </main>
        </div>
    )
}
