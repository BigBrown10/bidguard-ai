# Bidswipe: Autonomous Government Procurement Agent

Bidswipe AI (formerly Gravitic Observatory) is a next-generation procurement intelligence platform that uses autonomous AI agents to find, analyze, and bid on government contracts.

Powered by **Gemini 3.0 Flash**, our agents don't just write text—they research buyers, formulate win strategies, and draft compliant, high-scoring proposals automatically.

![Bidswipe Interface](public/og-image.png)

## 🚀 Key Functionalities

### 🧠 Autonomous Proposal Generation
Unlike standard "AI writers" that just autocomplete text, Bidswipe uses a multi-step agentic workflow:
1.  **Ingestion Agent**: Reads and indexes 50+ page tender documents.
2.  **Research Agent**: Scours the web for buyer context, strategic plans, and competitor data.
3.  **Strategy Agent**: Formulates "Win Themes" and identifies key evaluation criteria.
4.  **Drafting Agent**: Writes the full proposal, adhering to strict word counts and compliance matrices.
5.  **Critique Agent**: Brutally scores a report and rewrite corrections

### ⚡ Powered by Gemini 3.0
We are one of the first platforms to integrate Google's **Gemini 3.0 Flash** model (experimental) as our default reasoning engine.
-   **1M+ Token Context**: Allows us to ingest the entire history of buyer procurement.
-   **Reasoning Speed**: Generates complex, multi-page proposals in under 60 seconds.
-   **Accuracy**: Significantly reduced hallucinations compared to previous generation models.


### 📱 "Tinder for Tenders" Interface
-   **Swipe Logic**: Rapidly qualify or disqualify opportunities with a simple swipe PASS/BID interface.
-   **Smart Filters**: Auto-classification of tenders into sectors (Healthcare, Defence, IT, Construction) using NLP.
-   **Context and Auto generation**: Users can give context for their proposal or let the agent generate ideas based on company profile.

### 📰 Automated Market Intelligence
-   **Daily Scraper**: The `Black Ops` scraper monitors public portals 24/7.
-   **News Agent**: Automatically generates daily blog posts and strategic briefs on market trends using the same Gemini 3.0 backbone.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 15 (App Router), TailwindCSS, Framer Motion
-   **Backend**: Supabase (PostgreSQL + Auth), Inngest (Serverless Queues)
-   **AI**: LangChain, Google Gemini 3.0 Flash, Perplexity Sonar
-   **Infrastructure**: Vercel

## 📦 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/BigBrown10/bidguard-ai.git
    cd bidguard-ai
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # Note: We use legacy peer deps due to bleeding edge LangChain/Next.js versions
    npm install --legacy-peer-deps
    ```

3.  **Set up environment variables**:
    Create a `.env.local` file with:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
    GEMINI_API_KEY=...
    PERPLEXITY_API_KEY=...
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 📄 License

Proprietary software. All rights reserved.
