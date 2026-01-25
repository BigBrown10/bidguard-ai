"use server"

import { perplexitySonarReasoning } from "@/lib/perplexity"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { PromptTemplate } from "@langchain/core/prompts"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"

export interface QualificationResult {
    recommendation: "GO" | "NO-GO" | "PROCEED WITH CAUTION";
    confidence_score: number;
    traffic_light: "RED" | "AMBER" | "GREEN";
    reasoning: string[];
    strategic_advice: string;
}

const advisoryTemplate = `
🤖 Advisory Agent: Bid/No-Bid Strategy Prompt

Role: You are the Senior Strategic Advisor for a UK Government contractor.
Objective: Provide a cold, calculated recommendation on whether a company should bid on a specific tender.

INPUT CONTEXT
RFP SUMMARY: {tenderSummary}
COMPANY PROFILE: {companyProfile}
PAST PERFORMANCE: {winLossHistory}

EVALUATION CRITERIA
Analyze the opportunity against the company's capabilities using these weights:
Compliance (Pass/Fail): Does the company have the mandatory ISOs and insurance?
Probability of Win: How matches the sector/region?
Effort vs. Reward: Is the contract value high enough to justify the effort?
Competitive Advantage: Does the company have a "Unique Angle"?

OUTPUT FORMAT (JSON ONLY)
You must respond with a professional recommendation and a "Confidence Score."

{{
  "recommendation": "GO / NO-GO / PROCEED WITH CAUTION",
  "confidence_score": 0-100,
  "traffic_light": "RED...AMBER...GREEN",
  "reasoning": [
    "Reason 1",
    "Reason 2",
    "Reason 3"
  ],
  "strategic_advice": "One sentence strategic advice."
}}
`

export async function qualifyTender(tenderId: string, userId: string): Promise<QualificationResult> {
    try {
        if (!supabase) {
            console.error("Supabase Admin client missing")
            throw new Error("Supabase internal error")
        }

        // 1. Fetch Tender & User Data
        const { data: tender } = await supabase.from('tenders').select('title, description, value, region, buyer, status').eq('id', tenderId).single()
        const { data: profile } = await supabase.from('profiles').select('company_name, business_description, iso_certs, sectors').eq('id', userId).single()

        if (!tender || !profile) {
            throw new Error("Missing tender or profile data")
        }

        const tenderSummary = `
            Title: ${tender.title}
            Buyer: ${tender.buyer}
            Value: ${tender.value}
            Region: ${tender.region}
            Description: ${tender.description}
        `

        const companyProfile = `
            Name: ${profile.company_name}
            Bio: ${profile.business_description}
            ISOs: ${profile.iso_certs?.join(", ") || "None"}
            Sectors: ${profile.sectors?.join(", ") || "None"}
        `

        // Mock Win/Loss for now (could fetch from DB later)
        const winLossHistory = "Recent Wins: 0. Recent Losses: 0. (New Account)"

        // 2. Run Advisory Agent
        const prompt = PromptTemplate.fromTemplate(advisoryTemplate)
        const chain = prompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser())

        const result = await chain.invoke({
            tenderSummary,
            companyProfile,
            winLossHistory
        })

        // 3. Parse JSON
        // Robust JSON extraction
        let parsedResult: QualificationResult = {
            recommendation: "PROCEED WITH CAUTION",
            confidence_score: 50,
            traffic_light: "AMBER",
            reasoning: ["Analysis failed, proceeding with caution."],
            strategic_advice: "Manual review recommended."
        }

        try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0])
            } else {
                parsedResult = JSON.parse(result)
            }
        } catch (e) {
            console.error("Failed to parse Advisory Agent JSON:", e)
        }

        // Clean up traffic light format if agent is chatty
        if (parsedResult.traffic_light.includes("RED")) parsedResult.traffic_light = "RED"
        else if (parsedResult.traffic_light.includes("GREEN")) parsedResult.traffic_light = "GREEN"
        else parsedResult.traffic_light = "AMBER"

        return parsedResult

    } catch (error) {
        console.error("Qualification failed:", error)
        return {
            recommendation: "PROCEED WITH CAUTION",
            confidence_score: 0,
            traffic_light: "AMBER",
            reasoning: ["System error during qualification."],
            strategic_advice: "Please check tender details manually."
        }
    }
}
