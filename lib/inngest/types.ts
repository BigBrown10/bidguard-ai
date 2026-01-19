import { EventSchemas } from "inngest";

type GenerateProposalEvent = {
    data: {
        jobId: string;
        strategyName: string;
        executiveSummary: string;
        projectName: string;
        clientName: string;
        researchSummary: string;
    };
};

export const schemas = new EventSchemas().fromRecord<{
    "app/generate-proposal": GenerateProposalEvent;
}>();
