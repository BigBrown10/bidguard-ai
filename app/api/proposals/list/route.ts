import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options });
                    },
                },
            }
        );

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ proposals: [], error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user's proposals
        const { data: proposals, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error fetching proposals:", error);
            // Return empty array if table doesn't exist yet
            return NextResponse.json({ proposals: [] });
        }

        return NextResponse.json({ proposals: proposals || [] });
    } catch (error) {
        console.error("Proposals list error:", error);
        return NextResponse.json({ proposals: [], error: "Failed to fetch proposals" }, { status: 500 });
    }
}
