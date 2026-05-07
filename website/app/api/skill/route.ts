import { NextRequest, NextResponse } from "next/server";
import skillsData from "../../../public/skills.json";

const BASE_URL = "https://avaxskills.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? "";
  const format = searchParams.get("format") ?? "json";
  const depth = parseInt(searchParams.get("depth") ?? "1");

  const skills = (skillsData as { skills: Array<{ name: string; description: string; tier: number; skillUrl: string; related_skills?: string[] }> }).skills;

  const matches = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(topic.toLowerCase()) ||
      s.description.toLowerCase().includes(topic.toLowerCase())
  );

  if (matches.length === 0) {
    return NextResponse.json(
      { error: "No skills found", topic },
      {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  const result = matches.map((s) => ({
    ...s,
    fetchUrl: s.skillUrl,
    curlCommand: `curl -sSL ${s.skillUrl}`,
    ...(depth >= 2 && s.related_skills
      ? {
          relatedUrls: s.related_skills.map(
            (r: string) => `${BASE_URL}/${r}/SKILL.md`
          ),
        }
      : {}),
  }));

  if (format === "markdown") {
    const md = result
      .map((s) => `## ${s.name}\n${s.description}\n\nFetch: \`${s.fetchUrl}\``)
      .join("\n\n---\n\n");
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return NextResponse.json(
    { topic, count: result.length, skills: result },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
