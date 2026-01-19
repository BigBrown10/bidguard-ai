
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity"; // Use pro/reasoning
import { StringOutputParser } from "@langchain/core/output_parsers";

const writerTemplate = `
You are a Senior Bid Writer for a top - tier government consultancy(like McKinsey or Deloitte).
Your goal is to write a SUBSTANTIAL, DETAILED TENDER PROPOSAL(approx 800 - 1000 words) based on the chosen strategy.

    DETAILS:
Project: { projectName }
Client: { clientName }
Selected Strategy: { strategyName }
Research Context: { researchSummary }
Strategy Core Concept: { originalSummary }

TASK:
Write a comprehensive, professional response. 
Do not be brief.Expand on every point.Use professional formatting.

    STRUCTURE:

# Executive Summary
    (200 - 300 words.Hook the reader, summarize the win themes, and explain why this strategy is the only logical choice.)

# 1. Proposed Solution
    (500 + words.This is the meat of the proposal.)
    *   ** Technical Architecture **: Describe the stack, the cloud infrastructure, and security model.
*   ** Methodology **: Explain the agile / waterfall approach, sprints, and user - centric design.
*   ** Key Features **: Bullet points of specific value - add capabilities.

# 2. Delivery & Implementation Plan
    (400 words)
    *   ** Mobilization **: What happens in the first 30 days ?
*   ** Timeline **: A 6 - month phased rollout plan.
*   ** Risk Management **: Identification and mitigation of 3 key risks.

# 3. Social Value & Innovation
    (300 words)
    *   ** Sustainability **: Net Zero commitments.
*   ** Community **: Apprenticeships and local skills development.
*   ** Future Innovation **: Roadmap for 12 months + (e.g.AI, Automation).

    TONE:
    Authoritative, confident, precise.UK English(e.g., 'Programme', 'Mobilisation').
Do not use placeholders.Invent plausible details if necessary to make it robust.
`;

export async function runWriter(strategyName: string, originalSummary: string, projectName: string, clientName: string, researchSummary: string) {
    console.log(`Writing full proposal for ${strategyName}...`);

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
        return result;
    } catch (error) {
        console.error("Writer Agent Failed:", error);
        // Fallback if writing fails
        return `# Executive Summary\n${originalSummary} \n\n## Generation Error\nFull proposal generation timed out.Please retry.`;
    }
}
