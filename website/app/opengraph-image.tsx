import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AVAXSKILLS — Build on Avalanche. Your AI agent already knows how.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Top: logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="52" height="52" viewBox="0 0 254 254" fill="none">
            <circle cx="127" cy="127" r="127" fill="#E84142" />
            <path d="M149.7 148.7H170.1C174.5 148.7 176.8 148.7 178.2 147.8C179.7 146.8 180.6 145.2 180.7 143.5C180.8 141.8 179.7 139.8 177.6 135.9L137.4 64.2C135.3 60.3 134.2 58.3 132.8 57.6C131.2 56.8 129.4 56.8 127.8 57.6C126.4 58.3 125.3 60.3 123.2 64.2L114.8 79.5C112.4 84 111.3 86.1 110.8 88.3C110.2 90.7 110.2 93.2 110.8 95.6C111.3 97.9 112.5 100.1 114.8 104.4L141.2 153.6C143.5 157.9 144.6 160.1 146.3 161.7C148.1 163.4 150.3 164.6 152.7 165.1C154.9 165.6 157.4 165.2 162.3 164.3" fill="white" />
            <path d="M82.8 148.7H63.1C58.6 148.7 56.3 148.7 54.9 147.8C53.4 146.8 52.5 145.2 52.4 143.5C52.3 141.8 53.4 139.8 55.5 135.9L75.3 100.5C77.4 96.5 78.5 94.6 79.9 93.9C81.4 93.1 83.3 93.1 84.8 93.9C86.2 94.6 87.3 96.5 89.4 100.5L109.2 135.9C111.3 139.8 112.4 141.8 112.3 143.5C112.2 145.2 111.3 146.8 109.8 147.8C108.4 148.7 106.1 148.7 101.5 148.7H82.8Z" fill="white" />
          </svg>
          <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#E84142" }}>AVAX</span>
            <span style={{ color: "#0f0f0f" }}>SKILLS</span>
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#0f0f0f",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            Build on Avalanche.
            <br />
            <span style={{ color: "#E84142" }}>Your AI agent</span>
            <br />
            already knows how.
          </div>
          <div style={{ fontSize: "22px", color: "#6b6b6b", fontWeight: 400 }}>
            Every Avalanche concept covered — Subnets, Warp, x402, DeFi, RWA, security.
            Any AI agent. One URL.
          </div>
        </div>

        {/* Bottom: URL */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              fontSize: "18px",
              fontFamily: "monospace",
              background: "#fafafa",
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              padding: "10px 18px",
              color: "#0f0f0f",
            }}
          >
            Read https://avaxskills.com/SKILL.md before building on Avalanche.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
