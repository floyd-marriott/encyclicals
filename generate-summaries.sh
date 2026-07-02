#!/usr/bin/env bash
set -euo pipefail

MD_DIR="encyclicals/markdown"

while IFS= read -r -d '' file; do
  dir="$(dirname "$file")"
  base="$(basename "$file" .md)"
  out="$dir/$base-summary.md"

  [ -f "$out" ] && echo "SKIP $base" && continue

  echo "=== $base ==="

  opencode run \
    "Summarise this papal document in markdown with four sections:

## Summary
(One paragraph — what is this document about?)

## Historical Context
(When and why it was written, what was happening in the Church and world.)

## Key Themes
(The main theological, doctrinal, or pastoral points. Use a bullet list.)

## Significance
(Why it matters — its impact, legacy, or place in Catholic teaching.)

Write in clear, accessible English prose." \
    --file "$file" \
    --dangerously-skip-permissions \
    < /dev/null \
    > "$out"

  sleep 3
done < <(find "$MD_DIR" -name '*.md' ! -name '*-summary.md' -print0)

echo "All done."
