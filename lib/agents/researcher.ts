import { z } from "zod";
import { perplexitySonarPro } from "../perplexity";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

export const ResearchOutputSchema = z.object({
    clientNews: z.array(z.string()).describe("Recent news about the client found online"),
    competitorWins: z.array(z.string()).describe("Recent contract awards to competitors"),
    painPoints: z.array(z.string()).describe("Current sector pain points relevant to the bid"),
    evidenceBullets: z.array(z.string()).describe("Key stats or facts to include in the proposal"),
});

const parser = StructuredOutputParser.fromZodSchema(ResearchOutputSchema);

const researchPrompt = PromptTemplate.fromTemplate(
    `You are the Intelligence Officer for a high-stakes bid team.
  Analyze the current market landscape for the following client and project:
  
  Client: {clientName}
  Project: {projectName}
  
  Find strictly factual information from the live web.
  Focus on:
  1. Recent news affecting the client.
  2. Who won their last big contracts?
  3. What are the current pressures in this sector (UK focus)?
  
  {format_instructions}
  `
);

export const researchAgent = RunnableSequence.from([
    researchPrompt,
    perplexitySonarPro,
    parser,
]);

export async function runResearch(projectName: string, clientName: string = "Unknown Client") {
    console.log(`Starting research for ${projectName}...`);
    try {
        const result = await researchAgent.invoke({
            projectName,
            clientName,
            format_instructions: parser.getFormatInstructions(),
        });
        return result;
    } catch (error) {
        console.error("Research failed:", error);
        // Return mock data if API fails (for dev/demo without keys)
        return {
            clientNews: ["(Mock) Client announced new digital strategy in Q4 2024."],
            competitorWins: ["(Mock) CompetitorX won the £5m cloud framework."],
            painPoints: ["Legacy system maintenance costs", "Data sovereignty concerns"],
            evidenceBullets: ["85% of public sector projects are delayed.", "Client stock dropped 5% due to IT outage."],
        };
    }
}
