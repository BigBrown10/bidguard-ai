export interface Proposal {
    id: string;
    tender_id: string;
    tender_title: string;
    tender_buyer?: string; // Added optional field as per usage
    status: 'queued' | 'researching' | 'strategizing' | 'drafting' | 'critiquing' | 'humanizing' | 'complete' | 'failed';
    created_at: string;
    score?: number;
    final_content?: string; // Markdown content
    draft_content?: string;
    feedback?: string[]; // Array of strings (JSON)
    user_id: string;
}

export type ProposalStatus = Proposal['status'];

// Re-export Tender if needed, or define here
export interface Tender {
    id: string;
    title: string;
    buyer: string;
    value: string;
    deadline: string;
    sector: string;
    description: string;
    location: string;
}

export interface UserProfile {
    id: string;
    email: string;
    company_name?: string;
    business_description?: string;
    website?: string;
    ai_model?: 'perplexity' | 'gemini-flash';
}
