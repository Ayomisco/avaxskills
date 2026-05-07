/**
 * sync-skills.mjs
 * Copies all skill markdown files from ../skills/ into public/
 * so they are served as static files alongside the dynamic route.
 * Run: node scripts/sync-skills.mjs
 * Runs automatically via prebuild/predev hooks.
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBSITE_DIR = join(__dirname, "..");
const SKILLS_DIR = join(WEBSITE_DIR, "..", "skills");
const PUBLIC_DIR = join(WEBSITE_DIR, "public");

function copyDir(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const item of readdirSync(src)) {
    if (item.endsWith(".zip") || item === ".DS_Store") continue;
    const srcPath = join(src, item);
    const destPath = join(dest, item);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy each skill directory to public/{skill-name}/
const skills = readdirSync(SKILLS_DIR).filter(
  (d) => statSync(join(SKILLS_DIR, d)).isDirectory()
);

let copied = 0;
for (const skill of skills) {
  const src = join(SKILLS_DIR, skill);
  const dest = join(PUBLIC_DIR, skill);
  copyDir(src, dest);
  copied++;
}

// Also copy root skill files
for (const file of ["SKILL.md", "llms.txt", "AGENTS.md", "sitemap.xml", "robots.txt"]) {
  const src = join(WEBSITE_DIR, "..", file);
  if (existsSync(src)) {
    copyFileSync(src, join(PUBLIC_DIR, file));
  }
}

console.log(`✅ Synced ${copied} skills to public/`);
