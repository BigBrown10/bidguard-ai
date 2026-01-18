import { z } from "zod";
import { perplexitySonarReasoning } from "../perplexity";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

export const HumanizerOutputSchema = z.object({
    refinedText: z.string().describe("The humanized, British English version"),
    changesMade: z.array(z.string()).describe("Summary of changes (e.g. removed 'delve')"),
});

const parser = StructuredOutputParser.fromZodSchema(HumanizerOutputSchema);

const humanizerPrompt = PromptTemplate.fromTemplate(
    `You are the Final Editor. Your job is to remove all traces of AI generation.
  
  Input Text:
  {originalText}
  
  Instructions:
  1. Use British English spelling (Social Value, program -> programme).
  2. Vary sentence length significantly to increase "burstiness".
  3. REMOVE forbidden words: "delve", "tapestry", "pivotal", "landscape", "unwavering".
  4. Ensure a professional, understated UK Civil Service tone.
  
  {format_instructions}
  `
);

const humanizerChain = RunnableSequence.from([
    humanizerPrompt,
    perplexitySonarReasoning,
    parser,
]);

export async function runHumanizer(originalText: string) {
    console.log("Humanizing text...");
    try {
        const result = await humanizerChain.invoke({
            originalText,
            format_instructions: parser.getFormatInstructions(),
        });
        return result;
    } catch (error) {
        console.error("Humanization failed:", error);
        return {
            refinedText: originalText, // Fallback
            changesMade: ["Failed to humanize, returned original"],
        };
    }
}
