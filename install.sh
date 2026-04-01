#!/usr/bin/env bash
# install.sh — Install claude-voice plugin
#
# What it does:
#   1. Installs saymimo TTS wrapper to ~/.local/bin/
#   2. Confirms env vars in ~/.zshenv
#   3. Installs the plugin via `claude plugin add`

set -e

PLUGIN_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Installing claude-voice..."

# ─── 1. Install saymimo TTS ──────────────────────────────────────────
SAYMIMO="$HOME/.local/bin/saymimo"
mkdir -p "$HOME/.local/bin"
cp "$PLUGIN_ROOT/scripts/saymimo.sh" "$SAYMIMO"
chmod +x "$SAYMIMO"
echo "✅ saymimo installed → $SAYMIMO"

# ─── 2. Check env vars ──────────────────────────────────────────────
check_env() {
  local key="$1"
  local label="$2"
  if grep -q "export $key=" "$HOME/.zshenv" 2>/dev/null; then
    echo "✅ $label already set"
  else
    echo "⚠️  $label not found in ~/.zshenv — add it to use voice"
  fi
}

check_env "OPENROUTER_KEY" "OPENROUTER_KEY"
check_env "MIMO_API_KEY"   "MIMO_API_KEY"

# ─── 3. Install plugin ──────────────────────────────────────────────
echo ""
echo "Now installing the plugin..."
echo "Run this command:"
echo ""
echo "  claude plugin add \"$PLUGIN_ROOT\""
echo ""
echo "Then restart Claude Code to activate voice hooks."
