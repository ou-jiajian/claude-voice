#!/usr/bin/env bash
# saymimo.sh — Xiaomi MiMo TTS wrapper for claude-voice plugin
#
# Usage:
#   saymimo.sh "Hello world"
#   saymimo.sh -v default_en "Hello world"
#
# Environment:
#   source ~/.zshenv (loads MIMO_API_KEY)

set -e

load_env() {
  local zshenv="$HOME/.zshenv"
  if [[ -f "$zshenv" ]]; then
    while IFS= read -r line; do
      if [[ "$line" =~ ^export\ && "$line" =~ MIMO_API_KEY ]]; then
        eval "$line"
      fi
    done < "$zshenv"
  fi
}
load_env

VOICE="default_zh"
BASE_URL="${MIMO_API_BASE:-https://api.xiaomimimo.com/v1}"

usage() {
  cat <<EOF
Usage: saymimo.sh [options] "text to speak"
Options:
  -v VOICE   Voice: default_zh, default_en, mimo_default (default: default_zh)
  -h         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -v) VOICE="$2"; shift 2 ;;
    -h) usage; exit 0 ;;
    *)  break ;;
  esac
done

TEXT="${1:-}"
if [[ -z "$TEXT" ]]; then
  usage >&2
  exit 1
fi

if [[ -z "$MIMO_API_KEY" ]]; then
  echo "Error: MIMO_API_KEY not set" >&2
  exit 1
fi

AUDIO=$(curl -s -X POST "${BASE_URL}/tts" \
  -H "Authorization: Bearer ${MIMO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"text\": ${TEXT@Q}, \"voice\": \"${VOICE}\"}" \
  --max-time 10)

if echo "$AUDIO" | base64 -d > /tmp/saymimo_$$.wav 2>/dev/null; then
  afplay /tmp/saymimo_$$.wav
  rm -f /tmp/saymimo_$$.wav
else
  echo "TTS failed: $AUDIO" >&2
  exit 1
fi
