
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from "dotenv"
import path from "path"

// Use process.cwd() to resolve path from project root
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("No API KEY found in .env.local")
        return
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Test a range of potential model IDs
    const modelsToTest = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-3.0-flash",
        "gemini-3.0-flash-exp",
        "gemini-3.0-pro-exp"
    ]

    console.log("Checking model availability...")

    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} ... `)
        try {
            const model = genAI.getGenerativeModel({ model: modelName })
            // Try a minimal generation to confirm access
            await model.generateContent("Hello")
            console.log(`✅ AVAILABLE`)
        } catch (e: any) {
            if (e.message && (e.message.includes("404") || e.message.includes("not found"))) {
                console.log(`❌ Not Found`)
            } else if (e.message && (e.message.includes("403") || e.message.includes("permission"))) {
                console.log(`⛔ Permission Denied`)
            } else {
                console.log(`❓ Error: ${e.message.split('\n')[0].substring(0, 50)}`)
            }
        }
    }
}

listModels()
