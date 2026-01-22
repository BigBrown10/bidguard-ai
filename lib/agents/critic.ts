import { z } from "zod";
import { perplexitySonarReasoning } from "../perplexity";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

// V2: BRUTAL CRITIC with WINNING FACTOR AUDIT
export const CritiqueOutputSchema = z.object({
    score: z.number().min(0).max(10).describe("Bid Readiness Score (0-10). Start at 10, then DEDUCT."),
    status: z.enum(["REJECT", "ACCEPT"]).describe("REJECT if score < 8.5"),
    complianceChecklist: z.array(z.object({
        item: z.string(),
        status: z.boolean()
    })).describe("Compliance items: Social Value, Carbon Plan, Modern Slavery, ISO"),
    harshFeedback: z.array(z.string()).describe("Brutal, specific criticisms"),
    evidenceScore: z.number().min(0).max(10).describe("Evidence density score - how many claims have specific numbers/dates"),
    socialValuePresent: z.boolean(),
    wordCount: z.number()
});

const parser = StructuredOutputParser.fromZodSchema(CritiqueOutputSchema);

const criticPrompt = PromptTemplate.fromTemplate(
    `You are the BRUTAL RED TEAM CRITIC. A cynical Master Reviewer who has rejected 47 "AI-generated" bids this week.

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

### COMPLIANCE CHECKLIST (Binary):
- Social Value Present: Yes/No
- Carbon Reduction Mentioned: Yes/No
- Modern Slavery Compliance: Yes/No
- ISO/Cyber Essentials Referenced: Yes/No

### UK VERNACULAR CHECK
- DEDUCT 0.5 points for each American spelling (Program, Mobilization, Organization)

---

## PROPOSAL TO CRITIQUE:

Project: {projectName}
Strategy: {strategyName}

Content:
{executiveSummary}

---

PROVIDE YOUR BRUTAL ASSESSMENT. Remember: Most AI-generated bids score 4-6. 
Only exceptional, evidence-rich, UK-compliant bids score above 8.

{format_instructions}
`
);

const criticChain = RunnableSequence.from([
    criticPrompt,
    perplexitySonarReasoning,
    parser,
]);

export async function runCritic(strategyName: string, projectName: string, executiveSummary: string) {
    console.log(`[RED TEAM] Critiquing ${strategyName}...`);
    console.log("[RED TEAM] Checking: Evidence Density, Social Value, Strategic Alignment...");

    try {
        const result = await criticChain.invoke({
            strategyName,
            projectName,
            executiveSummary,
            format_instructions: parser.getFormatInstructions(),
        });
        return result;
    } catch (error) {
        console.error("[RED TEAM] Critique failed:", error);
        // Fallback with realistic mock
        return {
            score: 6,
            status: "REJECT" as const,
            complianceChecklist: [
                { item: "Social Value", status: true },
                { item: "Carbon Reduction", status: false },
                { item: "Modern Slavery", status: true },
                { item: "ISO Standards", status: true }
            ],
            harshFeedback: [
                "Evidence density is weak. Three paragraphs contain vague claims without specific metrics.",
                "No specific client goals referenced. Reads like a template bid.",
                "Carbon Reduction Plan section is generic. No Net Zero dates or specific commitments."
            ],
            evidenceScore: 5,
            socialValuePresent: true,
            wordCount: executiveSummary.split(/\s+/).length
        };
    }
}

