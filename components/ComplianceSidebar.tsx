"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

export type ComplianceItem = {
    id: string
    label: string
    checked: boolean
}

interface ComplianceSidebarProps {
    items: ComplianceItem[]
    className?: string
}

const DEFAULT_ITEMS: ComplianceItem[] = [
    { id: "social_value", label: "Social Value", checked: false },
    { id: "carbon_reduction", label: "Carbon Reduction Plan", checked: false },
    { id: "iso", label: "ISO 9001/27001", checked: false },
    { id: "modern_slavery", label: "Modern Slavery Statement", checked: false }
]

export function ComplianceSidebar({ items = DEFAULT_ITEMS, className }: ComplianceSidebarProps) {
    const checkedCount = items.filter(i => i.checked).length
    const totalCount = items.length
    const allChecked = checkedCount === totalCount

    return (
        <div className={`glass-panel p-4 rounded-2xl ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-widest text-white/50 font-bold">
                    UK Compliance
                </h4>
                <span className={`text-xs font-bold ${allChecked ? 'text-green-400' : 'text-white/50'}`}>
                    {checkedCount}/{totalCount}
                </span>
            </div>

            <ul className="space-y-3">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className={`flex items-center gap-3 text-sm transition-colors ${item.checked ? 'text-white' : 'text-white/40'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${item.checked
                                ? 'bg-green-500 border-green-500'
                                : 'border-white/20 bg-transparent'
                            }`}>
                            {item.checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>

            {allChecked && (
                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                    <span className="text-green-400 text-xs uppercase tracking-widest font-bold">
                        ✓ Fully Compliant
                    </span>
                </div>
            )}
        </div>
    )
}
