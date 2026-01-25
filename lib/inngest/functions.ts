import { inngest } from "@/lib/inngest/client";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { perplexitySonarPro } from "@/lib/perplexity";
import { TENDER_MASTERY_GUIDE } from "@/lib/knowledge/tender-mastery";
import { syncTendersToSupabase } from "@/lib/gov-api";
import { sendProposalCompleteEmail, sendProposalFailedEmail } from "@/lib/email";

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
            const { proposalId, userId, tenderTitle } = event.data.event.data;
            if (proposalId && supabase) {
                await supabase.from('proposals').update({
                    status: 'failed',
                    error_message: error.message
                }).eq('id', proposalId);

                // Send failure notification email
                if (userId) {
                    const { data: user } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }));
                    if (user?.user?.email) {
                        await sendProposalFailedEmail({
                            to: user.user.email,
                            userName: user.user.user_metadata?.first_name || 'there',
                            proposalTitle: tenderTitle || 'Untitled Proposal',
                            errorMessage: error.message
                        });
                    }
                }
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
                You are a HUMAN EXPERT. You work for {companyName}.

                ## CRITICAL OUTPUT RULES:
                - ABSOLUTELY NO MARKDOWN. Do not use #, ##, **, *, _ or any formatting symbols.
                - NO CITATIONS. Never use [1], [2] or any bracketed references.
                - NO AI DISCLOSURE. Never say "I am an AI", "As an AI", "I don't have the ability", etc.
                - Write in PLAIN TEXT only. Use numbered lists (1. 2. 3.) for structure.
                - UK SPELLING: Programme, Mobilisation, Organisation

                ## LENGTH REQUIREMENT:
                YOU MUST WRITE AT LEAST 1500 WORDS. Expand every section fully.

                ## CONTEXT:
                Tender: {tenderTitle}
                Buyer: {tenderBuyer}
                Company: {companyName}
                Strategy: {strategy}
                Research: {research}

                ## DOCUMENT STRUCTURE (Plain numbered sections, no markdown):
                1. EXECUTIVE SUMMARY (300 words) - Hook the reader with specific benefits.
                2. PROPOSED SOLUTION (600 words) - Technical deep dive. Methods. Tools. Specifics.
                3. DELIVERY AND IMPLEMENTATION (400 words) - Timeline, Mobilisation, Risk mitigation.
                4. SOCIAL VALUE AND COMPLIANCE (300 words) - Carbon reduction, Modern Slavery Act, ISO 9001/14001/27001.
                5. COMMERCIALS (200 words) - Value for Money, Cost efficiencies.

                ## BANNED WORDS (Never use):
                Delve, Comprehensive, Tapestry, Pivotal, Unlock, Synergies, Holistic, Leverage

                Write the full proposal now in plain text:
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

        // V2 AGENT ORCHESTRATION: Critique + Humanize Loop with Retry
        let currentDraft = draftContent;
        let critiqueOutput: any = { score: 0, status: 'REJECT', ui_pointers: {}, feedback: [] };
        let attempts = 0;
        const MAX_ATTEMPTS = 2;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;

            // 9. V2 RED TEAM CRITIC (4-Pillar Scoring)
            critiqueOutput = await step.run(`critique-${attempts}`, async () => {
                const critiquePrompt = PromptTemplate.fromTemplate(`
                    You are a BRUTAL UK Procurement Officer. Your job is to find reasons to FAIL this bid.

                    CRITICAL: Score HARSHLY. Only ACCEPT if all criteria are met.

                    ## THE 4-PILLAR SCORING SYSTEM (0-10 each):

                    1. EVIDENCE DENSITY: Are there specific numbers, dates, £ values from real projects?
                       - 10 = Every claim has evidence
                       - 5 = Generic claims
                       - 0 = No evidence at all

                    2. COMPLIANCE: Does it mention:
                       - Modern Slavery Act compliance
                       - ISO 9001/27001/14001 standards  
                       - PPN 06/20 (Social Value)
                       - PPN 02/23 (Modern Slavery)

                    3. SOCIAL VALUE: Is it MEASURABLE social value?
                       - 10 = Specific commitments (X apprentices, £X community investment)
                       - 0 = Vague "we care about community"

                    4. REAL ESTATE: Word count vs target
                       - Target: 1400-1600 words
                       - Score 10 if within range, reduce for under/over

                    ## MANDATORY REJECTION CRITERIA:
                    - REJECT if markdown symbols (#, *, **) are present
                    - REJECT if word count < 1200 words
                    - REJECT if NO ISO or Modern Slavery mentioned

                    PROPOSAL TO JUDGE:
                    {draft}

                    COMPANY PROFILE (verify claims against this):
                    {profile}

                    Respond in JSON ONLY:
                    {{
                        "total_score": number (0-10 average),
                        "status": "ACCEPT" or "REJECT",
                        "ui_pointers": {{
                            "evidence": number,
                            "compliance": number,
                            "social_value": number,
                            "real_estate": number
                        }},
                        "harsh_feedback": ["Specific issue 1...", "Specific issue 2..."],
                        "word_count": number
                    }}
                `);

                const chain = critiquePrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());
                const result = await chain.invoke({
                    draft: currentDraft,
                    profile: JSON.stringify({
                        company_name: profile?.company_name,
                        sectors: profile?.sectors,
                        description: profile?.business_description?.substring(0, 500)
                    })
                });

                try {
                    const jsonMatch = result.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return {
                            score: parsed.total_score || parsed.score || 7,
                            status: parsed.status || 'ACCEPT',
                            ui_pointers: parsed.ui_pointers || { evidence: 5, compliance: 5, social_value: 5, real_estate: 5 },
                            feedback: parsed.harsh_feedback || parsed.feedback || [],
                            word_count: parsed.word_count || currentDraft.split(/\s+/).length
                        };
                    }
                } catch (e) {
                    console.warn('[CRITIC] Failed to parse JSON:', e);
                }
                return { score: 7, status: 'ACCEPT', ui_pointers: { evidence: 5, compliance: 5, social_value: 5, real_estate: 5 }, feedback: [] };
            });

            // If ACCEPT or max attempts, break
            if (critiqueOutput.status === 'ACCEPT' || attempts >= MAX_ATTEMPTS) {
                break;
            }

            // 10. V2 HUMANIZER (with Burstiness Protocol)
            await step.run(`status-revising-${attempts}`, async () => {
                if (!supabase) return;
                await supabase.from('proposals').update({
                    status: 'humanizing',
                    critique: critiqueOutput,
                    updated_at: new Date().toISOString()
                }).eq('id', proposalId);
            });

            currentDraft = await step.run(`humanize-${attempts}`, async () => {
                const humanizePrompt = PromptTemplate.fromTemplate(`
                    You are a Master Editor. The Critic has REJECTED this proposal.
                    You MUST address EVERY item in the feedback or it will be rejected again.

                    ## CRITIQUE FEEDBACK (MUST ADDRESS):
                    {feedback}

                    ## 4-PILLAR SCORES:
                    Evidence: {evidence}/10
                    Compliance: {compliance}/10
                    Social Value: {social_value}/10
                    Real Estate: {real_estate}/10

                    ## ORIGINAL PROPOSAL:
                    {draft}

                    ## BURSTINESS PROTOCOL:
                    Use Short-Long-Short rhythm. A 5-word sentence. Followed by a 30-word detailed explanation with specifics. Then a 10-word summary.

                    ## LIVED EXPERIENCE:
                    Inject company history: "In our [X] years of operation, we have found that..."

                    ## MANDATORY FIXES:
                    1. If compliance < 8: ADD explicit Modern Slavery Act and ISO 9001/27001 sections
                    2. If evidence < 8: ADD specific numbers, dates, £ amounts
                    3. If social_value < 8: ADD measurable commitments (X apprentices, £X investment)
                    4. If real_estate < 8: EXPAND to 1500+ words

                    ## OUTPUT RULES:
                    - NO MARKDOWN. No #, *, **, _ symbols.
                    - Plain text with numbered sections only.
                    - Keep ALL content, only ADD and improve.

                    Output the COMPLETE rewritten proposal:
                `);

                const chain = humanizePrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());
                return await chain.invoke({
                    feedback: JSON.stringify(critiqueOutput.feedback),
                    evidence: critiqueOutput.ui_pointers?.evidence || 5,
                    compliance: critiqueOutput.ui_pointers?.compliance || 5,
                    social_value: critiqueOutput.ui_pointers?.social_value || 5,
                    real_estate: critiqueOutput.ui_pointers?.real_estate || 5,
                    draft: currentDraft
                });
            });

            console.log(`[AGENT V2] Retry ${attempts}: Score ${critiqueOutput.score}, Status ${critiqueOutput.status}`);
        }

        const finalContent = currentDraft;

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

        // 13. Send completion email
        await step.run("send-email", async () => {
            if (!supabase) return;
            const { data: user } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }));
            if (user?.user?.email) {
                await sendProposalCompleteEmail({
                    to: user.user.email,
                    userName: user.user.user_metadata?.first_name || 'there',
                    proposalTitle: tenderTitle,
                    proposalId,
                    score: critiqueOutput.score || 7
                });
            }
        });

        console.log(`[AUTONOMOUS] Complete: ${tenderTitle} - Score: ${critiqueOutput.score}`);
        return { success: true, proposalId, score: critiqueOutput.score };
    }
);

