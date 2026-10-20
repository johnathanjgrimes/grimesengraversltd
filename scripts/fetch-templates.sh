#!/bin/bash
# Download Crystal Galleries' engraving templates for every award on the live site into supplier-templates/.
# Safe to run again: it only fetches templates you don't already have (one per second, to be polite).
# The folder is git-ignored, so the supplier's artwork is never pushed or published.
set -u
cd "$(dirname "$0")/.." || exit 1
mkdir -p supplier-templates && cd supplier-templates || exit 1

curl -s https://grimesengravers.com/awards-index.json \
  | python3 -c "import json,sys; print('\n'.join(json.load(sys.stdin)))" > codes.txt

rm -f missing.txt
while read -r code; do
  [ -f "$code.pdf" ] && continue
  if ! curl -sfL -o "$code.pdf" "https://portal.crystalgalleries.co.uk/upload/glass_templates/$code.pdf"; then
    rm -f "$code.pdf"; echo "$code" >> missing.txt
  fi
  sleep 1
done < codes.txt

echo "Templates: $(ls *.pdf 2>/dev/null | wc -l | tr -d ' ')  Missing: $(cat missing.txt 2>/dev/null | wc -l | tr -d ' ')  Folder: $(pwd)"
