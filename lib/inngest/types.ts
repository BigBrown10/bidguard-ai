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

type GenerateAutonomousProposalEvent = {
    data: {
        proposalId: string;
        userId: string;
        tenderId: string;
        tenderTitle: string;
        tenderBuyer: string;
        ideaInjection: string;
    };
};

export const schemas = new EventSchemas().fromRecord<{
    "app/generate-proposal": GenerateProposalEvent;
    "app/generate-autonomous-proposal": GenerateAutonomousProposalEvent;
}>();

