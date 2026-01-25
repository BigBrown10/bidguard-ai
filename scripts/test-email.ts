
import { sendNewTenderAlertEmail } from '../lib/email';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const recipient = process.argv[2];

if (!recipient) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
}

console.log(`📧 Sending test email to ${recipient}...`);

async function run() {
    try {
        const result = await sendNewTenderAlertEmail({
            to: recipient,
            tenderTitle: "TEST: High Value Defence Contract",
            tenderBuyer: "Ministry of Defence",
            tenderValue: "£5,000,000",
            description: "This is a test alert from the BidSwipe verification system.",
            matchScore: 98
        });

        if (result && result.id) {
            console.log(`✅ Success! Email ID: ${result.id}`);
        } else {
            console.error('❌ Failed to send email.');
        }
    } catch (e) {
        console.error('❌ Error details:', e);
    }
}

run();
