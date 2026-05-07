"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
      style={{
        background: copied ? "#fff0f0" : "white",
        borderColor: copied ? "#E84142" : "#e0e0e0",
        color: copied ? "#E84142" : "#6b6b6b",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
