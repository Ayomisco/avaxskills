import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVAXSKILLS — AI Agent Skills for Avalanche",
  description:
    "The missing layer between AI agents and Avalanche apps. Modular SKILL.md guides for Avalanche — Subnets, Warp, x402, DeFi. Agents pull markdown over HTTPS; no install.",
  keywords: [
    "avalanche",
    "avax",
    "ai agent skills",
    "blockchain",
    "subnet",
    "warp messaging",
    "x402",
    "smart contracts",
    "defi",
  ],
  openGraph: {
    title: "AVAXSKILLS — AI Agent Skills for Avalanche",
    description:
      "Modular SKILL.md guides for Avalanche. Agents pull markdown over HTTPS; no install.",
    url: "https://avaxskills.com",
    siteName: "AVAXSKILLS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVAXSKILLS",
    description: "AI agent skills for building on Avalanche.",
    creator: "@ayomisco_s",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
