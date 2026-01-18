"use client"

import * as React from "react"
import { UploadCloud, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
    label: string
    accept?: string
    onChange: (file: File | null) => void
    value?: File | null
    error?: string
}

export function FileUpload({ label, accept = ".pdf", onChange, value, error }: FileUploadProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onChange(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0])
        }
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-10 transition-all hover:bg-muted/10",
                    isDragging && "border-primary bg-primary/5",
                    error && "border-red-500 bg-red-50",
                    value && "border-solid border-primary/20 bg-primary/5 p-6"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleChange}
                />

                {value ? (
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">{value.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(value.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(null)
                            }}
                            className="rounded-full p-1 hover:bg-black/5"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="rounded-full bg-background p-4 shadow-sm">
                            <UploadCloud className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PDF only (max 10MB)</p>
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>
    )
}
