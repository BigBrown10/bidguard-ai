import { NextRequest, NextResponse } from "next/server"
import { perplexitySonarReasoning } from "@/lib/perplexity"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"

const CRITIQUE_PROMPT = `You are the BRUTAL RED TEAM CRITIC. A cynical Master Reviewer who has rejected 47 "AI-generated" bids this week.

YOUR JOB: Find reasons to REJECT this bid. Be HARSH. Be SPECIFIC.

## SCORING METHOD (Start at 10, then DEDUCT):

### EVIDENCE DENSITY
- Scan every paragraph for specific numbers, dates, percentages, case studies
- DEDUCT 1 point for each paragraph with vague claims like "extensive experience" or "proven track record"
- NO EVIDENCE = Score capped at 5 maximum

### SOCIAL VALUE AUDIT
- Is there a dedicated Social Value section?
- Does it mention: Carbon Reduction Plan, Apprenticeships (with numbers), Modern Slavery Act, Local SME subcontracting?
- DEDUCT 3 POINTS if Social Value is missing or generic

### STRATEGIC ALIGNMENT
- Does the bid specifically reference the CLIENT'S goals, not just generic benefits?
- Does it mention the client by name with tailored solutions?
- DEDUCT 2 POINTS if it reads like a template

### UK VERNACULAR CHECK
- DEDUCT 0.5 points for each American spelling (Program, Mobilization, Organization)

---

## RFP CONTEXT (if provided):
{rfp}

## PROPOSAL TO CRITIQUE:
{proposal}

---

Respond in this EXACT JSON format:
{{
    "score": <number between 0-10>,
    "status": "<ACCEPT if score >= 8.5, otherwise REJECT>",
    "complianceChecklist": [
        {{ "item": "Social Value", "status": <true/false> }},
        {{ "item": "Carbon Reduction", "status": <true/false> }},
        {{ "item": "Modern Slavery", "status": <true/false> }},
        {{ "item": "ISO Standards", "status": <true/false> }}
    ],
    "harshFeedback": ["<specific criticism 1>", "<specific criticism 2>", ...],
    "evidenceScore": <number between 0-10>,
    "socialValuePresent": <true/false>,
    "annotations": [
        {{
            "text": "<exact quote from proposal that needs fixing>",
            "issue": "<SHORT ISSUE LABEL>",
            "suggestion": "<rewritten version with specific evidence>"
        }}
    ]
}}

Remember: Most AI-generated bids score 4-6. Only exceptional, evidence-rich, UK-compliant bids score above 8.
`

export async function POST(req: NextRequest) {
    try {
        const { rfp, proposal } = await req.json()

        if (!proposal) {
            return NextResponse.json({ error: "Proposal text required" }, { status: 400 })
        }

        const prompt = PromptTemplate.fromTemplate(CRITIQUE_PROMPT)
        const chain = prompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser())

        const result = await chain.invoke({
            rfp: rfp || "No RFP context provided.",
            proposal: proposal.substring(0, 8000) // Limit to prevent token overflow
        })

        // Parse JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Failed to parse critique response")
        }

        const critique = JSON.parse(jsonMatch[0])
        return NextResponse.json(critique)

    } catch (error: any) {
        console.error("Red Team API error:", error)
        return NextResponse.json(
            { error: error.message || "Analysis failed" },
            { status: 500 }
        )
    }
}
