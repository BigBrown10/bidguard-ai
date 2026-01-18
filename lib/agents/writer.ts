import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity"; // Use pro/reasoning
import { StringOutputParser } from "@langchain/core/output_parsers";

// A prompt dedicated to expanding a brief strategy into a full professional proposal
const writerTemplate = `
You are a Senior Bid Writer for a top-tier government consultancy. 
Your goal is to write a COMPREHENSIVE TENDER PROPOSAL based on the chosen strategy.

DETAILS:
Project: {projectName}
Client: {clientName}
Selected Strategy: {strategyName}
Research Context: {researchSummary}
Strategy Core Concept: {originalSummary}

TASK:
Write a full 4-section proposal in clear, professional Markdown. 
Do not use conversational filler. Write exactly what should go in the PDF.

STRUCTURE REQUIRED:
# Executive Summary
(Expand the original summary into a full compelling pitch)

# 1. Proposed Solution
(Technical architecture, methodology, key technologies, and how it solves the specific pain points)

# 2. Delivery & Implementation Plan
(Phased roll-out, timeline, risk management, and quality assurance)

# 3. Social Value & Innovation
(Sustainability, community benefits, and unique innovative add-ons)

TONE:
Professional, persuasive, authoritative. UK English.
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
        return `# Executive Summary\n${originalSummary}\n\n## Generation Error\nFull proposal generation timed out. Please retry.`;
    }
}
