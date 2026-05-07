#!/bin/bash
# package-skills.sh — Auto-generate .zip for each skill folder
# Run after every release: bash scripts/package-skills.sh

set -e

SKILLS_DIR="$(dirname "$0")/../skills"
echo "Packaging skills from $SKILLS_DIR..."

count=0
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  zip_path="$skill_dir${skill_name}.zip"

  # Remove old zip
  rm -f "$zip_path"

  # Create new zip (exclude any existing zips to avoid recursion)
  (cd "$skill_dir" && zip -r "${skill_name}.zip" . -x "*.zip" -x ".DS_Store" -x "__MACOSX/*" 2>/dev/null)

  echo "  ✅ Packaged: $skill_name"
  count=$((count + 1))
done

echo ""
echo "Packaged $count skills."
echo "Zips written to skills/{name}/{name}.zip"
