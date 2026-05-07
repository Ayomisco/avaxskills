import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const SKILLS_DIR = path.join(__dirname, "..", "skills");
const MAX_LINES = 500;

const REQUIRED_FRONTMATTER = [
  "name",
  "version",
  "spec",
  "license",
  "tier",
  "description",
  "trigger",
  "last_updated",
];

const REQUIRED_SECTIONS = [
  "## Overview",
  "## When to fetch",
  "## Core Workflow",
  "## Key concepts",
  "## Common errors",
  "## Next skills",
];

interface ValidationResult {
  skill: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function validateSkill(skillDir: string): ValidationResult {
  const skillName = path.basename(skillDir);
  const skillFile = path.join(skillDir, "SKILL.md");
  const result: ValidationResult = {
    skill: skillName,
    passed: true,
    errors: [],
    warnings: [],
  };

  if (!fs.existsSync(skillFile)) {
    result.errors.push("SKILL.md not found");
    result.passed = false;
    return result;
  }

  const content = fs.readFileSync(skillFile, "utf8");
  const lines = content.split("\n");

  // Check line count
  if (lines.length > MAX_LINES) {
    result.errors.push(
      `SKILL.md exceeds ${MAX_LINES} lines (${lines.length} lines). Move content to references/.`
    );
    result.passed = false;
  }

  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    result.errors.push("Missing YAML frontmatter");
    result.passed = false;
    return result;
  }

  let frontmatter: Record<string, unknown> = {};
  try {
    frontmatter = yaml.load(frontmatterMatch[1]) as Record<string, unknown>;
  } catch (e) {
    result.errors.push(`Invalid YAML frontmatter: ${e}`);
    result.passed = false;
    return result;
  }

  // Check required frontmatter fields
  for (const field of REQUIRED_FRONTMATTER) {
    if (frontmatter[field] === undefined || frontmatter[field] === null || frontmatter[field] === "") {
      result.errors.push(`Missing frontmatter field: ${field}`);
      result.passed = false;
    }
  }

  // Check spec version
  if (frontmatter.spec !== "agentskills@1.0") {
    result.warnings.push(
      `spec should be "agentskills@1.0", got "${frontmatter.spec}"`
    );
  }

  // Check license
  if (frontmatter.license !== "Apache-2.0") {
    result.errors.push('license must be "Apache-2.0"');
    result.passed = false;
  }

  // Check tier
  const tier = frontmatter.tier as number;
  if (tier === undefined || tier === null || tier < 0 || tier > 6) {
    result.errors.push("tier must be a number 0-6");
    result.passed = false;
  }

  // Check required sections
  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      result.errors.push(`Missing required section: ${section}`);
      result.passed = false;
    }
  }

  // Check skill name matches folder
  if (frontmatter.name !== skillName) {
    result.errors.push(
      `Frontmatter name "${frontmatter.name}" does not match folder name "${skillName}"`
    );
    result.passed = false;
  }

  // Warnings for missing optional folders
  if (!fs.existsSync(path.join(skillDir, "rules"))) {
    result.warnings.push("No rules/ directory — consider adding guardrails");
  }
  if (!fs.existsSync(path.join(skillDir, "references"))) {
    result.warnings.push(
      "No references/ directory — consider adding deep docs"
    );
  }

  return result;
}

function main() {
  const skillDirs = fs
    .readdirSync(SKILLS_DIR)
    .map((d) => path.join(SKILLS_DIR, d))
    .filter((d) => fs.statSync(d).isDirectory());

  let totalPassed = 0;
  let totalFailed = 0;

  console.log(`\nValidating ${skillDirs.length} skills...\n`);

  for (const skillDir of skillDirs) {
    const result = validateSkill(skillDir);

    if (result.passed) {
      console.log(`✅ ${result.skill}`);
      totalPassed++;
    } else {
      console.log(`❌ ${result.skill}`);
      totalFailed++;
    }

    for (const error of result.errors) {
      console.log(`   ERROR: ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`   WARN:  ${warning}`);
    }
  }

  console.log(
    `\n${totalPassed} passed, ${totalFailed} failed out of ${skillDirs.length} skills\n`
  );

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
