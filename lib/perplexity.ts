import { ChatOpenAI } from "@langchain/openai";

// Ensure you have ERA_API_KEY or PERPLEXITY_API_KEY in .env.local
const apiKey = process.env.ERA_API_KEY || process.env.PERPLEXITY_API_KEY;

if (!apiKey) {
    console.warn("Missing PERPLEXITY_API_KEY. functionality will be limited.");
}

export const perplexitySonarPro = new ChatOpenAI({
    apiKey: apiKey,
    configuration: {
        baseURL: "https://api.perplexity.ai",
    },
    modelName: "sonar-pro",
    temperature: 0.1, // Low temp for factual research
});

export const perplexitySonarReasoning = new ChatOpenAI({
    apiKey: apiKey,
    configuration: {
        baseURL: "https://api.perplexity.ai",
    },
    modelName: "sonar-reasoning",
    temperature: 0.4, // Balanced for creative drafting/critique
});
