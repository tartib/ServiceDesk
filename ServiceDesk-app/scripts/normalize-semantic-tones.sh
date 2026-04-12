#!/bin/bash
# Design System — Normalize decorative tones to strict 6 semantic tones
# Mapping: purple/indigo/cyan→info, orange/amber→warning, emerald/teal→success, pink→destructive, slate→muted
# Run from ServiceDesk-app/

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP="$DIR/app"
COMP="$DIR/components"

echo "=== Normalizing decorative tones to semantic tones ==="
echo "Working in: $DIR"
echo ""

do_replace() {
  local pattern="$1"
  local replacement="$2"
  find "$APP" "$COMP" \( -name '*.tsx' -o -name '*.ts' \) \
    ! -path '*/node_modules/*' \
    -exec perl -pi -e "s|$pattern|$replacement|g" {} +
}

# ─── PURPLE → INFO ───
echo "purple → info..."
do_replace '\bbg-purple-light\b' 'bg-info-soft'
do_replace '\bbg-purple/10\b' 'bg-info-soft'
do_replace '\bbg-purple/15\b' 'bg-info-soft'
do_replace '\bbg-purple/20\b' 'bg-info-soft'
do_replace '\bbg-purple\b' 'bg-info'
do_replace '\btext-purple\b' 'text-info'
do_replace '\bborder-purple/20\b' 'border-info/20'
do_replace '\bborder-purple\b' 'border-info'
do_replace '\bring-purple\b' 'ring-info'
do_replace '\bfrom-purple\b' 'from-info'
do_replace '\bvia-purple\b' 'via-info'
do_replace '\bto-purple\b' 'to-info'
do_replace '\bdivide-purple\b' 'divide-info'
do_replace '\bdark:bg-purple/20\b' ''
do_replace '\bdark:bg-purple/10\b' ''

# ─── INDIGO → INFO ───
echo "indigo → info..."
do_replace '\bbg-indigo-light\b' 'bg-info-soft'
do_replace '\bbg-indigo/10\b' 'bg-info-soft'
do_replace '\bbg-indigo/15\b' 'bg-info-soft'
do_replace '\bbg-indigo/20\b' 'bg-info-soft'
do_replace '\bbg-indigo\b' 'bg-info'
do_replace '\btext-indigo\b' 'text-info'
do_replace '\bborder-indigo/20\b' 'border-info/20'
do_replace '\bborder-indigo\b' 'border-info'
do_replace '\bring-indigo\b' 'ring-info'
do_replace '\bfrom-indigo\b' 'from-info'
do_replace '\bvia-indigo\b' 'via-info'
do_replace '\bto-indigo\b' 'to-info'
do_replace '\bdark:bg-indigo/20\b' ''

# ─── CYAN → INFO ───
echo "cyan → info..."
do_replace '\bbg-cyan-light\b' 'bg-info-soft'
do_replace '\bbg-cyan/10\b' 'bg-info-soft'
do_replace '\bbg-cyan/15\b' 'bg-info-soft'
do_replace '\bbg-cyan/20\b' 'bg-info-soft'
do_replace '\bbg-cyan\b' 'bg-info'
do_replace '\btext-cyan\b' 'text-info'
do_replace '\bborder-cyan/20\b' 'border-info/20'
do_replace '\bborder-cyan\b' 'border-info'
do_replace '\bfrom-cyan\b' 'from-info'
do_replace '\bvia-cyan\b' 'via-info'
do_replace '\bto-cyan\b' 'to-info'
do_replace '\bdark:bg-cyan/20\b' ''

# ─── ORANGE → WARNING ───
echo "orange → warning..."
do_replace '\bbg-orange-light\b' 'bg-warning-soft'
do_replace '\bbg-orange/10\b' 'bg-warning-soft'
do_replace '\bbg-orange/15\b' 'bg-warning-soft'
do_replace '\bbg-orange/20\b' 'bg-warning-soft'
do_replace '\bbg-orange\b' 'bg-warning'
do_replace '\btext-orange\b' 'text-warning'
do_replace '\bborder-orange/20\b' 'border-warning/20'
do_replace '\bborder-orange\b' 'border-warning'
do_replace '\bring-orange\b' 'ring-warning'
do_replace '\bfrom-orange\b' 'from-warning'
do_replace '\bvia-orange\b' 'via-warning'
do_replace '\bto-orange\b' 'to-warning'
do_replace '\bdark:bg-orange/20\b' ''

# ─── AMBER → WARNING ───
echo "amber → warning..."
do_replace '\bbg-amber-light\b' 'bg-warning-soft'
do_replace '\bbg-amber/10\b' 'bg-warning-soft'
do_replace '\bbg-amber/15\b' 'bg-warning-soft'
do_replace '\bbg-amber/20\b' 'bg-warning-soft'
do_replace '\bbg-amber\b' 'bg-warning'
do_replace '\btext-amber\b' 'text-warning'
do_replace '\bborder-amber/20\b' 'border-warning/20'
do_replace '\bborder-amber\b' 'border-warning'
do_replace '\bfrom-amber\b' 'from-warning'
do_replace '\bvia-amber\b' 'via-warning'
do_replace '\bto-amber\b' 'to-warning'
do_replace '\bdark:bg-amber/20\b' ''

# ─── EMERALD → SUCCESS ───
echo "emerald → success..."
do_replace '\bbg-emerald-light\b' 'bg-success-soft'
do_replace '\bbg-emerald/10\b' 'bg-success-soft'
do_replace '\bbg-emerald/15\b' 'bg-success-soft'
do_replace '\bbg-emerald/20\b' 'bg-success-soft'
do_replace '\bbg-emerald\b' 'bg-success'
do_replace '\btext-emerald\b' 'text-success'
do_replace '\bborder-emerald/20\b' 'border-success/20'
do_replace '\bborder-emerald\b' 'border-success'
do_replace '\bfrom-emerald\b' 'from-success'
do_replace '\bvia-emerald\b' 'via-success'
do_replace '\bto-emerald\b' 'to-success'
do_replace '\bdark:bg-emerald/20\b' ''

# ─── TEAL → SUCCESS ───
echo "teal → success..."
do_replace '\bbg-teal-light\b' 'bg-success-soft'
do_replace '\bbg-teal/10\b' 'bg-success-soft'
do_replace '\bbg-teal/15\b' 'bg-success-soft'
do_replace '\bbg-teal/20\b' 'bg-success-soft'
do_replace '\bbg-teal\b' 'bg-success'
do_replace '\btext-teal\b' 'text-success'
do_replace '\bborder-teal/20\b' 'border-success/20'
do_replace '\bborder-teal\b' 'border-success'
do_replace '\bfrom-teal\b' 'from-success'
do_replace '\bvia-teal\b' 'via-success'
do_replace '\bto-teal\b' 'to-success'
do_replace '\bdark:bg-teal/20\b' ''

# ─── PINK → DESTRUCTIVE ───
echo "pink → destructive..."
do_replace '\bbg-pink-light\b' 'bg-destructive-soft'
do_replace '\bbg-pink/10\b' 'bg-destructive-soft'
do_replace '\bbg-pink/15\b' 'bg-destructive-soft'
do_replace '\bbg-pink/20\b' 'bg-destructive-soft'
do_replace '\bbg-pink\b' 'bg-destructive'
do_replace '\btext-pink\b' 'text-destructive'
do_replace '\bborder-pink/20\b' 'border-destructive/20'
do_replace '\bborder-pink\b' 'border-destructive'
do_replace '\bfrom-pink\b' 'from-destructive'
do_replace '\bvia-pink\b' 'via-destructive'
do_replace '\bto-pink\b' 'to-destructive'
do_replace '\bdark:bg-pink/20\b' ''

# ─── SLATE → MUTED ───
echo "slate → muted..."
do_replace '\bbg-slate-light\b' 'bg-muted'
do_replace '\bbg-slate/10\b' 'bg-muted'
do_replace '\bbg-slate/15\b' 'bg-muted'
do_replace '\bbg-slate/20\b' 'bg-muted'
do_replace '\bbg-slate\b' 'bg-muted'
do_replace '\btext-slate\b' 'text-muted-foreground'
do_replace '\bborder-slate\b' 'border-border'
do_replace '\bfrom-slate\b' 'from-muted'
do_replace '\bvia-slate\b' 'via-muted'
do_replace '\bto-slate\b' 'to-muted'
do_replace '\bdark:bg-slate/20\b' ''

# ─── FOREGROUND TOKENS ───
echo "foreground tokens..."
do_replace '\btext-purple-foreground\b' 'text-info-foreground'
do_replace '\btext-indigo-foreground\b' 'text-info-foreground'
do_replace '\btext-cyan-foreground\b' 'text-info-foreground'
do_replace '\btext-orange-foreground\b' 'text-warning-foreground'
do_replace '\btext-amber-foreground\b' 'text-warning-foreground'
do_replace '\btext-emerald-foreground\b' 'text-success-foreground'
do_replace '\btext-teal-foreground\b' 'text-success-foreground'
do_replace '\btext-pink-foreground\b' 'text-destructive-foreground'
do_replace '\btext-slate-foreground\b' 'text-muted-foreground'

# ─── CLEAN UP: remove empty dark: fragments left behind ───
echo "Cleaning up empty strings..."
# Remove double spaces from removed dark: classes
find "$APP" "$COMP" \( -name '*.tsx' -o -name '*.ts' \) \
  ! -path '*/node_modules/*' \
  -exec perl -pi -e 's|  +| |g' {} +

echo ""
echo "=== Done! ==="
echo "Run 'npx tsc --noEmit' to verify no type errors."
echo "Run 'grep -rn \"bg-purple\|bg-indigo\|bg-cyan\|bg-orange\|bg-amber\|bg-emerald\|bg-teal\|bg-pink\|bg-slate\" app/ components/' to check remaining."
