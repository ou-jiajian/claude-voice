#!/usr/bin/env bash
# saymimo — Xiaomi MiMo TTS command
#
# Dependencies: curl, jq, afplay
# Setup: set MIMO_API_KEY in ~/.zshenv or directly:
#   export MIMO_API_KEY="your_key"
#
# Usage:
#   saymimo "Hello world"
#   saymimo -v default_en "Hello world"
#   saymimo --style "Happy" "Great job!"

set -e

VOICE="default_zh"
STYLE=""
BASE_URL="${MIMO_API_BASE:-https://api.xiaomimimo.com/v1}"

usage() {
  cat <<EOF
Usage: saymimo [options] "text to speak"
Options:
  -v VOICE   Voice: default_zh, default_en, mimo_default (default: default_zh)
  --style S  Style tag, e.g. Happy, Sad, 东北话, 唱歌
  -f FILE    Read text from file
  -h        Show this help
EOF
}

load_env() {
  # Load from ~/.zshenv if not already set
  if [[ -z "$MIMO_API_KEY" && -f ~/.zshenv ]]; then
    source ~/.zshenv 2>/dev/null
  fi
}

get_api_key() {
  load_env
  if [[ -z "$MIMO_API_KEY" ]]; then
    echo "❌  MIMO_API_KEY not set. Run: export MIMO_API_KEY=your_key" >&2
    exit 1
  fi
}

fetch_audio() {
  local text="$1"
  local voice="$2"
  local style="$3"

  local content="$text"
  if [[ -n "$style" ]]; then
    content="<style>${style}</style>${text}"
  fi

  local payload=$(jq -n \
    --arg model "mimo-v2-tts" \
    --arg user "[ignore]" \
    --arg assistant "$content" \
    --arg voice "$voice" \
    '{
      model: $model,
      messages: [
        {role: "user", content: $user},
        {role: "assistant", content: $assistant}
      ],
      audio: {format: "wav", voice: $voice}
    }'
  )

  local response
  response=$(curl -s --max-time 30 -X POST \
    "${BASE_URL}/chat/completions" \
    -H "Content-Type: application/json" \
    -H "api-key: ${MIMO_API_KEY}" \
    -d "$payload"
  )

  local audio_data
  audio_data=$(echo "$response" | jq -r '.choices[0].message.audio.data // empty')
  if [[ "$audio_data" == "empty" || -z "$audio_data" ]]; then
    local err_msg
    err_msg=$(echo "$response" | jq -r '.error.message // "unknown error"')
    echo "❌  API error: $err_msg" >&2
    exit 1
  fi

  echo "$audio_data"
}

play_audio() {
  local audio_b64="$1"
  local tmpfile
  tmpfile=$(mktemp /tmp/saymimo_XXXXXX.wav)
  echo "$audio_b64" | base64 -d > "$tmpfile"
  afplay "$tmpfile"
  rm -f "$tmpfile"
}

# Parse args
TEXT=""
FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -v)
      VOICE="$2"; shift 2 ;;
    --style)
      STYLE="$2"; shift 2 ;;
    -f)
      FILE="$2"; TEXT=$(cat "$FILE"); shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      TEXT="$1"; shift ;;
  esac
done

if [[ -z "$TEXT" ]]; then
  # Try stdin
  if ! [[ -t 0 ]]; then
    TEXT=$(cat)
  fi
fi

if [[ -z "$TEXT" ]]; then
  usage; exit 1
fi

get_api_key
load_env

audio=$(fetch_audio "$TEXT" "$VOICE" "$STYLE")
play_audio "$audio"
