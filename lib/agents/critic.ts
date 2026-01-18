import { z } from "zod";
import { perplexitySonarReasoning } from "../perplexity";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

export const CritiqueOutputSchema = z.object({
    score: z.number().min(0).max(10).describe("Bid Readiness Score (0-10)"),
    status: z.enum(["REJECT", "ACCEPT"]).describe("REJECT if score < 8.5"),
    critique: z.array(z.string()).describe("List of brutal criticisms"),
    improvement_suggestions: z.array(z.string()),
});

const parser = StructuredOutputParser.fromZodSchema(CritiqueOutputSchema);

const criticPrompt = PromptTemplate.fromTemplate(
    `You are the 'Red Team' Reviewer. A cynical UK Procurement Officer.
  Your job is to find reasons to REJECT this bid.
  
  Score strictly. > 8.5 is exceptional. Most generic AI bids should be < 5.
  
  Draft Strategy: {strategyName}
  Project: {projectName}
  
  Proposal Content:
  {executiveSummary}
  
  Critique this mercilessly.
  
  {format_instructions}
  `
);

const criticChain = RunnableSequence.from([
    criticPrompt,
    perplexitySonarReasoning,
    parser,
]);

export async function runCritic(strategyName: string, projectName: string, executiveSummary: string) {
    console.log(`Critiquing ${strategyName}...`);
    try {
        const result = await criticChain.invoke({
            strategyName,
            projectName,
            executiveSummary,
            format_instructions: parser.getFormatInstructions(),
        });
        return result;
    } catch (error) {
        console.error("Critique failed:", error);
        return {
            score: 5,
            status: "REJECT",
            critique: ["(Mock) Lacks specific evidence of social value.", "Too generic."],
            improvement_suggestions: ["Add local supply chain details."],
        };
    }
}
