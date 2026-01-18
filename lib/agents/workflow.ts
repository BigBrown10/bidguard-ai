import { StateGraph, END } from "@langchain/langgraph";
import { runDrafter } from "./drafter";
import { runCritic } from "./critic";

// Define the state interface
interface BidState {
    projectName: string;
    clientName: string;
    researchSummary: string;
    drafts: Record<string, any>; // Strategy -> Draft Object
    critiques: Record<string, any>; // Strategy -> Critique Object
    iteration: number;
}

// Nodes
async function draftingNode(state: BidState) {
    const strategies = ["Safe", "Innovative", "Disruptive"] as const;
    const newDrafts = { ...state.drafts };

    // minimal parallel execution
    await Promise.all(strategies.map(async (strat) => {
        // Only draft if not already accepted or max iterations not reached
        // For MVP we just re-draft everything
        if (!newDrafts[strat]) {
            newDrafts[strat] = await runDrafter(strat, state.projectName, state.clientName, state.researchSummary);
        }
    }));

    return { drafts: newDrafts };
}

async function critiqueNode(state: BidState) {
    const strategies = ["Safe", "Innovative", "Disruptive"];
    const newCritiques = { ...state.critiques };

    await Promise.all(strategies.map(async (strat) => {
        const draft = state.drafts[strat];
        if (draft) {
            newCritiques[strat] = await runCritic(strat, state.projectName, draft.executiveSummary);
        }
    }));

    return { critiques: newCritiques, iteration: state.iteration + 1 };
}

function shouldContinue(state: BidState) {
    // Check if any score is < 8.5 (mock logic, usually we want at least one good one or all)
    // For MVP demo, we stop after 1 iteration to show result
    if (state.iteration >= 1) {
        return END;
    }
    return "drafting";
}

// Graph Definition
export const workflow = new StateGraph<BidState>({
    channels: {
        projectName: null,
        clientName: null,
        researchSummary: null,
        drafts: {
            reducer: (a, b) => ({ ...a, ...b }),
            default: () => ({})
        },
        critiques: {
            reducer: (a, b) => ({ ...a, ...b }),
            default: () => ({})
        },
        iteration: {
            reducer: (a, b) => b,
            default: () => 0
        }
    }
})
    .addNode("drafting", draftingNode)
    .addNode("critique", critiqueNode)
    .addEdge("drafting", "critique")
    .addConditionalEdges("critique", shouldContinue)
    .setEntryPoint("drafting");

export const bidGraph = workflow.compile();
