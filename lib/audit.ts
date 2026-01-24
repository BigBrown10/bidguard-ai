import { supabaseAdmin } from '@/lib/supabase-admin'
import { AuditAction } from '@/lib/validation'

// ==========================================
// SECURITY: Audit Logging Utility
// Logs all sensitive actions for compliance
// ==========================================

interface AuditLogEntry {
    userId: string
    action: AuditAction
    resourceType: string
    resourceId?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
    if (!supabaseAdmin) {
        console.warn('[AUDIT] Supabase admin not configured, skipping audit log')
        return
    }

    try {
        const { error } = await supabaseAdmin.from('audit_logs').insert({
            user_id: entry.userId,
            action_type: entry.action,
            resource_type: entry.resourceType,
            resource_id: entry.resourceId,
            metadata: entry.metadata || {},
            ip_address: entry.ipAddress,
            user_agent: entry.userAgent,
        })

        if (error) {
            console.error('[AUDIT] Failed to log:', error.message)
        }
    } catch (e) {
        console.error('[AUDIT] Exception:', e)
    }
}

// Convenience wrappers for common actions
export const audit = {
    proposalCreated: (userId: string, proposalId: string, tenderTitle: string) =>
        logAuditEvent({
            userId,
            action: 'proposal.created',
            resourceType: 'proposal',
            resourceId: proposalId,
            metadata: { tenderTitle }
        }),

    proposalCompleted: (userId: string, proposalId: string, score?: number) =>
        logAuditEvent({
            userId,
            action: 'proposal.completed',
            resourceType: 'proposal',
            resourceId: proposalId,
            metadata: { score }
        }),

    proposalExported: (userId: string, proposalId: string, format: string) =>
        logAuditEvent({
            userId,
            action: 'proposal.exported',
            resourceType: 'proposal',
            resourceId: proposalId,
            metadata: { format }
        }),

    profileUpdated: (userId: string, fields: string[]) =>
        logAuditEvent({
            userId,
            action: 'profile.updated',
            resourceType: 'profile',
            resourceId: userId,
            metadata: { updatedFields: fields }
        }),

    tenderSaved: (userId: string, tenderId: string, tenderTitle: string) =>
        logAuditEvent({
            userId,
            action: 'tender.saved',
            resourceType: 'tender',
            resourceId: tenderId,
            metadata: { tenderTitle }
        }),
}
