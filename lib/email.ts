import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ProposalCompleteEmailProps {
    to: string;
    userName: string;
    proposalTitle: string;
    proposalId: string;
    score: number;
}

export async function sendProposalCompleteEmail({
    to,
    userName,
    proposalTitle,
    proposalId,
    score
}: ProposalCompleteEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.log('[Email] RESEND_API_KEY not set, skipping email');
        return null;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'BidGuard <noreply@bidguard.ai>',
            to: [to],
            subject: `✅ Your proposal for "${proposalTitle}" is ready!`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; overflow: hidden; border: 1px solid #222; }
        .header { background: linear-gradient(135deg, #00ffaa 0%, #00cc88 100%); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #000; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 32px; }
        .score-badge { display: inline-block; background: #00ffaa20; color: #00ffaa; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
        .proposal-title { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .cta-button { display: inline-block; background: #00ffaa; color: #000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; }
        .footer { padding: 24px 32px; border-top: 1px solid #222; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Proposal Complete</h1>
        </div>
        <div class="content">
            <p>Hey ${userName || 'there'},</p>
            <p>Great news! Your autonomous bid proposal has been generated and is ready for review.</p>
            
            <div class="score-badge">Score: ${score.toFixed(1)}/10</div>
            
            <div class="proposal-title">${proposalTitle}</div>
            <p style="color: #888; font-size: 14px;">The AI has researched, strategized, drafted, critiqued, and humanized your proposal.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bidguard.ai'}/war-room?id=${proposalId}" class="cta-button">
                Review & Edit Proposal
            </a>
        </div>
        <div class="footer">
            <p>This email was sent by BidGuard AI. You received this because you initiated a proposal generation.</p>
        </div>
    </div>
</body>
</html>
            `
        });

        if (error) {
            console.error('[Email] Failed to send:', error);
            return null;
        }

        console.log('[Email] Sent successfully:', data?.id);
        return data;
    } catch (error) {
        console.error('[Email] Error:', error);
        return null;
    }
}

interface ProposalFailedEmailProps {
    to: string;
    userName: string;
    proposalTitle: string;
    errorMessage?: string;
}

export async function sendProposalFailedEmail({
    to,
    userName,
    proposalTitle,
    errorMessage
}: ProposalFailedEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.log('[Email] RESEND_API_KEY not set, skipping email');
        return null;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'BidGuard <noreply@bidguard.ai>',
            to: [to],
            subject: `⚠️ Proposal generation issue - "${proposalTitle}"`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; overflow: hidden; border: 1px solid #222; }
        .header { background: linear-gradient(135deg, #ff4444 0%, #cc2222 100%); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 32px; }
        .error-box { background: #ff444420; border: 1px solid #ff444440; padding: 16px; border-radius: 8px; color: #ff8888; font-size: 14px; margin: 16px 0; }
        .cta-button { display: inline-block; background: #fff; color: #000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; }
        .footer { padding: 24px 32px; border-top: 1px solid #222; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Generation Issue</h1>
        </div>
        <div class="content">
            <p>Hey ${userName || 'there'},</p>
            <p>We encountered an issue while generating your proposal for:</p>
            <p style="font-size: 18px; font-weight: 600; color: #fff;">${proposalTitle}</p>
            
            ${errorMessage ? `<div class="error-box">${errorMessage}</div>` : ''}
            
            <p>You can retry from your dashboard.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bidguard.ai'}/dashboard" class="cta-button">
                Go to Dashboard
            </a>
        </div>
        <div class="footer">
            <p>This email was sent by BidGuard AI.</p>
        </div>
    </div>
</body>
</html>
            `
        });

        if (error) {
            console.error('[Email] Failed to send:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('[Email] Error:', error);
        return null;
    }
}
