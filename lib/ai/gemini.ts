import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Missing GOOGLE_API_KEY or GEMINI_API_KEY. Gemini functionality will not work.");
}

// Gemini 3 Flash (User requested "Gemini 3", mapping to latest 2.0 Flash Experimental)
export const geminiFlash = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: "gemini-2.0-flash-exp",
    maxOutputTokens: 8192,
    temperature: 0.7,
});

// Fallback / Pro model
export const geminiPro = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: "gemini-1.5-pro",
    maxOutputTokens: 8192,
    temperature: 0.7,
});
