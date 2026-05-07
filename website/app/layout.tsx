import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://avaxskills.com";
const TITLE = "AVAXSKILLS — Build on Avalanche. Your AI Agent Already Knows How.";
const DESCRIPTION =
  "Every Avalanche concept covered — Subnets, Warp, x402, DeFi, RWA, security, and more. Any AI agent fetches exactly what it needs over HTTPS. No install. No config. One URL.";

export const viewport: Viewport = {
  themeColor: "#E84142",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TITLE,
    template: "%s | AVAXSKILLS",
  },

  description: DESCRIPTION,

  keywords: [
    "Avalanche",
    "AVAX",
    "AI agent skills",
    "Subnet deployment",
    "Warp messaging",
    "x402 payments",
    "DeFi Avalanche",
    "RWA tokenization",
    "smart contracts",
    "Claude Code Avalanche",
    "Cursor Avalanche",
    "Copilot Avalanche",
    "Avalanche L1",
    "Teleporter",
    "AvalancheGo",
    "EVM",
    "Web3 developer tools",
    "openskills",
    "SKILL.md",
  ],

  authors: [{ name: "ayomisco_s", url: "https://x.com/ayomisco_s" }],
  creator: "ayomisco_s",
  publisher: "AVAXSKILLS",

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "AVAXSKILLS",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    site: "@ayomisco_s",
    creator: "@ayomisco_s",
    title: "AVAXSKILLS",
    description:
      "Build on Avalanche. Your AI agent already knows how. Every concept covered — Subnets, Warp, x402, DeFi. One URL.",
  },

  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },

  manifest: "/manifest.json",

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  category: "technology",
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
