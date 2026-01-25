import { Resend } from 'resend';

// Lazy-load Resend client to avoid build-time API key requirement
let resend: Resend | null = null;
const FROM_DOMAIN = process.env.EMAIL_FROM_DOMAIN || 'bidswipe.xyz';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'BidSwipe';

function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

const BRAND_COLOR = '#007AFF'; // Apple Blue from globals.css
const BG_COLOR = '#000000';
const CARD_COLOR = '#111111';
const TEXT_COLOR = '#FFFFFF';
const TEXT_MUTED = '#8E8E93';

const BASE_STYLES = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${BG_COLOR}; color: ${TEXT_COLOR}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: ${CARD_COLOR}; border-radius: 20px; overflow: hidden; border: 1px solid #222; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(180deg, rgba(0,122,255,0.1) 0%, rgba(0,0,0,0) 100%); padding: 40px; text-align: center; border-bottom: 1px solid #222; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0; color: #fff; }
    .logo span { color: ${BRAND_COLOR}; text-shadow: 0 0 10px rgba(0,122,255,0.5); }
    .content { padding: 40px; line-height: 1.6; font-size: 16px; color: #ddd; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; text-align: center; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,122,255,0.3); }
    .footer { padding: 30px; text-align: center; font-size: 12px; color: ${TEXT_MUTED}; border-top: 1px solid #222; background: #050505; }
    h1 { color: #fff; font-size: 24px; margin-bottom: 10px; letter-spacing: -0.5px; }
    h2 { color: #fff; font-size: 20px; margin-top: 0; }
    .stat-box { background: #1a1a1a; padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #333; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${TEXT_MUTED}; margin-bottom: 5px; }
    .value { font-size: 18px; font-weight: 700; color: #fff; }
    .highlight { color: ${BRAND_COLOR}; }
`;

function wrapHtml(title: string, content: string, actionUrl?: string, actionText?: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${BASE_STYLES}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Bid<span>Swipe</span></div>
            </div>
            <div class="content">
                <h1>${title}</h1>
                ${content}
                ${actionUrl ? `<div style="text-align: center;"><a href="${actionUrl}" class="btn">${actionText}</a></div>` : ''}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} BidSwipe AI. All rights reserved.</p>
                <p>London, UK</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 1. WELCOME EMAIL
export async function sendWelcomeEmail(email: string, name: string) {
    const client = getResendClient();
    if (!client) return;

    try {
        await client.emails.send({
            from: `${FROM_NAME} <welcome@${FROM_DOMAIN}>`,
            to: email,
            subject: 'Welcome to the Future of Bidding ⚡',
            html: wrapHtml(
                `Ready to Win, ${name}?`,
                `
                <p>Welcome to <strong>BidSwipe</strong>. You've joined the elite circle of government contractors using AI to reverse-engineer victory.</p>
                <p>Your War Room is ready. Here's what you can do:</p>
                <ul>
                    <li>🕵️ <strong>Spy</strong> on competitors (Winner's Analyst)</li>
                    <li>⚡ <strong>Generate</strong> 1,500-word bids in minutes</li>
                    <li>🛡️ <strong>Verify</strong> every claim with Truth Sentinel</li>
                </ul>
                <p>Let's secure your first contract.</p>
                `,
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                "Enter War Room"
            )
        });
    } catch (e) {
        console.error('Welcome email failed:', e);
    }
}

// 2. VERIFICATION EMAIL
export async function sendVerificationEmail(email: string, link: string) {
    const client = getResendClient();
    if (!client) return;

    try {
        await client.emails.send({
            from: `${FROM_NAME} Security <security@${FROM_DOMAIN}>`,
            to: email,
            subject: 'Verify your Identity 🔐',
            html: wrapHtml(
                "Verify your Access",
                `
                <p>We received a signup request for BidSwipe AI.</p>
                <p>To access the Intelligence Terminal, please verify your email address below.</p>
                <p style="font-size: 14px; color: #888;">This link expires in 24 hours.</p>
                `,
                link,
                "Verify Email"
            )
        });
    } catch (e) {
        console.error('Verification email failed:', e);
    }
}

// 3. TENDER ALERT
export async function sendNewTenderAlertEmail({
    to,
    tenderTitle,
    tenderValue,
    tenderBuyer,
    description,
    matchScore
}: {
    to: string;
    tenderTitle: string;
    tenderValue: string;
    tenderBuyer: string;
    description: string;
    matchScore: number;
}) {
    const client = getResendClient();
    if (!client) return null;

    try {
        const { data } = await client.emails.send({
            from: `${FROM_NAME} Intel <alerts@${FROM_DOMAIN}>`,
            to: [to],
            subject: `🚨 ${matchScore}% Match: ${tenderTitle.substring(0, 30)}...`,
            html: wrapHtml(
                "Strategic Opportunity Detected",
                `
                <div class="stat-box">
                    <div class="label">Opportunity</div>
                    <div class="value">${tenderTitle}</div>
                    <div style="color: #888; margin-top: 5px;">${tenderBuyer}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="stat-box" style="margin-bottom: 0;">
                        <div class="label">Value</div>
                        <div class="value">${tenderValue}</div>
                    </div>
                    <div class="stat-box" style="margin-bottom: 0;">
                        <div class="label">AI Score</div>
                        <div class="value highlight">${matchScore}%</div>
                    </div>
                </div>

                <p style="margin-top: 20px;">${description}</p>
                `,
                `${process.env.NEXT_PUBLIC_APP_URL}/tenders`,
                "Analyze Opportunity"
            )
        });
        return data;
    } catch (e) {
        console.error('Alert email failed:', e);
        return null;
    }
}

// 4. PROPOSAL COMPLETE
export async function sendProposalCompleteEmail({
    to,
    userName,
    proposalTitle,
    proposalId,
    score
}: {
    to: string;
    userName: string;
    proposalTitle: string;
    proposalId: string;
    score: number;
}) {
    const client = getResendClient();
    if (!client) return null;

    try {
        const { data } = await client.emails.send({
            from: `${FROM_NAME} <noreply@${FROM_DOMAIN}>`,
            to: [to],
            subject: `✅ Proposal Ready: ${proposalTitle}`,
            html: wrapHtml(
                "Proposal Generated",
                `
                <p>The AI has completed its work on <strong>${proposalTitle}</strong>.</p>
                
                <div class="stat-box" style="text-align: center;">
                    <div class="label">Quality Score</div>
                    <div class="value highlight" style="font-size: 32px;">${score.toFixed(1)}/10</div>
                </div>

                <p>This proposal includes:</p>
                <ul style="color: #ccc;">
                    <li>Competitor Reverse-Engineering</li>
                    <li>Truth Sentinel Verification</li>
                    <li>Professional Formatting</li>
                </ul>
                `,
                `${process.env.NEXT_PUBLIC_APP_URL}/war-room?id=${proposalId}`,
                "Review & Edit"
            )
        });
        return data;
    } catch (e) {
        return null;
    }
}

// 5. PROPOSAL FAILED
export async function sendProposalFailedEmail({
    to,
    userName,
    proposalTitle,
    errorMessage
}: {
    to: string;
    userName: string;
    proposalTitle: string;
    errorMessage?: string;
}) {
    const client = getResendClient();
    if (!client) return null;

    try {
        const { data } = await client.emails.send({
            from: `${FROM_NAME} <noreply@${FROM_DOMAIN}>`,
            to: [to],
            subject: `⚠️ Generation Failed: ${proposalTitle}`,
            html: wrapHtml(
                "Mission Aborted",
                `
                <p>We encountered an error while generating <strong>${proposalTitle}</strong>.</p>
                ${errorMessage ? `<div style="background: rgba(255, 59, 48, 0.1); border: 1px solid #ff3b30; color: #ff3b30; padding: 15px; border-radius: 8px;">${errorMessage}</div>` : ''}
                <p>Please try again or contact support if the issue persists.</p>
                `,
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                "Return to Dashboard"
            )
        });
        return data;
    } catch (e) {
        return null;
    }
}
