#!/bin/bash
# Second pass — catch remaining intermediate raw color shades
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP="$DIR/app"
COMP="$DIR/components"

do_replace() {
  local pattern="$1"
  local replacement="$2"
  find "$APP" "$COMP" \( -name '*.tsx' -o -name '*.ts' \) \
    ! -path '*/components/ui/*' \
    ! -path '*/node_modules/*' \
    -exec perl -pi -e "s|$pattern|$replacement|g" {} +
}

echo "=== Pass 2: remaining raw colors ==="

# ─── PURPLE remaining → INFO ───
do_replace '\bbg-purple-200\b' 'bg-info-soft'
do_replace '\bbg-purple-300\b' 'bg-info-soft'
do_replace '\bbg-purple-400\b' 'bg-info'
do_replace '\bbg-purple-100\b' 'bg-info-soft'
do_replace '\bbg-purple-500\b' 'bg-info'
do_replace '\btext-purple-100\b' 'text-info/40'
do_replace '\btext-purple-200\b' 'text-info/50'
do_replace '\btext-purple-300\b' 'text-info/70'
do_replace '\btext-purple-400\b' 'text-info'
do_replace '\btext-purple-700\b' 'text-info'
do_replace '\btext-purple-800\b' 'text-info'
do_replace '\bborder-purple-100\b' 'border-info/10'
do_replace '\bborder-purple-200\b' 'border-info/20'
do_replace '\bborder-purple-400\b' 'border-info/40'
do_replace '\bborder-purple-500\b' 'border-info/50'
do_replace '\bborder-purple-600\b' 'border-info/60'
do_replace '\bborder-purple-700\b' 'border-info/70'
do_replace '\bring-purple-100\b' 'ring-info/20'
do_replace '\bring-purple-200\b' 'ring-info/30'
do_replace '\bring-purple-300\b' 'ring-info/40'

# ─── ORANGE remaining → WARNING ───
do_replace '\bbg-orange-200\b' 'bg-warning-soft'
do_replace '\bbg-orange-400\b' 'bg-warning'
do_replace '\bbg-orange-500\b' 'bg-warning'
do_replace '\bbg-orange-100\b' 'bg-warning-soft'
do_replace '\bbg-orange-900\b' 'bg-warning'
do_replace '\btext-orange-400\b' 'text-warning'
do_replace '\btext-orange-700\b' 'text-warning'
do_replace '\btext-orange-800\b' 'text-warning'
do_replace '\btext-orange-900\b' 'text-warning'
do_replace '\bborder-orange-200\b' 'border-warning/20'
do_replace '\bborder-orange-300\b' 'border-warning/30'
do_replace '\bborder-orange-400\b' 'border-warning/40'
do_replace '\bborder-orange-500\b' 'border-warning/50'
do_replace '\bborder-orange-600\b' 'border-warning/60'
do_replace '\bborder-orange-800\b' 'border-warning/80'
do_replace '\bring-orange-200\b' 'ring-warning/30'
do_replace '\bring-orange-400\b' 'ring-warning/50'
do_replace '\bring-orange-500\b' 'ring-warning'

# ─── INDIGO remaining → INFO ───
do_replace '\bbg-indigo-400\b' 'bg-info'
do_replace '\bbg-indigo-500\b' 'bg-info'
do_replace '\bbg-indigo-900\b' 'bg-info'
do_replace '\btext-indigo-300\b' 'text-info/70'
do_replace '\btext-indigo-400\b' 'text-info'
do_replace '\btext-indigo-900\b' 'text-info'
do_replace '\bborder-indigo-400\b' 'border-info/40'
do_replace '\bborder-indigo-600\b' 'border-info/60'
do_replace '\bborder-indigo-800\b' 'border-info/80'
do_replace '\bring-indigo-400\b' 'ring-info/50'

# ─── TEAL remaining → SUCCESS ───
do_replace '\bbg-teal-900\b' 'bg-success'
do_replace '\bborder-teal-400\b' 'border-success/40'
do_replace '\bborder-teal-500\b' 'border-success/50'
do_replace '\bborder-teal-600\b' 'border-success/60'
do_replace '\bring-teal-400\b' 'ring-success/50'
do_replace '\bring-teal-500\b' 'ring-success'

# ─── PINK remaining → DESTRUCTIVE ───
do_replace '\bbg-pink-400\b' 'bg-destructive'
do_replace '\bbg-pink-900\b' 'bg-destructive'
do_replace '\btext-pink-400\b' 'text-destructive'
do_replace '\bborder-pink-200\b' 'border-destructive/20'
do_replace '\bborder-pink-300\b' 'border-destructive/30'
do_replace '\bborder-pink-500\b' 'border-destructive/50'
do_replace '\bring-pink-200\b' 'ring-destructive/30'

# ─── AMBER remaining → WARNING ───
do_replace '\bbg-amber-100\b' 'bg-warning-soft'
do_replace '\bbg-amber-500\b' 'bg-warning'
do_replace '\bbg-amber-900\b' 'bg-warning'
do_replace '\btext-amber-300\b' 'text-warning/70'
do_replace '\btext-amber-400\b' 'text-warning'
do_replace '\btext-amber-700\b' 'text-warning'
do_replace '\btext-amber-800\b' 'text-warning'
do_replace '\btext-amber-900\b' 'text-warning'
do_replace '\bborder-amber-300\b' 'border-warning/30'
do_replace '\bborder-amber-400\b' 'border-warning/40'
do_replace '\bborder-amber-500\b' 'border-warning/50'
do_replace '\bborder-amber-600\b' 'border-warning/60'
do_replace '\bborder-amber-800\b' 'border-warning/80'
do_replace '\bring-amber-200\b' 'ring-warning/30'
do_replace '\bring-amber-400\b' 'ring-warning/50'

# ─── EMERALD remaining → SUCCESS ───
do_replace '\bbg-emerald-100\b' 'bg-success-soft'
do_replace '\bbg-emerald-500\b' 'bg-success'
do_replace '\bbg-emerald-900\b' 'bg-success'
do_replace '\btext-emerald-300\b' 'text-success/70'
do_replace '\btext-emerald-400\b' 'text-success'
do_replace '\btext-emerald-700\b' 'text-success'
do_replace '\btext-emerald-800\b' 'text-success'
do_replace '\bborder-emerald-200\b' 'border-success/20'
do_replace '\bborder-emerald-300\b' 'border-success/30'
do_replace '\bborder-emerald-400\b' 'border-success/40'
do_replace '\bborder-emerald-500\b' 'border-success/50'
do_replace '\bborder-emerald-600\b' 'border-success/60'
do_replace '\bring-emerald-200\b' 'ring-success/30'
do_replace '\bring-emerald-400\b' 'ring-success/50'

# ─── CYAN remaining → INFO ───
do_replace '\bbg-cyan-100\b' 'bg-info-soft'
do_replace '\bbg-cyan-400\b' 'bg-info'
do_replace '\bbg-cyan-500\b' 'bg-info'
do_replace '\bbg-cyan-900\b' 'bg-info'
do_replace '\btext-cyan-400\b' 'text-info'
do_replace '\btext-cyan-700\b' 'text-info'
do_replace '\bborder-cyan-300\b' 'border-info/30'

# ─── SLATE remaining → MUTED / FOREGROUND ───
do_replace '\bbg-slate-500\b' 'bg-muted-foreground'
do_replace '\bbg-slate-600\b' 'bg-muted-foreground'
do_replace '\btext-slate-300\b' 'text-muted-foreground'
do_replace '\bborder-slate-500\b' 'border-border'
do_replace '\bborder-slate-600\b' 'border-border'

# ─── GRAY remaining ───
do_replace '\bbg-gray-100\b' 'bg-muted'
do_replace '\bbg-gray-400\b' 'bg-muted'
do_replace '\bbg-gray-500\b' 'bg-muted-foreground'
do_replace '\btext-gray-800\b' 'text-foreground'
do_replace '\bborder-gray-200\b' 'border-border'
do_replace '\bring-gray-300\b' 'ring-ring'

# ─── BLUE remaining ───
do_replace '\bbg-blue-100\b' 'bg-brand-surface'
do_replace '\bbg-blue-200\b' 'bg-brand-soft'
do_replace '\bbg-blue-400\b' 'bg-brand'
do_replace '\bbg-blue-500\b' 'bg-brand'
do_replace '\bbg-blue-600\b' 'bg-brand'
do_replace '\btext-blue-400\b' 'text-brand'
do_replace '\btext-blue-800\b' 'text-brand'
do_replace '\bborder-blue-200\b' 'border-brand-border'

# ─── RED remaining ───
do_replace '\bbg-red-100\b' 'bg-destructive-soft'
do_replace '\bbg-red-500\b' 'bg-destructive'
do_replace '\bbg-red-600\b' 'bg-destructive'
do_replace '\btext-red-400\b' 'text-destructive'
do_replace '\btext-red-800\b' 'text-destructive'
do_replace '\bborder-red-200\b' 'border-destructive'

# ─── YELLOW remaining → WARNING ───
do_replace '\bbg-yellow-100\b' 'bg-warning-soft'
do_replace '\bbg-yellow-500\b' 'bg-warning'
do_replace '\btext-yellow-800\b' 'text-warning'
do_replace '\bborder-yellow-200\b' 'border-warning/20'
do_replace '\bring-yellow-400\b' 'ring-warning/50'

# ─── GREEN remaining → SUCCESS ───
do_replace '\bbg-green-100\b' 'bg-success-soft'
do_replace '\bbg-green-400\b' 'bg-success'
do_replace '\bbg-green-500\b' 'bg-success'
do_replace '\bbg-green-600\b' 'bg-success'
do_replace '\btext-green-400\b' 'text-success'
do_replace '\btext-green-800\b' 'text-success'
do_replace '\bborder-green-200\b' 'border-success/20'
do_replace '\bring-green-300\b' 'ring-success/40'

# ─── VIOLET remaining → INFO ───
do_replace '\bbg-violet-400\b' 'bg-info'
do_replace '\btext-violet-400\b' 'text-info'
do_replace '\bborder-violet-200\b' 'border-info/20'
do_replace '\bborder-violet-300\b' 'border-info/30'
do_replace '\bborder-violet-500\b' 'border-info/50'
do_replace '\bborder-violet-600\b' 'border-info/60'
do_replace '\bring-violet-200\b' 'ring-info/30'
do_replace '\bring-violet-400\b' 'ring-info/50'

# ─── ROSE remaining → DESTRUCTIVE ───
do_replace '\bbg-rose-900\b' 'bg-destructive'

# ─── SKY remaining → INFO ───
do_replace '\bbg-sky-900\b' 'bg-info'

echo "✅ Pass 2 complete."
