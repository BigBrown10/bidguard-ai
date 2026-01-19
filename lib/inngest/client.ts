import { Inngest } from "inngest";
import { schemas } from "./types"; // We will define types next

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "bidguard-ai",
    schemas
});
