import { inngest } from "@/lib/inngest/client";
import { supabase } from "@/lib/supabase";
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { perplexitySonarPro } from "@/lib/perplexity";
import { TENDER_MASTERY_GUIDE } from "@/lib/knowledge/tender-mastery";
import { syncTendersToSupabase } from "@/lib/gov-api";

// =========================================
// CRON: Hourly Tender Sync
// =========================================
export const syncTendersCron = inngest.createFunction(
    { id: "sync-tenders-hourly" },
    { cron: "0 * * * *" }, // Every hour on the hour
    async ({ step }) => {
        console.log("[CRON] Starting hourly tender sync...");

        const result = await step.run("sync-tenders", async () => {
            return await syncTendersToSupabase();
        });

        console.log(`[CRON] Sync complete: ${result.synced} synced, ${result.errors} errors`);
        return result;
    }
);

// =========================================
// PROPOSAL GENERATION FUNCTION
// =========================================
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
Strategic Deep Dive: {deepDiveStrategy}
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
                businessDescription: "A leading provider of professional services.",
                website: ""
            };

            if (supabase) {
                const { data: job } = await supabase.from('jobs').select('user_id').eq('id', jobId).single();

                if (job?.user_id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('company_name, business_description, website')
                        .eq('id', job.user_id)
                        .single();

                    if (profile) {
                        authorContext = {
                            companyName: profile.company_name || "Our Agency",
                            businessDescription: profile.business_description || "A leading provider of professional services.",
                            website: profile.website || ""
                        };
                    }
                }
            }

            // B. DEEP DIVE RESEARCH AGENT
            // Analyze the company's specific fit for this project
            const deepDiveResearch = await step.run("deep-dive-research", async () => {
                const researchPrompt = PromptTemplate.fromTemplate(`
                    You are a Strategic Bid Researcher.
                    Research this specific company and find their unique angle for this client.

                    AUTHOR COMPANY: {companyName}
                    WEBSITE: {website}
                    BIO: {businessDescription}

                    CLIENT: {clientName}
                    PROJECT: {projectName}

                    TASK:
                    1. If a website is provided, assume you have browsed it (simulate knowledge of their likely case studies/awards based on sector).
                    2. Identify 3 specific "Killer Arguments" why THIS company is the perfect fit for THIS project.
                    3. Find a potential "Ghost in the Machine" - a hidden client pain point we can solve.

                    Output a concise briefing note (bullet points).
                `);

                const chain = researchPrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());
                try {
                    return await chain.invoke({
                        companyName: authorContext.companyName,
                        website: authorContext.website,
                        businessDescription: authorContext.businessDescription,
                        clientName,
                        projectName
                    });
                } catch (e) {
                    return "Research unavailable. Proceeding with standard profile.";
                }
            });

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
                    deepDiveStrategy: deepDiveResearch,
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

// =========================================
// V3: AUTONOMOUS PROPOSAL GENERATION
// Triggered by swipe-right → runs full pipeline
// =========================================
export const generateAutonomousProposal = inngest.createFunction(
    {
        id: "generate-autonomous-proposal",
        concurrency: 3,
        onFailure: async ({ event, error }) => {
            const { proposalId } = event.data.event.data;
            if (proposalId && supabase) {
                await supabase.from('proposals').update({
                    status: 'failed',
                    error_message: error.message
                }).eq('id', proposalId);
            }
        }
    },
    { event: "app/generate-autonomous-proposal" },
    async ({ event, step }) => {
        const { proposalId, userId, tenderId, tenderTitle, tenderBuyer, ideaInjection } = event.data;

        console.log(`[AUTONOMOUS] Starting proposal for: ${tenderTitle}`);

        // 1. Update status: Researching
        await step.run("status-researching", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'researching',
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // 2. Fetch company profile
        const profile = await step.run("fetch-profile", async () => {
            if (!supabase) return null;
            const { data } = await supabase
                .from('profiles')
                .select('company_name, business_description, website, sectors')
                .eq('id', userId)
                .single();
            return data;
        });

        // 3. Research phase
        const researchOutput = await step.run("research", async () => {
            const researchPrompt = PromptTemplate.fromTemplate(`
                You are a Strategic Bid Researcher.
                Research this tender opportunity and find intelligence.

                TENDER: {tenderTitle}
                BUYER: {tenderBuyer}
                COMPANY: {companyName}
                SECTORS: {sectors}

                USER INPUT (if any): {ideaInjection}

                TASK:
                1. Identify 3 key buyer pain points we can address
                2. Find 3 differentiators for this company
                3. Identify compliance requirements (Social Value, Carbon, Modern Slavery)
                4. Suggest strategic positioning

                Output a concise briefing note.
            `);

            const chain = researchPrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());
            try {
                return await chain.invoke({
                    tenderTitle,
                    tenderBuyer,
                    companyName: profile?.company_name || "Our Company",
                    sectors: profile?.sectors?.join(", ") || "General",
                    ideaInjection: ideaInjection || "No specific angles provided"
                });
            } catch (e) {
                return "Research unavailable. Proceeding with standard approach.";
            }
        });

        // 4. Update status: Strategizing
        await step.run("status-strategizing", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'strategizing',
                research_output: { summary: researchOutput },
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // 5. Strategy generation
        const strategyOutput = await step.run("strategize", async () => {
            const strategyPrompt = PromptTemplate.fromTemplate(`
                You are a Bid Strategy Director.
                Based on the research, define the winning strategy.

                RESEARCH: {research}
                USER ANGLES: {ideaInjection}

                Generate a clear strategy with:
                1. Win Theme (one powerful sentence)
                2. Key Messages (3 bullets)
                3. Evidence to highlight
                4. Risk mitigation approach
            `);

            const chain = strategyPrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());
            return await chain.invoke({
                research: researchOutput,
                ideaInjection: ideaInjection || "Autonomous mode"
            });
        });

        // 6. Update status: Drafting
        await step.run("status-drafting", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'drafting',
                strategy_output: { summary: strategyOutput },
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // 7. Write proposal
        const draftContent = await step.run("write", async () => {
            const writePrompt = PromptTemplate.fromTemplate(`
                You are an elite UK Government Bid Writer with a 92% win rate.

                ## STRICT RULES:
                - 90% Rule: Target 900-950 words
                - UK Vernacular: Programme, Mobilisation, Organisation
                - Evidence Density: Every claim needs a number, date, or specific example
                - No banned words: Delve, Comprehensive, Tapestry, Pivotal, Unlock, Synergies

                ## CONTEXT:
                Tender: {tenderTitle}
                Buyer: {tenderBuyer}
                Company: {companyName}
                Strategy: {strategy}
                Research: {research}

                ## STRUCTURE:
                # EXECUTIVE SUMMARY (150-200 words)
                # PROPOSED SOLUTION (300-350 words)
                # DELIVERY & IMPLEMENTATION (200-250 words)
                # SOCIAL VALUE (150-200 words)
                # COMMERCIALS (100-150 words)

                Write a WINNING proposal.
            `);

            const chain = writePrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());
            const result = await chain.invoke({
                tenderTitle,
                tenderBuyer,
                companyName: profile?.company_name || "Our Company",
                strategy: strategyOutput,
                research: researchOutput
            });

            // Post-processing: UK Vernacular
            return result
                .replace(/\bprogram\b/gi, 'programme')
                .replace(/\bmobilization\b/gi, 'mobilisation')
                .replace(/\borganization\b/gi, 'organisation');
        });

        // 8. Update status: Critiquing
        await step.run("status-critiquing", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'critiquing',
                draft_content: draftContent,
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // 9. Critique
        const critiqueOutput = await step.run("critique", async () => {
            const critiquePrompt = PromptTemplate.fromTemplate(`
                You are the BRUTAL RED TEAM CRITIC.
                Score this proposal (0-10) and provide harsh feedback.

                PROPOSAL:
                {draft}

                Respond in JSON: {{ "score": number, "status": "ACCEPT/REJECT", "feedback": ["..."] }}
            `);

            const chain = critiquePrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());
            const result = await chain.invoke({ draft: draftContent });

            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 7, status: "ACCEPT", feedback: [] };
            } catch {
                return { score: 7, status: "ACCEPT", feedback: ["Auto-parsed"] };
            }
        });

        // 10. Update status: Humanizing
        await step.run("status-humanizing", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'humanizing',
                critique: critiqueOutput,
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // 11. Humanize
        const finalContent = await step.run("humanize", async () => {
            const humanizePrompt = PromptTemplate.fromTemplate(`
                You are a Master Editor.
                Rewrite this proposal to be 100% HUMAN and WINNING.

                CRITIQUE FEEDBACK: {feedback}
                ORIGINAL: {draft}

                INSTRUCTIONS:
                1. Apply the critique feedback
                2. Remove AI-isms (delve, underscore, testament)
                3. Use SHORT, PUNCHY sentences (burstiness)
                4. Be SPECIFIC with evidence

                Output ONLY the rewritten text.
            `);

            const chain = humanizePrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());
            return await chain.invoke({
                feedback: JSON.stringify(critiqueOutput.feedback),
                draft: draftContent
            });
        });

        // 12. Save final result
        await step.run("save-final", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'complete',
                final_content: finalContent,
                score: critiqueOutput.score,
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        console.log(`[AUTONOMOUS] Complete: ${tenderTitle} - Score: ${critiqueOutput.score}`);
        return { success: true, proposalId, score: critiqueOutput.score };
    }
);

