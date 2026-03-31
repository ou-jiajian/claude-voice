#!/usr/bin/env bash
# install.sh — Install claude-voice
#
# 1. Copy voicesay.js
cp voicesay.js ~/.claude/scripts/hooks/voicesay.js
echo "✅ voicesay.js installed"

# 2. Install saymimo (shell version — no Python needed)
cp saymimo.sh ~/.local/bin/saymimo
chmod +x ~/.local/bin/saymimo
echo "✅ saymimo installed"

# 3. Add env vars to ~/.zshenv
read -p "OpenRouter key (or press Enter to skip): " orkey
read -p "MiMo TTS key (or press Enter to skip): " mimo_key
if [[ -n "$orkey" ]]; then
  grep -q "OPENROUTER_KEY" ~/.zshenv 2>/dev/null || echo "export OPENROUTER_KEY=\"$orkey\"" >> ~/.zshenv
fi
if [[ -n "$mimo_key" ]]; then
  grep -q "MIMO_API_KEY" ~/.zshenv 2>/dev/null || echo "export MIMO_API_KEY=\"$mimo_key\"" >> ~/.zshenv
fi
echo "✅ env vars added to ~/.zshenv — run: source ~/.zshenv"

# 4. Print hook config snippet
echo ""
echo "5. Add to ~/.claude/settings.json hooks section:"
echo '
  "hooks": {
    "SessionStart": [{"matcher":"*","hooks":[{"type":"command","command":"node \"'$HOME'/.claude/scripts/hooks/voicesay.js\" \"SessionStart\"","async":true,"timeout":35}]}],
    "PostToolUse": [{"matcher":"Read|Write|Edit|MultiEdit|Bash|Glob|Grep","hooks":[{"type":"command","command":"node \"'$HOME'/.claude/scripts/hooks/voicesay.js\" \"PostToolUse\"","async":true,"timeout":25}]}],
    "SessionEnd": [{"matcher":"*","hooks":[{"type":"command","command":"node \"'$HOME'/.claude/scripts/hooks/voicesay.js\" \"SessionEnd\"","async":true,"timeout":35}]}]
  }'
