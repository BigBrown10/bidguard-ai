'use server';

import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendVerificationEmail } from "@/lib/email";

export async function signupWithCustomEmail(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!email || !password || !fullName) {
        return { error: "Missing fields" };
    }

    if (!supabaseAdmin) {
        return { error: "Server configuration error (Supabase Admin key missing)" };
    }

    try {
        console.log(`[AUTH] Attempting custom signup for ${email}`);

        // 1. Create User (Admin execution to bypass default email trigger if possible, 
        // OR we just rely on Supabase returning the user and we handle the link generation)

        // Note: createUser usually auto-confirms if email_confirm is off. 
        // If on, it sends an email unless we suppress it? 
        // Actually, the best way to get a link is generateLink.
        // But we need the user to exist first?
        // generateLink type 'signup' creates the user if they don't exist? Check docs.
        // Docs: "Generates a link for a user... type='signup' requires email and password and creates a user."

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });

        if (error) {
            console.error('[AUTH] Generate Link Error:', error);
            return { error: error.message };
        }

        const { user, properties } = data;

        if (properties?.action_link) {
            // 2. Send Custom Verification Email
            console.log(`[AUTH] Sending verification email to ${email}`);
            await sendVerificationEmail(email, properties.action_link);
        } else {
            console.warn('[AUTH] No action link generated. User might already be confirmed?');
        }

        return { success: true };

    } catch (e: any) {
        console.error('[AUTH] Unexpected error:', e);
        return { error: e.message };
    }
}

export async function deleteUserAccount(userId: string) {
    if (!supabaseAdmin) {
        return { error: "Server configuration error" };
    }

    try {
        console.log(`[AUTH] Deleting user ${userId}`);

        // 1. Delete Auth User (Cascade should handle public schema data usually, but we can do manual cleanup if needed)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('[AUTH] Delete User Error:', error);
            return { error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
