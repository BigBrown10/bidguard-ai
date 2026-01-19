import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateProposalFunction } from "@/lib/inngest/functions"; // We will create this next

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generateProposalFunction,
    ],
});
