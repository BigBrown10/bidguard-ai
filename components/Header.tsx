import Link from "next/link"


export function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <img
                        src="/logo-b.png"
                        alt="B"
                        className="h-10 w-auto object-contain mix-blend-screen hover:brightness-125 transition-all"
                    />
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
                    <Link href="/dashboard" className="transition-colors hover:text-white hover:text-glow">
                        Dashboard
                    </Link>
                    <Link href="/history" className="transition-colors hover:text-white hover:text-glow">
                        Win History
                    </Link>
                    <Link href="/settings" className="transition-colors hover:text-white hover:text-glow">
                        Settings
                    </Link>
                </nav>
                <div className="flex items-center gap-2">
                    {/* Placeholder for user profile or actions */}
                    <div className="h-8 w-8 rounded-full bg-white/10 border border-white/10" />
                </div>
            </div>
        </header>
    )
}
