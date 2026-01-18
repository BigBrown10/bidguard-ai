import { z } from "zod"

export const IngestionSchema = z.object({
    projectName: z.string().min(3, "Project name must be at least 3 characters"),
    clientName: z.string().optional(),
    rfpFile: z.any()
        .refine((file) => file?.size, "RFP Document is required")
        .refine((file) => file?.size, "RFP Document is required"),
    knowledgeFile: z.any().optional(),
    knowledgeUrl: z.string().url().optional(),
}).refine(data => data.knowledgeFile || data.knowledgeUrl, {
    message: "Either Company Profile (PDF) or Knowledge URL is required",
    path: ["knowledgeFile"],
})

export type IngestionFormData = z.infer<typeof IngestionSchema>
