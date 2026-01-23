import { Tender } from "./mock-tenders";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";

// Use service role for backend cron jobs
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    : null;

// Fetch 500 tenders from UK Gov API
export async function fetchGovTenders(limit: number = 500): Promise<Tender[]> {
    try {
        console.log(`[GOV API] Fetching ${limit} tenders from Contracts Finder...`);

        const response = await fetch(`${BASE_URL}?limit=${limit}&stages=tender`, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Gov API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.results || data.releases || [];

        console.log(`[GOV API] Received ${results.length} tenders`);

        return results.map((item: any) => {
            const tender = item.tender || item.compiledRelease?.tender || {};
            const buyer = item.buyer || item.compiledRelease?.buyer || {};

            return {
                id: item.ocid || item.id || `gov-${Math.random()}`,
                title: tender.title || "Untitled Opportunity",
                buyer: buyer.name || "UK Government Body",
                value: formatValue(tender.value?.amount),
                deadline: tender.tenderPeriod?.endDate?.split("T")[0] || "Rolling",
                sector: tender.mainProcurementCategory || "Public Sector",
                description: tender.description || "No description provided.",
                location: tender.deliveryAddresses?.[0]?.region || "United Kingdom"
            };
        });

    } catch (error) {
        console.error("[GOV API] Failed to fetch live tenders:", error);
        return [];
    }
}

// Sync tenders to Supabase (upsert to avoid duplicates)
export async function syncTendersToSupabase(): Promise<{ synced: number; errors: number }> {
    if (!supabaseAdmin) {
        console.error("[SYNC] Supabase admin client not configured");
        return { synced: 0, errors: 1 };
    }

    console.log("[SYNC] Starting tender sync to Supabase...");

    const tenders = await fetchGovTenders(500);

    if (tenders.length === 0) {
        console.log("[SYNC] No tenders fetched, skipping sync");
        return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Batch upsert
    const { error } = await supabaseAdmin
        .from('tenders')
        .upsert(
            tenders.map(t => ({
                id: t.id,
                title: t.title,
                buyer: t.buyer,
                value: t.value,
                deadline: t.deadline,
                sector: t.sector,
                description: t.description,
                location: t.location,
                fetched_at: new Date().toISOString()
            })),
            { onConflict: 'id' }
        );

    if (error) {
        console.error("[SYNC] Upsert error:", error);
        errors++;
    } else {
        synced = tenders.length;
        console.log(`[SYNC] Successfully synced ${synced} tenders`);
    }

    return { synced, errors };
}

// Fetch tenders from Supabase cache (for user-facing feed)
export async function getCachedTenders(sector?: string): Promise<Tender[]> {
    if (!supabaseAdmin) {
        console.log("[CACHE] No Supabase, falling back to live API");
        return fetchGovTenders(100);
    }

    let query = supabaseAdmin
        .from('tenders')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(500);

    if (sector && sector !== 'all') {
        query = query.ilike('sector', `%${sector}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
        console.log("[CACHE] Cache miss, fetching from live API");
        return fetchGovTenders(100);
    }

    console.log(`[CACHE] Serving ${data.length} tenders from cache`);
    return data as Tender[];
}

function formatValue(amount: number): string {
    if (!amount) return "TBC";
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumSignificantDigits: 3 }).format(amount);
}

