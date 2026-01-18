import Link from "next/link"


export function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-black" />
                    <span className="text-lg font-bold tracking-tight text-black">BidGuard AI</span>
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/dashboard" className="transition-colors hover:text-foreground">
                        Dashboard
                    </Link>
                    <Link href="/history" className="transition-colors hover:text-foreground">
                        Win History
                    </Link>
                    <Link href="/settings" className="transition-colors hover:text-foreground">
                        Settings
                    </Link>
                </nav>
                <div className="flex items-center gap-2">
                    {/* Placeholder for user profile or actions */}
                    <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200" />
                </div>
            </div>
        </header>
    )
}
