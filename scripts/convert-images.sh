#!/usr/bin/env bash
# scripts/convert-images.sh
# Batch-converts all JPEG/PNG images to WebP format for ~50% size reduction.
# Usage: bash scripts/convert-images.sh
# Requires: cwebp (brew install webp)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets/images"
QUALITY=82   # 82 is the sweet spot: visually lossless, ~50% smaller

echo "==> Virar Stationery: WebP Image Conversion Script"
echo "==> Source directory: $ASSETS_DIR"
echo "==> Quality: $QUALITY"
echo ""

# Check cwebp is installed
if ! command -v cwebp &> /dev/null; then
  echo "❌  cwebp not found. Install with: brew install webp"
  exit 1
fi

CONVERTED=0
SKIPPED=0
TOTAL_SAVED=0

find "$ASSETS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while IFS= read -r INPUT_FILE; do
  WEBP_FILE="${INPUT_FILE%.*}.webp"

  # Skip if WebP already exists and is newer than source
  if [[ -f "$WEBP_FILE" && "$WEBP_FILE" -nt "$INPUT_FILE" ]]; then
    echo "  ⏭  Skipped (up to date): $(basename "$WEBP_FILE")"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  ORIGINAL_SIZE=$(wc -c < "$INPUT_FILE")
  cwebp -quiet -q "$QUALITY" "$INPUT_FILE" -o "$WEBP_FILE"
  WEBP_SIZE=$(wc -c < "$WEBP_FILE")

  if [[ $ORIGINAL_SIZE -gt 0 ]]; then
    SAVING=$(( (ORIGINAL_SIZE - WEBP_SIZE) * 100 / ORIGINAL_SIZE ))
    echo "  ✅  $(basename "$INPUT_FILE") → $(basename "$WEBP_FILE") (saved ${SAVING}%)"
  fi

  CONVERTED=$((CONVERTED + 1))
done

echo ""
echo "==> Done: $CONVERTED converted, $SKIPPED skipped."
echo "==> Next step: Update <img> tags to use <picture> with .webp sources."
