import { NextRequest, NextResponse } from "next/server";
import skillsData from "../../../public/skills.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();

  if (!q) {
    return NextResponse.json(
      { error: "Missing query param: q" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const skills = (skillsData as { skills: Array<{ name: string; description: string; skillUrl: string; tier: number; trigger?: string }> }).skills;

  const scored = skills
    .map((s) => {
      let score = 0;
      if (s.name.toLowerCase().includes(q)) score += 10;
      if (s.description.toLowerCase().includes(q)) score += 5;
      if (s.trigger?.toLowerCase().includes(q)) score += 3;
      return { ...s, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score: _score, ...s }) => s);

  return NextResponse.json(
    { q, count: scored.length, results: scored },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
