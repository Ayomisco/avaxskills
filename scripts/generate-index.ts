import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const SKILLS_DIR = path.join(__dirname, "..", "skills");
const BASE_URL = "https://avaxskills.com";

interface SkillMeta {
  name: string;
  version: string;
  tier: number;
  description: string;
  trigger: string;
  last_updated: string;
  avalanche_networks?: string[];
  related_skills?: string[];
  url: string;
  skillUrl: string;
}

function parseSkillMeta(skillDir: string): SkillMeta | null {
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) return null;

  const content = fs.readFileSync(skillFile, "utf8");
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  try {
    const fm = yaml.load(frontmatterMatch[1]) as Record<string, unknown>;
    const name = fm.name as string;
    return {
      name,
      version: (fm.version as string) || "1.0.0",
      tier: (fm.tier as number) ?? 1,
      description: (fm.description as string) || "",
      trigger: (fm.trigger as string) || "",
      last_updated: (fm.last_updated as string) || "",
      avalanche_networks: fm.avalanche_networks as string[] | undefined,
      related_skills: fm.related_skills as string[] | undefined,
      url: `${BASE_URL}/${name}/`,
      skillUrl: `${BASE_URL}/${name}/SKILL.md`,
    };
  } catch {
    return null;
  }
}

function main() {
  const skillDirs = fs
    .readdirSync(SKILLS_DIR)
    .map((d) => path.join(SKILLS_DIR, d))
    .filter((d) => fs.statSync(d).isDirectory());

  const skills: SkillMeta[] = [];

  for (const skillDir of skillDirs) {
    const meta = parseSkillMeta(skillDir);
    if (meta) skills.push(meta);
  }

  // Sort by tier, then name
  skills.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

  // Write skills.json
  const index = {
    generated: new Date().toISOString(),
    count: skills.length,
    baseUrl: BASE_URL,
    rootSkill: `${BASE_URL}/SKILL.md`,
    skills,
  };

  const outDir = path.join(__dirname, "..", "website", "public");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "skills.json");
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
  console.log(`Generated ${outPath} with ${skills.length} skills`);

  // Also write a flat list for llms.txt auto-update
  const listLines = skills.map(
    (s) => `- ${s.skillUrl} — ${s.description.split("\n")[0]}`
  );
  console.log("\nSkills list:");
  listLines.forEach((l) => console.log(l));
}

main();
