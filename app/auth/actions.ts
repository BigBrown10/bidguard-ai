'use server';

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendVerificationEmail } from "@/lib/email";

export async function signupWithCustomEmail(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const deviceId = formData.get('deviceId') as string; // Capture device ID if sent

    if (!email || !password || !fullName) {
        return { error: "Missing fields" };
    }

    if (!supabaseAdmin) {
        return { error: "Server configuration error (Supabase Admin key missing)" };
    }

    try {
        const headerList = headers();
        const ip = (await headerList).get("x-forwarded-for") || (await headerList).get("x-real-ip") || "unknown";
        console.log(`[AUTH] Attempting custom signup for ${email} from IP: ${ip}`);

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    signup_ip: ip,
                    device_id: deviceId || "unknown",
                    signup_country: (await headerList).get("x-vercel-ip-country") || "unknown"
                },
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
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
