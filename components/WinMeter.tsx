"use client"

import * as React from "react"

interface WinMeterProps {
    percentage: number // 0-100
    size?: number
    strokeWidth?: number
    className?: string
}

export function WinMeter({ percentage, size = 80, strokeWidth = 6, className }: WinMeterProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    // Color logic: Gray below 80%, Apple Blue at 90%+
    const getColor = () => {
        if (percentage >= 90) return "#007AFF" // Apple Blue (Win state)
        if (percentage >= 80) return "#34C759" // Green (Good)
        return "#8E8E93" // Gray (Needs work)
    }

    const color = getColor()

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s ease-in-out, stroke 0.3s ease" }}
                />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-lg font-bold"
                    style={{ color }}
                >
                    {percentage}%
                </span>
                {percentage >= 90 && (
                    <span className="text-[8px] uppercase tracking-widest text-white/50">WIN</span>
                )}
            </div>
        </div>
    )
}
