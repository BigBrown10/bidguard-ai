import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { perplexitySonarPro } from "@/lib/perplexity"
import { verifyCompany } from "@/lib/companies-house"

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch { }
                    },
                },
            }
        )

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { companyName, website, currentDescription, companiesHouseNumber } = await req.json()

        if (!companyName) {
            return NextResponse.json({ error: "Company name required" }, { status: 400 })
        }

        // Optional: Verify with Companies House
        let companyVerification = null
        if (companiesHouseNumber) {
            companyVerification = await verifyCompany(companiesHouseNumber)
        }

        // AI Research on company
        const researchPrompt = PromptTemplate.fromTemplate(`
            You are a business research analyst. Research this company and create an enhanced company description.

            COMPANY NAME: {companyName}
            WEBSITE: {website}
            CURRENT DESCRIPTION: {currentDescription}

            TASK:
            1. Research what this company does online
            2. Find their key services, achievements, and differentiators
            3. Write a professional 150-200 word company bio suitable for UK Government bid proposals
            4. Include: years in business (if found), key services, notable clients/projects, certifications mentioned online

            RULES:
            - Be factual, don't invent information
            - Write in third person ("The company..." or use company name)
            - Professional tone suitable for government tenders
            - If you can't find much, enhance the current description with better structure

            Output ONLY the enhanced company description, no preamble:
        `)

        const chain = researchPrompt.pipe(perplexitySonarPro).pipe(new StringOutputParser())

        const suggestion = await chain.invoke({
            companyName,
            website: website || "Not provided",
            currentDescription: currentDescription || "No description provided"
        })

        return NextResponse.json({
            success: true,
            suggestion: suggestion.trim(),
            verification: companyVerification
        })

    } catch (error: unknown) {
        console.error("Company research error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Research failed" },
            { status: 500 }
        )
    }
}
