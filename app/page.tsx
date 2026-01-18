import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Header } from "@/components/Header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center text-center px-4">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
            v1.0.0 Public Beta
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-primary">
            BidGuard AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            The autonomous &quot;Red Team&quot; for high-stakes UK procurement.
            Research, draft, and critique bids until they win.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Link href="/ingest">
              <Button size="lg" className="h-14 px-8 text-lg shadow-lg hover:shadow-xl transition-all">
                Start New Bid
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-2">
              View History
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
