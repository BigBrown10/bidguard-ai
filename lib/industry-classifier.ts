/**
 * Industry Auto-Classification System
 * Automatically classifies tenders based on keywords in title and description
 */

// Keyword to industry mapping
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    healthcare: [
        'nhs', 'hospital', 'clinical', 'medical', 'health', 'pharmacy', 'nursing',
        'patient', 'care home', 'mental health', 'ambulance', 'gp', 'dentist',
        'physiotherapy', 'pathology', 'radiology', 'maternity', 'paediatric'
    ],

    defense: [
        'mod', 'ministry of defence', 'military', 'defence', 'defense', 'armed forces',
        'army', 'navy', 'raf', 'royal air force', 'weapons', 'ammunition', 'security',
        'intelligence', 'surveillance', 'nato'
    ],

    technology: [
        'software', 'it ', 'i.t.', 'digital', 'cyber', 'data', 'cloud', 'saas',
        'website', 'application', 'api', 'database', 'ai', 'artificial intelligence',
        'machine learning', 'automation', 'network', 'infrastructure', 'erp', 'crm'
    ],

    construction: [
        'building', 'construction', 'civil engineering', 'architect', 'contractor',
        'renovation', 'refurbishment', 'demolition', 'groundwork', 'scaffolding',
        'roofing', 'plumbing', 'electrical installation', 'hvac', 'mechanical'
    ],

    education: [
        'school', 'university', 'college', 'education', 'learning', 'training',
        'academy', 'curriculum', 'teaching', 'student', 'pupil', 'ofsted',
        'further education', 'higher education', 'classroom'
    ],

    transport: [
        'transport', 'logistics', 'fleet', 'vehicle', 'bus', 'rail', 'train',
        'highway', 'road', 'aviation', 'airport', 'shipping', 'freight',
        'delivery', 'courier', 'haulage', 'taxi'
    ],

    energy: [
        'energy', 'electricity', 'gas', 'renewable', 'solar', 'wind', 'hydro',
        'nuclear', 'grid', 'power', 'utility', 'fuel', 'carbon', 'emissions',
        'sustainability', 'net zero', 'green', 'ev charging'
    ],

    finance: [
        'finance', 'banking', 'insurance', 'investment', 'pension', 'audit',
        'accounting', 'payroll', 'treasury', 'fiscal', 'tax', 'vat', 'hmrc'
    ],

    legal: [
        'legal', 'law', 'solicitor', 'barrister', 'court', 'tribunal', 'judicial',
        'litigation', 'contract', 'compliance', 'regulatory', 'gdpr', 'foi'
    ],

    environment: [
        'environment', 'waste', 'recycling', 'pollution', 'climate', 'ecology',
        'wildlife', 'conservation', 'biodiversity', 'flood', 'drainage', 'water'
    ],

    facilities: [
        'facilities management', 'cleaning', 'catering', 'security', 'reception',
        'maintenance', 'janitorial', 'grounds', 'landscaping', 'pest control'
    ],

    social: [
        'social care', 'social services', 'housing', 'homelessness', 'children',
        'foster', 'adoption', 'disability', 'elderly', 'vulnerable', 'community'
    ]
}

/**
 * Classify a tender based on its title and description
 * Returns the best matching industry or 'general' if no match found
 */
export function classifyTender(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    const scores: Record<string, number> = {}

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
        let score = 0
        for (const keyword of keywords) {
            // Count keyword occurrences (word boundary aware for short keywords)
            if (keyword.length <= 3) {
                // For short keywords like 'nhs', 'it', 'mod', use word boundary
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
                const matches = text.match(regex)
                score += (matches?.length || 0) * 2 // Higher weight for exact short matches
            } else {
                // For longer keywords, simple includes is fine
                if (text.includes(keyword)) {
                    score += keyword.length > 8 ? 3 : 2 // Longer keywords = more specific
                }
            }
        }

        if (score > 0) {
            scores[industry] = score
        }
    }

    // Find highest scoring industry
    const entries = Object.entries(scores)
    if (entries.length === 0) {
        return 'general'
    }

    entries.sort((a, b) => b[1] - a[1])
    return entries[0][0]
}

/**
 * Get a human-readable label for an industry
 */
export function getIndustryLabel(industry: string): string {
    const labels: Record<string, string> = {
        healthcare: 'Healthcare',
        defense: 'Defence',
        technology: 'IT & Digital',
        construction: 'Construction',
        education: 'Education',
        transport: 'Transport & Logistics',
        energy: 'Energy & Utilities',
        finance: 'Finance & Banking',
        legal: 'Legal Services',
        environment: 'Environment',
        facilities: 'Facilities Management',
        social: 'Social Care',
        general: 'General'
    }

    return labels[industry] || industry.charAt(0).toUpperCase() + industry.slice(1)
}

/**
 * Get all available industries
 */
export function getAllIndustries(): { id: string; label: string }[] {
    return Object.keys(INDUSTRY_KEYWORDS).map(id => ({
        id,
        label: getIndustryLabel(id)
    }))
}
