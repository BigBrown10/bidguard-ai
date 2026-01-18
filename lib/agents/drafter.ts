import { z } from "zod";
import { perplexitySonarReasoning } from "../perplexity";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

export const DraftOutputSchema = z.object({
    strategyName: z.string(),
    executiveSummary: z.string().describe("The core pitch"),
    keyTheme: z.string().describe("The unifying theme of the bid"),
    strengths: z.array(z.string()).describe("Why this wins"),
    weaknesses: z.array(z.string()).describe("Potential risks of this approach"),
});

const parser = StructuredOutputParser.fromZodSchema(DraftOutputSchema);

const draftPrompt = PromptTemplate.fromTemplate(
    `You are the Master Drafter for a multi-million pound UK public sector bid.
  Your goal is to write a {strategy} bid proposal strategy.
  
  Project: {projectName}
  Client: {clientName}
  
  Research Insights:
  {researchSummary}
  
  Strategy Definition:
  - SAFE: Low risk, compliant, emphasises reliability and past performance.
  - INNOVATIVE: Introduces new tech/process, balances risk with high reward.
  - DISRUPTIVE: Completely rethinks the problem. High risk, high reward. CHALLENGER mentality.
  
  Write the proposal strategy now.
  
  {format_instructions}
  `
);

const draftChain = RunnableSequence.from([
    draftPrompt,
    perplexitySonarReasoning,
    parser,
]);

export async function runDrafter(strategy: "Safe" | "Innovative" | "Disruptive", projectName: string, clientName: string, researchSummary: string) {
    console.log(`Drafting ${strategy} strategy...`);
    try {
        const result = await draftChain.invoke({
            strategy,
            projectName,
            clientName,
            researchSummary,
            format_instructions: parser.getFormatInstructions(),
        });
        return result;
    } catch (error) {
        console.error(`Drafting ${strategy} failed:`, error);
        // Mock fallback
        return {
            strategyName: strategy,
            executiveSummary: `(Mock ${strategy}) We propose a ${strategy.toLowerCase()} approach focusing on...`,
            keyTheme: `${strategy} Efficiency`,
            strengths: ["Low risk", "High compliance"],
            weaknesses: ["May seem boring"],
        };
    }
}
