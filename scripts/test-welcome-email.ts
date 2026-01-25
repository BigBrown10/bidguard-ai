
import { sendWelcomeEmail } from '../lib/email';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const recipient = process.argv[2];

if (!recipient) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
}

console.log(`📧 Sending test Welcome Email to ${recipient}...`);

async function run() {
    try {
        await sendWelcomeEmail(recipient, "Commander");
        console.log('✅ Email sent (check your inbox for "Welcome to the Future")');
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

run();
