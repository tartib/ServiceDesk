#!/bin/bash
# Design System — Normalize raw Tailwind colors to semantic tokens
# Targets: app/, components/ (excluding components/ui/ shadcn core)
# Run from ServiceDesk-app/

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP="$DIR/app"
COMP="$DIR/components"

echo "=== Normalizing raw colors to design tokens ==="
echo "Working in: $DIR"
echo ""

# Helper: run perl replacement on tsx/ts files, excluding components/ui/
do_replace() {
  local pattern="$1"
  local replacement="$2"
  find "$APP" "$COMP" \( -name '*.tsx' -o -name '*.ts' \) \
    ! -path '*/components/ui/*' \
    ! -path '*/node_modules/*' \
    -exec perl -pi -e "s|$pattern|$replacement|g" {} +
}

# ─── PURPLE / VIOLET → INFO ───
do_replace '\bbg-purple-50\b' 'bg-info-soft'
do_replace '\bbg-purple-100\b' 'bg-info-soft'
do_replace '\bbg-purple-500\b' 'bg-info'
do_replace '\bbg-purple-600\b' 'bg-info'
do_replace '\bbg-purple-700\b' 'bg-info'
do_replace '\bbg-purple-800\b' 'bg-info'
do_replace '\bbg-purple-900\b' 'bg-info'
do_replace '\btext-purple-500\b' 'text-info'
do_replace '\btext-purple-600\b' 'text-info'
do_replace '\btext-purple-700\b' 'text-info'
do_replace '\btext-purple-800\b' 'text-info'
do_replace '\btext-purple-900\b' 'text-info'
do_replace '\bborder-purple-200\b' 'border-info/20'
do_replace '\bborder-purple-300\b' 'border-info/30'
do_replace '\bring-purple-500\b' 'ring-info'
do_replace '\bbg-violet-50\b' 'bg-info-soft'
do_replace '\bbg-violet-100\b' 'bg-info-soft'
do_replace '\bbg-violet-500\b' 'bg-info'
do_replace '\bbg-violet-600\b' 'bg-info'
do_replace '\btext-violet-500\b' 'text-info'
do_replace '\btext-violet-600\b' 'text-info'
do_replace '\btext-violet-700\b' 'text-info'

# ─── ORANGE → WARNING ───
do_replace '\bbg-orange-50\b' 'bg-warning-soft'
do_replace '\bbg-orange-100\b' 'bg-warning-soft'
do_replace '\bbg-orange-500\b' 'bg-warning'
do_replace '\bbg-orange-600\b' 'bg-warning'
do_replace '\bbg-orange-700\b' 'bg-warning'
do_replace '\btext-orange-400\b' 'text-warning'
do_replace '\btext-orange-500\b' 'text-warning'
do_replace '\btext-orange-600\b' 'text-warning'
do_replace '\btext-orange-700\b' 'text-warning'
do_replace '\bborder-orange-200\b' 'border-warning/20'

# ─── TEAL → SUCCESS ───
do_replace '\bbg-teal-50\b' 'bg-success-soft'
do_replace '\bbg-teal-100\b' 'bg-success-soft'
do_replace '\bbg-teal-500\b' 'bg-success'
do_replace '\bbg-teal-600\b' 'bg-success'
do_replace '\bbg-teal-700\b' 'bg-success'
do_replace '\btext-teal-500\b' 'text-success'
do_replace '\btext-teal-600\b' 'text-success'
do_replace '\btext-teal-700\b' 'text-success'
do_replace '\bborder-teal-200\b' 'border-success/20'

# ─── INDIGO → INFO ───
do_replace '\bbg-indigo-50\b' 'bg-info-soft'
do_replace '\bbg-indigo-100\b' 'bg-info-soft'
do_replace '\bbg-indigo-500\b' 'bg-info'
do_replace '\bbg-indigo-600\b' 'bg-info'
do_replace '\bbg-indigo-700\b' 'bg-info'
do_replace '\btext-indigo-500\b' 'text-info'
do_replace '\btext-indigo-600\b' 'text-info'
do_replace '\btext-indigo-700\b' 'text-info'
do_replace '\bborder-indigo-200\b' 'border-info/20'
do_replace '\bring-indigo-500\b' 'ring-info'

# ─── PINK / ROSE → DESTRUCTIVE ───
do_replace '\bbg-pink-50\b' 'bg-destructive-soft'
do_replace '\bbg-pink-100\b' 'bg-destructive-soft'
do_replace '\bbg-pink-500\b' 'bg-destructive'
do_replace '\bbg-pink-600\b' 'bg-destructive'
do_replace '\btext-pink-500\b' 'text-destructive'
do_replace '\btext-pink-600\b' 'text-destructive'
do_replace '\btext-pink-700\b' 'text-destructive'
do_replace '\bbg-rose-50\b' 'bg-destructive-soft'
do_replace '\bbg-rose-100\b' 'bg-destructive-soft'
do_replace '\bbg-rose-500\b' 'bg-destructive'
do_replace '\btext-rose-500\b' 'text-destructive'
do_replace '\btext-rose-600\b' 'text-destructive'

# ─── AMBER / YELLOW → WARNING ───
do_replace '\bbg-amber-50\b' 'bg-warning-soft'
do_replace '\bbg-amber-100\b' 'bg-warning-soft'
do_replace '\bbg-amber-500\b' 'bg-warning'
do_replace '\bbg-amber-600\b' 'bg-warning'
do_replace '\btext-amber-500\b' 'text-warning'
do_replace '\btext-amber-600\b' 'text-warning'
do_replace '\btext-amber-700\b' 'text-warning'
do_replace '\bborder-amber-200\b' 'border-warning/20'
do_replace '\bbg-yellow-50\b' 'bg-warning-soft'
do_replace '\bbg-yellow-100\b' 'bg-warning-soft'
do_replace '\bbg-yellow-500\b' 'bg-warning'
do_replace '\btext-yellow-500\b' 'text-warning'
do_replace '\btext-yellow-600\b' 'text-warning'
do_replace '\btext-yellow-700\b' 'text-warning'
do_replace '\bborder-yellow-200\b' 'border-warning/20'

# ─── EMERALD / GREEN → SUCCESS ───
do_replace '\bbg-emerald-50\b' 'bg-success-soft'
do_replace '\bbg-emerald-100\b' 'bg-success-soft'
do_replace '\bbg-emerald-500\b' 'bg-success'
do_replace '\bbg-emerald-600\b' 'bg-success'
do_replace '\btext-emerald-500\b' 'text-success'
do_replace '\btext-emerald-600\b' 'text-success'
do_replace '\btext-emerald-700\b' 'text-success'
do_replace '\bbg-green-50\b' 'bg-success-soft'
do_replace '\bbg-green-100\b' 'bg-success-soft'
do_replace '\bbg-green-500\b' 'bg-success'
do_replace '\bbg-green-600\b' 'bg-success'
do_replace '\btext-green-500\b' 'text-success'
do_replace '\btext-green-600\b' 'text-success'
do_replace '\btext-green-700\b' 'text-success'
do_replace '\bborder-green-200\b' 'border-success/20'

# ─── CYAN / SKY → INFO ───
do_replace '\bbg-cyan-50\b' 'bg-info-soft'
do_replace '\bbg-cyan-100\b' 'bg-info-soft'
do_replace '\bbg-cyan-500\b' 'bg-info'
do_replace '\bbg-cyan-600\b' 'bg-info'
do_replace '\btext-cyan-500\b' 'text-info'
do_replace '\btext-cyan-600\b' 'text-info'
do_replace '\btext-cyan-700\b' 'text-info'
do_replace '\bbg-sky-50\b' 'bg-info-soft'
do_replace '\bbg-sky-100\b' 'bg-info-soft'
do_replace '\bbg-sky-500\b' 'bg-info'
do_replace '\btext-sky-500\b' 'text-info'
do_replace '\btext-sky-600\b' 'text-info'

# ─── SLATE / GRAY / ZINC / NEUTRAL → MUTED / FOREGROUND / BORDER ───
do_replace '\bbg-slate-50\b' 'bg-muted'
do_replace '\bbg-slate-100\b' 'bg-muted'
do_replace '\bbg-slate-700\b' 'bg-muted-foreground'
do_replace '\bbg-slate-800\b' 'bg-foreground'
do_replace '\bbg-slate-900\b' 'bg-foreground'
do_replace '\btext-slate-400\b' 'text-muted-foreground'
do_replace '\btext-slate-500\b' 'text-muted-foreground'
do_replace '\btext-slate-600\b' 'text-muted-foreground'
do_replace '\btext-slate-700\b' 'text-foreground'
do_replace '\btext-slate-800\b' 'text-foreground'
do_replace '\btext-slate-900\b' 'text-foreground'
do_replace '\bborder-slate-200\b' 'border-border'
do_replace '\bborder-slate-300\b' 'border-border'
do_replace '\bborder-slate-700\b' 'border-border'
# gray → muted/foreground
do_replace '\bbg-gray-50\b' 'bg-muted'
do_replace '\bbg-gray-100\b' 'bg-muted'
do_replace '\bbg-gray-200\b' 'bg-muted'
do_replace '\bbg-gray-700\b' 'bg-muted-foreground'
do_replace '\bbg-gray-800\b' 'bg-foreground'
do_replace '\bbg-gray-900\b' 'bg-foreground'
do_replace '\btext-gray-400\b' 'text-muted-foreground'
do_replace '\btext-gray-500\b' 'text-muted-foreground'
do_replace '\btext-gray-600\b' 'text-muted-foreground'
do_replace '\btext-gray-700\b' 'text-foreground'
do_replace '\btext-gray-800\b' 'text-foreground'
do_replace '\btext-gray-900\b' 'text-foreground'
do_replace '\bborder-gray-200\b' 'border-border'
do_replace '\bborder-gray-300\b' 'border-border'
# zinc/neutral → muted/foreground
do_replace '\bbg-zinc-50\b' 'bg-muted'
do_replace '\bbg-zinc-100\b' 'bg-muted'
do_replace '\bbg-zinc-800\b' 'bg-foreground'
do_replace '\bbg-zinc-900\b' 'bg-foreground'
do_replace '\btext-zinc-400\b' 'text-muted-foreground'
do_replace '\btext-zinc-500\b' 'text-muted-foreground'
do_replace '\btext-zinc-700\b' 'text-foreground'
do_replace '\btext-zinc-900\b' 'text-foreground'
do_replace '\bborder-zinc-200\b' 'border-border'

# ─── BLUE → BRAND ───
do_replace '\bbg-blue-50\b' 'bg-brand-surface'
do_replace '\bbg-blue-100\b' 'bg-brand-surface'
do_replace '\bbg-blue-500\b' 'bg-brand'
do_replace '\bbg-blue-600\b' 'bg-brand'
do_replace '\bbg-blue-700\b' 'bg-brand'
do_replace '\btext-blue-500\b' 'text-brand'
do_replace '\btext-blue-600\b' 'text-brand'
do_replace '\btext-blue-700\b' 'text-brand'
do_replace '\bborder-blue-200\b' 'border-brand-border'
do_replace '\bborder-blue-500\b' 'border-brand'
do_replace '\bring-blue-500\b' 'ring-brand'

# ─── RED → DESTRUCTIVE ───
do_replace '\bbg-red-50\b' 'bg-destructive-soft'
do_replace '\bbg-red-100\b' 'bg-destructive-soft'
do_replace '\bbg-red-500\b' 'bg-destructive'
do_replace '\bbg-red-600\b' 'bg-destructive'
do_replace '\bbg-red-700\b' 'bg-destructive'
do_replace '\btext-red-500\b' 'text-destructive'
do_replace '\btext-red-600\b' 'text-destructive'
do_replace '\btext-red-700\b' 'text-destructive'
do_replace '\bborder-red-200\b' 'border-destructive'
do_replace '\bborder-red-500\b' 'border-destructive'

# ─── FUCHSIA → DESTRUCTIVE ───
do_replace '\bbg-fuchsia-50\b' 'bg-destructive-soft'
do_replace '\bbg-fuchsia-100\b' 'bg-destructive-soft'
do_replace '\bbg-fuchsia-500\b' 'bg-destructive'
do_replace '\btext-fuchsia-500\b' 'text-destructive'
do_replace '\btext-fuchsia-600\b' 'text-destructive'

# ─── LIME → SUCCESS ───
do_replace '\bbg-lime-50\b' 'bg-success-soft'
do_replace '\bbg-lime-100\b' 'bg-success-soft'
do_replace '\bbg-lime-500\b' 'bg-success'
do_replace '\btext-lime-500\b' 'text-success'
do_replace '\btext-lime-600\b' 'text-success'

# ─── STONE → MUTED ───
do_replace '\bbg-stone-50\b' 'bg-muted'
do_replace '\bbg-stone-100\b' 'bg-muted'
do_replace '\btext-stone-500\b' 'text-muted-foreground'

echo ""
echo "✅ Raw color normalization complete."
echo "Run 'npx tsc --noEmit' to verify no type errors."
echo "Check the UI visually to confirm appearance."
