// ==========================================
// COMPANIES HOUSE API CLIENT
// Free UK Government API for company verification
// ==========================================

const COMPANIES_HOUSE_API = 'https://api.company-information.service.gov.uk';

interface CompanyProfile {
    company_name: string;
    company_number: string;
    company_status: string; // "active", "dissolved", etc.
    date_of_creation: string;
    registered_office_address: {
        address_line_1?: string;
        locality?: string;
        postal_code?: string;
        country?: string;
    };
    type: string;
    sic_codes?: string[];
    accounts?: {
        next_due?: string;
        last_accounts?: {
            made_up_to?: string;
        };
    };
}

interface VerificationResult {
    verified: boolean;
    company?: CompanyProfile;
    error?: string;
}

/**
 * Verify a company exists and is active via Companies House
 */
export async function verifyCompany(companyNumber: string): Promise<VerificationResult> {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

    if (!apiKey) {
        console.warn('[COMPANIES HOUSE] API key not configured');
        return { verified: false, error: 'API key not configured' };
    }

    // Clean company number (remove spaces, uppercase)
    const cleanNumber = companyNumber.replace(/\s/g, '').toUpperCase();

    try {
        const response = await fetch(
            `${COMPANIES_HOUSE_API}/company/${cleanNumber}`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return { verified: false, error: 'Company not found' };
            }
            return { verified: false, error: `API error: ${response.status}` };
        }

        const company: CompanyProfile = await response.json();

        // Check if company is active
        if (company.company_status !== 'active') {
            return {
                verified: false,
                company,
                error: `Company status: ${company.company_status}`
            };
        }

        return { verified: true, company };

    } catch (error) {
        console.error('[COMPANIES HOUSE] Verification failed:', error);
        return { verified: false, error: 'Network error' };
    }
}

/**
 * Search for companies by name
 */
export async function searchCompanies(query: string, limit = 5): Promise<CompanyProfile[]> {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

    if (!apiKey) {
        return [];
    }

    try {
        const response = await fetch(
            `${COMPANIES_HOUSE_API}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
                }
            }
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.items || [];

    } catch {
        return [];
    }
}

/**
 * Extract company data for proposal context
 */
export function getCompanyContext(company: CompanyProfile): string {
    return `
VERIFIED COMPANY DATA (Companies House):
- Registered Name: ${company.company_name}
- Company Number: ${company.company_number}
- Status: ${company.company_status}
- Incorporated: ${company.date_of_creation}
- Type: ${company.type}
- SIC Codes: ${company.sic_codes?.join(', ') || 'Not specified'}
`.trim();
}
