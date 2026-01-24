import { z } from 'zod'

// ==========================================
// SECURITY: Zod Validation Schemas
// All database writes MUST be validated
// ==========================================

// Profile schema
export const profileSchema = z.object({
    company_name: z.string().min(1).max(200),
    business_description: z.string().max(5000).optional(),
    website: z.string().url().optional().or(z.literal('')),
    sectors: z.array(z.string()).max(20).optional(),
    company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

// Proposal start schema
export const proposalStartSchema = z.object({
    tenderId: z.string().min(1).max(100),
    tenderTitle: z.string().min(1).max(500),
    tenderBuyer: z.string().max(200).optional(),
    ideaInjection: z.string().max(5000).optional(),
})

export type ProposalStartInput = z.infer<typeof proposalStartSchema>

// Saved tender schema
export const savedTenderSchema = z.object({
    tender_id: z.string().min(1).max(100),
    tender_data: z.object({
        id: z.string(),
        title: z.string(),
        buyer: z.string().optional(),
        description: z.string().optional(),
        value: z.string().optional(),
        deadline: z.string().optional(),
        sector: z.string().optional(),
        location: z.string().optional(),
    }),
})

export type SavedTenderInput = z.infer<typeof savedTenderSchema>

// Audit log action types
export const auditActionSchema = z.enum([
    'proposal.created',
    'proposal.completed',
    'proposal.exported',
    'proposal.deleted',
    'profile.updated',
    'tender.saved',
    'tender.rejected',
    'auth.login',
    'auth.logout',
])

export type AuditAction = z.infer<typeof auditActionSchema>

// Validator helper
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data)
    if (!result.success) {
        throw new Error(`Validation failed: ${result.error.message}`)
    }
    return result.data
}
