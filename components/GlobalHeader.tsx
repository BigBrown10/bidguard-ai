"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/Header"

export function GlobalHeader() {
    const pathname = usePathname()

    // Hide header on Auth pages and Onboarding (focused flow)
    const hiddenRoutes = ["/login", "/register", "/onboarding"]
    const isHidden = hiddenRoutes.some(route => pathname.startsWith(route))

    if (isHidden) return null

    return <Header />
}
