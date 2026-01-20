import { inngest } from "@/lib/inngest/client";
import { supabase } from "@/lib/supabase";
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Re-using the prompt from writer.ts
const writerTemplate = `
You are a Senior Bid Writer for a top-tier government consultancy (like McKinsey or Deloitte).
Your goal is to write a SUBSTANTIAL, DETAILED TENDER PROPOSAL (approx 1500-2000 words) based on the chosen strategy.

DETAILS:
Project: {projectName}
Client: {clientName}
Selected Strategy: {strategyName}
Research Context: {researchSummary}
Strategy Core Concept: {originalSummary}

TASK:
Write a comprehensive, professional response. 
Do not be brief. Expand on every point. Use professional formatting.

STRUCTURE:

# Executive Summary
(200-300 words. Hook the reader, summarize the win themes, and explain why this strategy is the only logical choice.)

# 1. Proposed Solution
(500+ words. This is the meat of the proposal.)
*   **Technical Architecture**: Describe the stack, the cloud infrastructure, and security model.
*   **Methodology**: Explain the agile/waterfall approach, sprints, and user-centric design.
*   **Key Features**: Bullet points of specific value-add capabilities.

# 2. Delivery & Implementation Plan
(400 words)
*   **Mobilization**: What happens in the first 30 days?
*   **Timeline**: A 6-month phased rollout plan.
*   **Risk Management**: Identification and mitigation of 3 key risks.

# 3. Social Value & Innovation
(300 words)
*   **Sustainability**: Net Zero commitments.
*   **Community**: Apprenticeships and local skills development.
*   **Future Innovation**: Roadmap for 12 months+ (e.g. AI, Automation).

TONE:
Authoritative, confident, precise. UK English (e.g., 'Programme', 'Mobilisation').
Do not use placeholders. Invent plausible details if necessary to make it robust.
`;

export const generateProposalFunction = inngest.createFunction(
    { id: "generate-tender-proposal", concurrency: 5 }, // Allow 5 concurrent jobs
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
            // Note: Using the reasoning model (slower but better) because we are in background!
            const chain = prompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());

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
    },
    {
        onFailure: async ({ event, error }) => {
            const { jobId } = event.data.event.data;
            if (jobId && supabase) {
                await supabase.from('jobs').update({
                    status: 'failed',
                    result: `## Generation Failed\n\nSystem encountered an error during processing: ${error.message}`
                }).eq('id', jobId);
            }
        }
    }
);
