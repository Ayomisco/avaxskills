import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Skills directory is at ../skills/ relative to website/
// In dev: process.cwd() = AVAXSKILLS/website/
// In Vercel: the full repo is cloned, same relative path holds
const SKILLS_DIR = path.join(process.cwd(), "..", "skills");

function getMarkdownHeaders(filename: string) {
  const isJson = filename.endsWith(".json");
  return {
    "Content-Type": isJson
      ? "application/json; charset=utf-8"
      : "text/markdown; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // slug[0] = skill name, slug[1...] = path within skill dir
  // Examples:
  //   /wallet-setup/SKILL.md        → slug = ['wallet-setup', 'SKILL.md']
  //   /subnet-deployment/SKILL.md   → slug = ['subnet-deployment', 'SKILL.md']
  //   /evm-hardhat/rules/RULES.md   → slug = ['evm-hardhat', 'rules', 'RULES.md']
  //   /warp-messaging/references/teleporter-abi.json

  const [skill, ...rest] = slug;

  // Default to SKILL.md if no file specified
  const fileParts = rest.length > 0 ? rest : ["SKILL.md"];

  const filePath = path.join(SKILLS_DIR, skill, ...fileParts);

  // Security: must stay inside skills dir
  const resolved = path.resolve(filePath);
  const skillsDirResolved = path.resolve(SKILLS_DIR);
  if (!resolved.startsWith(skillsDirResolved)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    // Try to give a helpful error
    const skillExists = fs.existsSync(path.join(SKILLS_DIR, skill));
    if (!skillExists) {
      const available = fs.readdirSync(SKILLS_DIR).join(", ");
      return new NextResponse(
        `Skill "${skill}" not found.\n\nAvailable skills:\n${available}`,
        {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }
    return new NextResponse(`File not found: ${fileParts.join("/")}`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const filename = fileParts[fileParts.length - 1];

  return new NextResponse(content, {
    headers: getMarkdownHeaders(filename),
  });
}

// Also handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
