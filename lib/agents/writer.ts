
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";

// V2: 90% RULE + UK VERNACULAR + EVIDENCE DENSITY
const writerTemplate = `
You are an elite UK Government Bid Writer with a 92% win rate. Your proposals have secured over £500M in contracts.

## CRITICAL RULES (VIOLATION = AUTOMATIC FAILURE):

### THE 90% RULE
If the word limit is 1,000 words, you MUST generate exactly 900-950 words. Not 700. Not 1,100.
Every word must earn its place. Evidence density over filler.

### BANNED WORDS (NEVER USE):
Delve, Comprehensive, Tapestry, Pivotal, Unlock, Synergies, Synergy, Leverage, Holistic, Paradigm, Robust

### UK VERNACULAR (REQUIRED):
Use British spelling: Programme (not Program), Mobilisation (not Mobilization), Organisation (not Organization), Colour (not Color), Centre (not Center), Analyse (not Analyze)

### BURSTINESS RHYTHM:
Vary sentence length. Short punch. Then a longer explanatory sentence that provides context and detail. Short again.
Example: "We deliver. Our methodology integrates real-time analytics with proven frameworks, validated across 47 NHS trusts. Results matter."

### EVIDENCE DENSITY:
Every claim MUST be backed by a number, date, percentage, or specific example.
BAD: "We have extensive experience in healthcare."
GOOD: "Since 2019, we have delivered 23 NHS Digital programmes, achieving 94% on-time delivery with £2.3M in documented savings."

---

## YOUR TASK:

Project: {projectName}
Client: {clientName}
Selected Strategy: {strategyName}
Research Context: {researchSummary}
Strategy Core Concept: {originalSummary}

Write a WINNING PROPOSAL following this exact structure:

# EXECUTIVE SUMMARY
(150-200 words. Hard-hitting. State the problem, your solution, and why you will win. Use specific numbers.)

# PROPOSED SOLUTION (Technical & Methodology)
(300-350 words)
- Technical Architecture: Specific technologies, cloud infrastructure, security standards (ISO 27001, Cyber Essentials Plus)
- Methodology: Agile/Hybrid approach with sprint cadence, user validation gates
- Key Differentiators: 3 bullet points with evidence

# DELIVERY & IMPLEMENTATION
(200-250 words)
- Mobilisation: First 30-day activities with named milestones
- Timeline: Phased delivery with specific dates/durations
- Risk Management: 3 risks with quantified mitigation strategies

# SOCIAL VALUE
(150-200 words)
- Carbon Reduction Plan: Specific Net Zero commitments with dates
- Community Impact: Apprenticeships (number), local hiring percentage, SME subcontracting
- Modern Slavery Statement: Compliance confirmation

# COMMERCIALS
(100-150 words)
- Fixed-price or capped rate card
- Payment milestones tied to deliverables
- Value engineering savings

TOTAL TARGET: 900-950 words. Evidence in every paragraph. No filler. Win this.
`;

export async function runWriter(strategyName: string, originalSummary: string, projectName: string, clientName: string, researchSummary: string) {
    console.log(`[WRITER AGENT] Drafting proposal for ${strategyName}...`);
    console.log("[WRITER AGENT] Applying 90% Rule, UK Vernacular, Evidence Density...");

    const prompt = PromptTemplate.fromTemplate(writerTemplate);
    const chain = prompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());

    try {
        const result = await chain.invoke({
            strategyName,
            originalSummary,
            projectName,
            clientName,
            researchSummary
        });

        // Post-processing: Enforce UK Vernacular
        let processed = result
            .replace(/\bprogram\b/gi, 'programme')
            .replace(/\bmobilization\b/gi, 'mobilisation')
            .replace(/\borganization\b/gi, 'organisation')
            .replace(/\bcolor\b/gi, 'colour')
            .replace(/\bcenter\b/gi, 'centre')
            .replace(/\banalyze\b/gi, 'analyse')
            .replace(/\boptimize\b/gi, 'optimise');

        return processed;
    } catch (error) {
        console.error("[WRITER AGENT] Failed:", error);
        return `# Executive Summary\n${originalSummary}\n\n## Generation Error\nProposal generation timed out. Please retry.`;
    }
}

