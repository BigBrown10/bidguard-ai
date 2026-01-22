import { z } from "zod"

export const IngestionSchema = z.object({
    projectName: z.string().min(3, "Project name must be at least 3 characters"),
    clientName: z.string().optional(),
    rfpText: z.string().optional(),
    rfpFile: z.any().optional(),
    knowledgeFile: z.any().optional(),
    knowledgeUrl: z.union([z.string().url(), z.literal("")]).optional(),
    companyContext: z.string().optional(),
    userStrategy: z.string().optional(),
}).refine(data => data.rfpFile?.size || (data.rfpText && data.rfpText.length > 10), {
    message: "Either upload an RFP document or paste the requirements text",
    path: ["rfpFile"],
}).refine(data => data.knowledgeFile || data.knowledgeUrl || (data.companyContext && data.companyContext.length > 50), {
    message: "Company Profile (PDF), Knowledge URL, or Company Description is required",
    path: ["knowledgeFile"],
})

export type IngestionFormData = z.infer<typeof IngestionSchema>

// V2: Structured Critique Output for Red Team Agent
export const CritiqueOutputSchema = z.object({
    score: z.number().min(0).max(10),
    complianceChecklist: z.array(z.object({
        item: z.string(),
        status: z.boolean()
    })),
    harshFeedback: z.array(z.string()),
    socialValuePresent: z.boolean(),
    wordCount: z.number()
})

export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>

// Banned words list for Humanizer
export const BANNED_WORDS = [
    "delve",
    "comprehensive",
    "tapestry",
    "pivotal",
    "unlock",
    "synergies",
    "synergy",
    "leverage",
    "holistic",
    "paradigm"
]

