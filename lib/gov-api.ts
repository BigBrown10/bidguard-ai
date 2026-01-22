import { Tender } from "./mock-tenders";

const BASE_URL = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";

// We'll use the OCDS Search endpoint as it's often more open/documented for public access without complex auth flow
// URL reference: https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?limit=20

export async function fetchGovTenders(): Promise<Tender[]> {
    try {
        // Fetch recent tender notices
        // Limit to 20, descending order
        const response = await fetch(`${BASE_URL}?limit=20&stages=tender`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Gov API Warning: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Map OCDS (Open Contracting Data Standard) to our Tender type
        // The structure usually involves a 'results' array or similar.
        // Let's assume standard OCDS structure for now.
        // Inspecting typical OCDS response: { uri: "...", releases: [...] } or { results: [...] }

        // Note: The UK OCDS endpoint structure can be tricky.
        // We will try to map loosely and defensive code.

        const results = data.results || data.releases || [];

        return results.map((item: any) => {
            // In OCDS, 'compiledRelease' or just the item itself might have the data
            const tender = item.tender || item.compiledRelease?.tender || {};
            const buyer = item.buyer || item.compiledRelease?.buyer || {};

            return {
                id: item.ocid || item.id || `gov-${Math.random()}`,
                title: tender.title || "Untitled Opportunity",
                buyer: buyer.name || "UK Government Body",
                value: formatValue(tender.value?.amount),
                deadline: tender.tenderPeriod?.endDate?.split("T")[0] || "Rolling",
                sector: tender.mainProcurementCategory || "Public Sector", // Often "Services", "Works"
                description: tender.description || "No description provided.",
                location: tender.deliveryAddresses?.[0]?.region || "United Kingdom"
            };
        });

    } catch (error) {
        console.error("Failed to fetch live tenders:", error);
        console.log("Note: Gov API may be rate-limited or unavailable. Use MOCK_TENDERS as fallback.");
        return [];
    }
}

function formatValue(amount: number): string {
    if (!amount) return "TBC";
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumSignificantDigits: 3 }).format(amount);
}
