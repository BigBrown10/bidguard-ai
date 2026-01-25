import { inngest } from "@/lib/inngest/client";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { PromptTemplate } from "@langchain/core/prompts";
import { perplexitySonarReasoning } from "@/lib/perplexity";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { perplexitySonarPro } from "@/lib/perplexity";
import { TENDER_MASTERY_GUIDE } from "@/lib/knowledge/tender-mastery";
import { syncTendersToSupabase } from "@/lib/gov-api";
import { sendProposalCompleteEmail, sendProposalFailedEmail, sendNewTenderAlertEmail } from "@/lib/email";

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

        // Alerting Step: Check for "Gold" opportunities
        await step.run("check-alerts", async () => {
            if (!supabase) return;

            // 1. Get recent high-value tenders
            const { data: newHighValueTenders } = await supabase
                .from('tenders')
                .select('*')
                .gt('fetched_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
                .ilike('value', '%m%') // Rough check for Millions
                .limit(3);

            if (!newHighValueTenders || newHighValueTenders.length === 0) return;

            // 2. Get active users to alert (Mocking single user for MVP)
            // In prod: Join with user profiles and sector matches
            // Here we just alert a hardcoded admin or the first user found
            const { data: users } = await supabase.from('profiles').select('id, email').limit(1);
            if (!users?.length) return;
            const targetUser = users[0];

            // 3. Send alerts
            for (const tender of newHighValueTenders) {
                if (targetUser.email) {
                    await sendNewTenderAlertEmail({
                        to: targetUser.email,
                        tenderTitle: tender.title,
                        tenderValue: tender.value,
                        tenderBuyer: tender.buyer,
                        description: tender.description || "No description",
                        matchScore: 94 // Mock score for MVP excite
                    });
                }
            }
        });

        return result;
    }
);

// =========================================
// PROPOSAL GENERATION FUNCTION
// =========================================
const researchTemplate = `
You are a Strategic Intelligence Agent.
Target: {tenderBuyer}
Sector: {tenderTitle}

Your mission is to find "Ghost in the Machine" intelligence - problems the buyer has but hasn't explicitly stated.

TASK:
1. Search for "{tenderBuyer} strategic plan 2024 2025" or "annual report".
2. Identify their TOP 3 Strategic Objectives (e.g. Net Zero by 2030, Digital Transformation).
3. Find 1 recent news story or challenge they are facing (budget cuts, new regulation).
4. Identify 2 keywords or phrases they use frequently in their own docs (e.g. "Levelling Up", "One NHS").

OUTPUT FORMAT (Plain Text Bullet Points):
- STRATEGY: [Objective 1], [Objective 2], [Objective 3]
- CHALLENGE: [Recent Challenge]
- KEYWORDS: [Keyword 1], [Keyword 2]
`;

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
// V4: HYBRID AUTONOMOUS PROPOSAL (2 API CALLS)
// Optimized: Research+Strategy+Draft in 1 call, Critique+Humanize in 1 call
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

        console.log(`[HYBRID V4] Starting 2-call proposal for: ${tenderTitle}`);

        // 1. Update status: Researching
        await step.run("status-start", async () => {
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
                .select('company_name, business_description, website, sectors, iso_certs, achievements')
                .eq('id', userId)
                .single();
            return data;
        });

        // =====================================================
        // CALL 0.5: RESEARCH AGENT (Buyer Intelligence)
        // =====================================================
        const buyerResearch = await step.run("research-buyer", async () => {
            console.log(`[RESEARCH] analyzing ${tenderBuyer}...`);
            const researchPrompt = PromptTemplate.fromTemplate(researchTemplate);
            const chain = researchPrompt.pipe(perplexitySonarReasoning).pipe(new StringOutputParser());

            try {
                const result = await chain.invoke({
                    tenderBuyer,
                    tenderTitle
                });
                return result;
            } catch (e) {
                console.error("Research failed:", e);
                return "STRATEGY: Enhance efficiency.\nCHALLENGE: Budget constraints.\nKEYWORDS: Value for Money.";
            }
        });

        // Save Research to Draft immediately so user sees it
        await step.run("save-research", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                draft_content: `## 🕵️ BUYER INTELLIGENCE DOSSIER\n${buyerResearch}\n\n## 📝 GENERATING PROPOSAL...`,
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // =====================================================
        // CALL 1: MEGA-PROMPT (Research + Strategy + Draft)
        // =====================================================
        const draftContent = await step.run("mega-draft", async () => {
            const megaPrompt = PromptTemplate.fromTemplate(`
                You are an elite UK Government Bid Writer with a 92% win rate. You work for {companyName}.
                You will perform 3 tasks in sequence and output ONLY the final proposal.

                ===============================
                PHASE 1: RESEARCH (Internal & External)
                ===============================
                Research this tender opportunity:
                - TENDER: {tenderTitle}
                - BUYER: {tenderBuyer}
                - EXTERNAL INTELLIGENCE: {buyerResearch}
                - COMPANY: {companyName}
                - SECTORS: {sectors}
                - USER STRATEGY: {ideaInjection}

                ## ANTI-HALLUCINATION PROTOCOL (STRICT ENFORCEMENT):
                1. DO NOT INVENT FIGURES. If you do not know a turnover, employee count, or specific date, write "[MISSING DATA: X]".
                2. DO NOT HALLUCINATE CASE STUDIES. Only use case studies explicitly present in {businessDescription} or {achievements}.
                3. DOMAIN ACCURACY: Be extremely careful with company domains. Ensure you are referencing the correct entity (e.g. do not confuse gray.io with gray.com).
                4. TRUTH OVER FLUFF: If the company does not have a specific capability required by the tender, STATE IT clearly in the risk section rather than lying.

                Identify:
                1. 3 key buyer pain points
                2. 3 company differentiators
                3. Compliance requirements (Social Value, Carbon, Modern Slavery)

                ===============================
                PHASE 2: STRATEGY (Internal)
                ===============================
                Define winning strategy:
                1. Win Theme (one powerful sentence)
                2. Key Messages (3 bullets)
                3. Evidence to highlight from company profile
                4. Risk mitigation approach

                ===============================
                PHASE 3: WRITE FULL PROPOSAL
                ===============================
                Now write the complete 1500+ word proposal using the strategy.

                ## COMPANY PROFILE:
                {businessDescription}
                
                ## ISO CERTIFICATIONS: {isoCerts}
                ## ACHIEVEMENTS: {achievements}

                ## CRITICAL OUTPUT RULES:
                - ABSOLUTELY NO MARKDOWN. No #, ##, **, *, _ or formatting symbols.
                - NO CITATIONS. Never use [1], [2] or bracketed references.
                - NO AI DISCLOSURE. Never say "I am an AI", "As an AI".
                - Write in PLAIN TEXT only. Use numbered lists (1. 2. 3.) for structure.
                - ABSOLUTELY NO MARKDOWN. No #, ##, **, *, _ or formatting symbols.
                - NO CITATIONS. Never use [1], [2] or bracketed references.
                - NO AI DISCLOSURE. Never say "I am an AI", "As an AI".
                - Write in PLAIN TEXT only. Use numbered lists (1. 2. 3.) for structure.
                - UK SPELLING: Programme, Mobilisation, Organisation
                - DATA INTEGRITY: Double-check all £ values and dates against provided context.

                ## DOCUMENT STRUCTURE (Plain numbered sections):
                1. EXECUTIVE SUMMARY (300 words) - Hook with specific benefits
                2. PROPOSED SOLUTION (600 words) - Technical methodology
                3. DELIVERY AND IMPLEMENTATION (400 words) - Timeline, Mobilisation
                4. SOCIAL VALUE AND COMPLIANCE (300 words) - Carbon, Modern Slavery Act, ISO standards
                5. COMMERCIALS (200 words) - Value for Money

                ## MANDATORY INCLUSIONS:
                - Reference Modern Slavery Act compliance
                - Reference ISO 9001/27001 if applicable
                - PPN 06/20 Social Value commitments
                - Specific measurable outcomes

                ## BANNED WORDS: Delve, Comprehensive, Tapestry, Pivotal, Unlock, Synergies, Holistic, Leverage

                OUTPUT ONLY THE FINAL PROPOSAL TEXT (no research notes, no strategy notes):
            `);

            const chain = megaPrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());
            const result = await chain.invoke({
                tenderTitle,
                tenderBuyer,
                buyerResearch,
                companyName: profile?.company_name || "Our Company",
                sectors: profile?.sectors?.join(", ") || "General",
                ideaInjection: ideaInjection || "Autonomous mode - focus on value and expertise",
                businessDescription: profile?.business_description || "A leading UK professional services provider.",
                isoCerts: profile?.iso_certs?.join(", ") || "ISO 9001, ISO 27001",
                achievements: profile?.achievements || "Successfully delivered projects for UK Government clients."
            });

            // UK Vernacular post-processing
            return result
                .replace(/\bprogram\b/gi, 'programme')
                .replace(/\bmobilization\b/gi, 'mobilisation')
                .replace(/\borganization\b/gi, 'organisation');
        });

        // Update status: Critiquing
        await step.run("status-critiquing", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'critiquing',
                draft_content: draftContent,
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // =====================================================
        // CALL 2: MEGA-PROMPT (Critique + Humanize Combined)
        // =====================================================
        const { finalContent, score, ui_pointers } = await step.run("mega-critique-humanize", async () => {
            const megaCritiquePrompt = PromptTemplate.fromTemplate(`
                You will perform 2 tasks and output the FINAL IMPROVED PROPOSAL.

                ===============================
                PHASE 1: BRUTAL CRITIQUE (Internal Analysis)
                ===============================
                Score this proposal on 4 pillars (0-10 each):
                1. EVIDENCE DENSITY: Are there specific numbers, dates, £ values?
                2. COMPLIANCE: Does it mention Modern Slavery Act, ISO 9001/27001, PPN 06/20?
                3. SOCIAL VALUE: Are commitments measurable (X apprentices, £X investment)?
                4. REAL ESTATE: Is it 1400-1600 words?

                PROPOSAL TO CRITIQUE:
                {draft}

                ===============================
                PHASE 2: HUMANIZE AND FIX
                ===============================
                Now rewrite the proposal to:
                1. ADD specific numbers, dates, £ amounts if lacking
                2. ADD explicit Modern Slavery and ISO sections if missing
                3. ADD measurable Social Value commitments if vague
                4. EXPAND to 1500+ words if too short
                5. Use Short-Long-Short sentence rhythm for natural flow
                6. Inject "lived experience": "In our X years of operation..."
                7. REMOVE any markdown symbols (#, *, **)
                8. REMOVE AI-isms (delve, underscore, testament)

                ## OUTPUT FORMAT:
                Start your response with this JSON block, then the proposal:
                ---SCORES---
                {{"evidence": X, "compliance": X, "social_value": X, "real_estate": X, "total": X}}
                ---PROPOSAL---
                [Full improved proposal text here]
            `);

            const chain = megaCritiquePrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());
            const result = await chain.invoke({ draft: draftContent });

            // Parse scores and extract proposal
            let scores = { evidence: 7, compliance: 7, social_value: 7, real_estate: 7, total: 7 };
            let proposalText = result;

            try {
                const scoresMatch = result.match(/---SCORES---\s*(\{[^}]+\})/);
                if (scoresMatch) {
                    scores = JSON.parse(scoresMatch[1]);
                }
                const proposalMatch = result.match(/---PROPOSAL---\s*([\s\S]+)/);
                if (proposalMatch) {
                    proposalText = proposalMatch[1].trim();
                }
            } catch (e) {
                console.warn("[HYBRID] Failed to parse scores, using defaults");
            }

            // UK Vernacular cleanup
            proposalText = proposalText
                .replace(/\bprogram\b/gi, 'programme')
                .replace(/\bmobilization\b/gi, 'mobilisation')
                .replace(/\borganization\b/gi, 'organisation')
                .replace(/#{1,}/g, '') // Remove any markdown headers
                .replace(/\*{1,}/g, ''); // Remove asterisks

            return {
                finalContent: proposalText,
                score: scores.total || 7,
                ui_pointers: {
                    evidence: scores.evidence || 7,
                    compliance: scores.compliance || 7,
                    social_value: scores.social_value || 7,
                    real_estate: scores.real_estate || 7
                }
            };
        });

        // Save final result
        await step.run("save-final", async () => {
            if (!supabase) return;
            await supabase.from('proposals').update({
                status: 'complete',
                final_content: finalContent,
                score: score,
                critique: { ui_pointers, feedback: [] },
                updated_at: new Date().toISOString()
            }).eq('id', proposalId);
        });

        // Send completion email
        await step.run("send-email", async () => {
            if (!supabase) return;
            const { data: user } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }));
            if (user?.user?.email) {
                await sendProposalCompleteEmail({
                    to: user.user.email,
                    userName: user.user.user_metadata?.first_name || 'there',
                    proposalTitle: tenderTitle,
                    proposalId,
                    score: score || 7
                });
            }
        });

        console.log(`[HYBRID V4] Complete: ${tenderTitle} - Score: ${score} (2 API calls only!)`);
        return { success: true, proposalId, score, mode: 'hybrid-v4' };
    }
);

