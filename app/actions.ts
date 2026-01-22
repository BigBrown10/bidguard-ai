"use server"

import { runResearch } from "@/lib/agents/researcher";
import { runDrafter } from "@/lib/agents/drafter";
import { runCritic } from "@/lib/agents/critic";
import { runHumanizer } from "@/lib/agents/humanizer";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { perplexitySonarPro } from "@/lib/perplexity";

export async function performResearch(projectName: string, companyUrl?: string) {
    // In live mode, we would pass the companyUrl if the agent supported it.
    // For now, prompt handles generic research, but let's just pass project name.
    return await runResearch(projectName);
}

// Individual Draft Action to avoid Vercel Timeouts/Rate Limits
export async function performSingleDraft(strategy: "Safe" | "Innovative" | "Disruptive", projectName: string, clientName: string, researchSummary: string) {
    if (!projectName) throw new Error("Project Name required");
    return await runDrafter(strategy, projectName, clientName, researchSummary);
}

// Bulk action (kept for reference, but client will switch to single calls)
export async function performDrafting(projectName: string, clientName: string, researchSummary: string) {
    console.log("Starting parallel drafting...");
    const [safe, innovative, disruptive] = await Promise.all([
        runDrafter("Safe", projectName, clientName, researchSummary),
        runDrafter("Innovative", projectName, clientName, researchSummary),
        runDrafter("Disruptive", projectName, clientName, researchSummary)
    ]);
    return { safe, innovative, disruptive };
}

export async function performCritique(drafts: any, projectName: string) {
    console.log("Starting parallel critique...");
    const [safeCritique, innovativeCritique, disruptiveCritique] = await Promise.all([
        runCritic("Safe", projectName, drafts.safe.executiveSummary),
        runCritic("Innovative", projectName, drafts.innovative.executiveSummary),
        runCritic("Disruptive", projectName, drafts.disruptive.executiveSummary)
    ]);

    return {
        safe: safeCritique,
        innovative: innovativeCritique,
        disruptive: disruptiveCritique
    };
}

import { runWriter } from "@/lib/agents/writer";

export async function performProposaWriting(strategyName: string, originalSummary: string, projectName: string, clientName: string, researchSummary: string) {
    return await runWriter(strategyName, originalSummary, projectName, clientName, researchSummary);
}

export async function performHumanization(text: string) {
    return await runHumanizer(text);
}

import { inngest } from "@/lib/inngest/client";

export async function triggerProposalGeneration(strategyName: string, executiveSummary: string, projectName: string, clientName: string, researchSummary: string) {
    const jobId = crypto.randomUUID(); // Generate ID here

    // 1. Create the job record in Supabase
    if (!supabase) {
        throw new Error("Supabase client not initialized");
    }

    // 0. Get current user (Safe to call now)
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('jobs').insert({
        id: jobId,
        // If user is logged in, attach their ID. This enables the AI to find their profile.
        user_id: user?.id || null,
        status: 'pending',
        result: null
    });

    if (error) {
        console.error("Failed to create job record:", error);
        throw new Error("Database Error: Could not initialize job.");
    }

    // 2. Dispatch the background job
    await inngest.send({
        name: "app/generate-proposal",
        data: {
            jobId,
            strategyName,
            executiveSummary,
            projectName,
            clientName,
            researchSummary
        }
    });

    return jobId; // Return the UUID for polling
}

import { supabase } from "@/lib/supabase";


// SYNCHRONOUS FALLBACK: Run the proposal generation directly if Inngest is offline.
// This risks timeout on Vercel Hobby (10s), so we use the FAST model and simplified chain.
export async function generateRapidProposal(strategyName: string, executiveSummary: string, projectName: string, clientName: string, researchSummary: string, keyFocus?: string) {
    const writerTemplate = `
    ROLE: You are an expert Senior Bid Writer for a top-tier consultancy (e.g. McKinsey/Deloitte).
    TASK: Write a COMPACT BUT IMPACTFUL DRAFT PROPOSAL (approx 1500-2000 words).
    
    CRITICAL INSTRUCTIONS:
    - YOU MUST ADOPT THE PERSONA OF THE WRITER.
    - DO NOT START WITH "I appreciate", "Here is a proposal", or "I cannot".
    - DO NOT MENTION THAT YOU ARE AN AI.
    - DO NOT INCLUDE A "Word Count" LINE AT THE END.
    - START DIRECTLY WITH THE TITLE/CONTENT.
    - USE UK ENGLISH SPELLING.
    
    DETAILS:
    Project: {projectName}
    Client: {clientName}
    Strategy: {strategyName}
    Strategy Summary: {originalSummary}
    User's Key Focus Areas: {keyFocus}
    
    STRUCTURE:
    1. Executive Summary (250 words)
    2. Proposed Solution (600 words)
    3. Delivery & Implementation (400 words)
    4. Commercials & Conclusion (250 words)
    
    TONE: Professional, Convincing, Specific.
    NO MARKDOWN FORMATTING IN HEADERS.
    `;

    const prompt = PromptTemplate.fromTemplate(writerTemplate);
    // Use Pro model for speed (< 5s latency usually)
    const chain = prompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());

    try {
        const text = await chain.invoke({
            strategyName,
            originalSummary: executiveSummary,
            projectName,
            clientName,
            researchSummary,
            keyFocus: keyFocus || "None provided"
        });
        return text;
    } catch (error) {
        console.error("Rapid Gen Failed:", error);
        throw new Error("Rapid Generation Failed");
    }
}

// RAPID STRATEGY GENERATION (Fallback for Drafting Phase)
export async function generateRapidStrategy(projectName: string, clientName: string, researchSummary: string) {
    const strategyTemplate = `
    ROLE: You are a Strategic Bid Director.
    TASK: Create a HIGH-LEVEL STRATEGY SUMMARY for a tender proposal.
    
    PROJECT: {projectName}
    CLIENT: {clientName}
    CONTEXT: {researchSummary}
    
    OUTPUT FORMAT: JSON ONLY.
    {
        "strategyName": "A catchy, professional title (e.g. 'Data-First Transformation')",
        "executiveSummary": "A 150-word summary of the approach.",
        "score": 92
    }
    
    DO NOT WRAP IN MARKDOWN BLOCKS. JUST RAW JSON.
    `;

    const prompt = PromptTemplate.fromTemplate(strategyTemplate);
    const chain = prompt.pipe(perplexitySonarPro).pipe(new StringOutputParser());

    try {
        const jsonText = await chain.invoke({
            projectName,
            clientName,
            researchSummary
        });
        // Clean potential markdown
        const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Rapid Strategy Failed:", error);
        // Absolute worst case fallback if even Rapid fails
        return {
            strategyName: "Rapid Recovery Strategy",
            executiveSummary: "We propose a robust, agile-aligned solution focusing on immediate value delivery and risk mitigation.",
            score: 85
        };
    }
}
