import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter as requested
import "./globals.css";
import { GlobalHeader } from "@/components/GlobalHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BidGuard AI",
  description: "Agentic bid-writing platform for high-stakes UK procurement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
