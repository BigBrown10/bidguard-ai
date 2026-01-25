
import { sendVerificationEmail } from '../lib/email';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const recipient = process.argv[2];

if (!recipient) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
}

console.log(`📧 Sending test Verification Email to ${recipient}...`);

async function run() {
    try {
        // Mock verification link
        const mockLink = "https://bidswipe.xyz/auth/verify?token=mock_token_12345";

        await sendVerificationEmail(recipient, mockLink);
        console.log('✅ Email sent (check your inbox for "Verify your Identity 🔐")');
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

run();
