"use server"

import { runResearch } from "@/lib/agents/researcher";
import { runDrafter } from "@/lib/agents/drafter";
import { runCritic } from "@/lib/agents/critic";
import { runHumanizer } from "@/lib/agents/humanizer";

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

    // 1. Create the job record in Supabase immediately so polling works
    // Use the admin client (or safe server action client) if needed, but standard client works here
    // Note: We need to import supabase here.
    const { error } = await supabase.from('jobs').insert({
        id: jobId,
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

