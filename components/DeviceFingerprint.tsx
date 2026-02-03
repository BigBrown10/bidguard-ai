"use client"

import { useEffect, useState } from "react"

export function DeviceFingerprint({ setDeviceId }: { setDeviceId: (id: string) => void }) {
    useEffect(() => {
        const generateFingerprint = async () => {
            // Simple fingerprinting logic
            const { userAgent, language, hardwareConcurrency, deviceMemory } = navigator as any
            const { width, height, colorDepth, pixelDepth } = window.screen
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

            // Create a string from stable browser traits
            const raw = [
                userAgent,
                language,
                hardwareConcurrency,
                deviceMemory,
                width,
                height,
                colorDepth,
                pixelDepth,
                timezone
            ].join('|')

            // Hash it (using simple string hash for speed, or Web Crypto for better collision resistance)
            const msgBuffer = new TextEncoder().encode(raw)
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

            setDeviceId(hash)
        }

        generateFingerprint()
    }, [setDeviceId])

    return null
}
