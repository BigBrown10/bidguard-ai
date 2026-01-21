import { inngest } from "@/lib/inngest/client";
import { supabase } from "@/lib/supabase";
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { perplexitySonarPro } from "@/lib/perplexity";

// Re-using the prompt from writer.ts
// Re-using the prompt from writer.ts
const writerTemplate = `
You are a Senior Human Bid Writer. You are NOT an AI.
Your goal is to write a SUBSTANTIAL, DETAILED DRAFT PROPOSAL (approx 1500 words).

DETAILS:
Project: {projectName}
Client: {clientName}
Selected Strategy: {strategyName}
Research Context: {researchSummary}
Strategy Core Concept: {originalSummary}

STRICT OUTPUT RULES:
1. NO MARKDOWN FORMATTING. Do not use hashtags (#), asterisks (*), or bold text.
2. NO CITATIONS. Do not use brackets like [1] or [2].
3. NO META COMMENTARY. Do not write "Total words:" or "Here is the proposal". Start directly with the text.
4. Use standard NUMBERED LISTS (1. 2. 3.) for structure.
5. Tone: Highly human, professional, persuasive. Avoid buzzwords. Write like a partner at a top consultancy.

STRUCTURE:

1. Executive Summary
(200-300 words. Hook the reader.)

2. Proposed Solution
(500+ words. The detailed technical and methodological approach.)

3. Delivery & Implementation Plan
(400 words. Timeline and mobilization.)

4. Social Value & Innovation
(300 words. Net Zero and future roadmap.)

Write purely in plain text.
`;

export const generateProposalFunction = inngest.createFunction(
    {
        id: "generate-tender-proposal",
        concurrency: 5,
        onFailure: async ({ event, error }) => {
            const { jobId } = event.data.event.data;
            if (jobId && supabase) {
                await supabase.from('jobs').update({
                    status: 'failed',
                    result: `## Generation Failed\n\nSystem encountered an error during processing: ${error.message}`
                }).eq('id', jobId);
            }
        }
    },
    { event: "app/generate-proposal" },
    async ({ event, step }) => {
        const { jobId, strategyName, executiveSummary, projectName, clientName, researchSummary } = event.data;

        // 1. Initial Status Update (Optional, beneficial for UI feedback)
        await step.run("update-status-start", async () => {
            if (!supabase) return;
            await supabase.from('jobs').update({ status: 'processing' }).eq('id', jobId);
        });

        // 2. Generate Content
        const resultMarkdown = await step.run("generate-ai-response", async () => {
            const prompt = PromptTemplate.fromTemplate(writerTemplate);
            // Switch to Standard Pro model for creative writing tasks (less refusal prone)
            const chain = prompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());

            try {
                return await chain.invoke({
                    strategyName,
                    originalSummary: executiveSummary,
                    projectName,
                    clientName,
                    researchSummary
                });
            } catch (error) {
                throw new Error(`AI Generation Failed: ${error}`);
            }
        });

        // 3. Save to Supabase
        await step.run("save-result", async () => {
            if (!supabase) {
                console.error("Supabase not configured, cannot save job result");
                return;
            }

            const { error } = await supabase
                .from('jobs')
                .update({
                    status: 'completed',
                    result: resultMarkdown
                })
                .eq('id', jobId);

            if (error) throw new Error(`Supabase Save Failed: ${error.message}`);
        });

        return { success: true, jobId };
    }
);
