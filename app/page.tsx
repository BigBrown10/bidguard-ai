import { LandingPage } from "@/components/home/LandingPage"
import { LatestNews } from "@/components/LatestNews"

export const metadata = {
  title: "BidSwipe AI | Win Government Contracts on Autopilot",
  description: "Deploy autonomous bid agents to finding, qualifying, and writing winning proposals for UK government tenders.",
}

export default function Page() {
  return (
    <LandingPage
      newsSection={<LatestNews />}
    />
  )
}
