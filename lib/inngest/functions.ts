import { inngest } from "@/lib/inngest/client";
import { supabase } from "@/lib/supabase";
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { perplexitySonarPro } from "@/lib/perplexity";
import { TENDER_MASTERY_GUIDE } from "@/lib/knowledge/tender-mastery";

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

AUTHOR CONTEXT (YOUR COMPANY):
Company Name: {companyName}
Business Bio / About: {businessDescription}
(Use this context to write the "Proposed Solution" and "Delivery" sections as if you are this specific company. Match their expertise.)

EXPERT KNOWLEDGE (STRATEGIES TO WIN):
{masteryGuide}
(Apply these principles to the writing style and content structure. Ensure Social Value is specific and Risk is addressed.)

STRICT OUTPUT RULES:
1. NO MARKDOWN FORMATTING. Do not use hashtags (#), asterisks (*), or bold text.
2. NO CITATIONS. Do not use brackets like [x].
3. NO META COMMENTARY.
4. Use standard NUMBERED LISTS (1. 2. 3.) for structure.
5. Tone: Senior Partner. Expert. Human.

STRUCTURE:

1. Executive Summary
(200-300 words. Hook the reader.)

2. Proposed Solution
(500+ words. The detailed technical and methodological approach specific to {companyName}.)

3. Delivery & Implementation Plan
(400 words. Timeline and mobilization.)

4. Social Value & Innovation
(300 words. Net Zero and future roadmap.)

Write purely in plain text.
`;

const criticTemplate = `
You are a "Turing Test" Judge for Bid Proposals.
Analyze the following text and determine if it sounds like an AI or a Human Expert.

TEXT TO ANALYZE:
{text}

CRITERIA:
1. Buzzwords (e.g. "digital landscape", "seamless integration", "unwavering commitment").
2. Passive Voice ("It will be done" vs "We will do").
3. Generic Claims (Lack of specific evidence).

TASK:
Return a JSON object with:
- score: (0-100, where 100 is perfectly human)
- feedback: (Bullet points of what to fix)
- needsRewrite: (true if score < 85)
`;

const humanizerTemplate = `
You are a Master Editor.
Your goal is to rewrite the texts to be 100% HUMAN and WINNING.

CRITIC FEEDBACK:
{feedback}

ORIGINAL TEXT:
{originalText}

INSTRUCTIONS:
1. Apply the critic's feedback.
2. REMOVE all AI-isms (delve, underscore, testament, landscape).
3. Use SHORT, PUNCHY sentences.
4. Be SPECIFIC. Invent plausible metrics if needed (e.g. "99.8% uptime" instead of "high availability").
5. Keep the same structure but make it sing.

Output ONLY the rewritten text.
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
            // A. Fetch User Profile Context
            let authorContext = {
                companyName: "Our Agency",
                businessDescription: "A leading provider of professional services."
            };

            if (supabase) {
                // Get job to find user_id
                const { data: job } = await supabase.from('jobs').select('user_id').eq('id', jobId).single();

                if (job?.user_id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('company_name, business_description')
                        .eq('id', job.user_id)
                        .single();

                    if (profile) {
                        authorContext = {
                            companyName: profile.company_name || "Our Agency",
                            businessDescription: profile.business_description || "A leading provider of professional services."
                        };
                    }
                }
            }

            const prompt = PromptTemplate.fromTemplate(writerTemplate);
            // Switch to Standard Pro model for creative writing tasks (less refusal prone)
            const chain = prompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());

            try {
                return await chain.invoke({
                    strategyName,
                    originalSummary: executiveSummary,
                    projectName,
                    clientName,
                    researchSummary,
                    companyName: authorContext.companyName,
                    businessDescription: authorContext.businessDescription,
                    masteryGuide: TENDER_MASTERY_GUIDE
                });
            } catch (error) {
                throw new Error(`AI Generation Failed: ${error}`);
            }
        });

        // 3. Critique & Humanize Loop
        const finalOutput = await step.run("humanize-loop", async () => {
            const criticPrompt = PromptTemplate.fromTemplate(criticTemplate);
            const criticChain = criticPrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser()); // Use Reasoning for better critique

            const critiqueResponse = await criticChain.invoke({ text: resultMarkdown });
            // Naive parsing of JSON since Reasoning models can be chatty. 
            // In prod, use StructuredOutputParser.
            // For now, let's assume we proceed to humanize if the text is long enough.

            // Let's just ALWAYS run the humanizer for now to ensure quality, 
            // using the reasoning output as chain-of-thought guide.

            const humanizePrompt = PromptTemplate.fromTemplate(humanizerTemplate);
            const humanizeChain = humanizePrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());

            try {
                return await humanizeChain.invoke({
                    feedback: critiqueResponse,
                    originalText: resultMarkdown
                });
            } catch (e) {
                console.error("Humanization failed, returning original", e);
                return resultMarkdown;
            }
        });

        // 4. Save to Supabase
        await step.run("save-result", async () => {
            if (!supabase) {
                console.error("Supabase not configured, cannot save job result");
                return;
            }

            const { error } = await supabase
                .from('jobs')
                .update({
                    status: 'completed',
                    result: finalOutput
                })
                .eq('id', jobId);

            if (error) throw new Error(`Supabase Save Failed: ${error.message}`);
        });

        return { success: true, jobId };
    }
);
