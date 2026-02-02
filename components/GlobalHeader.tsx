"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/Header"

export function GlobalHeader() {
    const pathname = usePathname()

    // Hide header on Auth pages, Onboarding, and Admin (has its own header)
    const hiddenRoutes = ["/login", "/register", "/onboarding", "/admin"]
    const isHidden = hiddenRoutes.some(route => pathname.startsWith(route))

    if (isHidden) return null

    return <Header />
}
