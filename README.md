# claude-voice

> AI-powered voice announcements for Claude Code — every action narrated in natural language.

## What it does

Every time Claude Code runs a tool (Read, Write, Bash, Edit, etc.), an AI model decides what natural voice phrase to say, then Xiaomi MiMo TTS plays it. You hear things like:

- *"正在通过 SSH 连接服务器"* (Bash: ssh command)
- *"搜索文件：*.tsx""* (Glob operation)
- *"修改了 voicesay.js"* (Edit operation)

## Architecture

```
Claude Code hook → voicesay.js → OpenRouter AI model → Xiaomi MiMo TTS → your speakers
```

**AI model** (free):
- `liquid/lfm-2-24b-a2b` — fast (~2s), direct `content` output
- `nvidia/nemotron-nano-12b-v2-vl:free` — slower (~6s), extracts from `reasoning` field

**TTS** (currently free):
- Xiaomi MiMo `mimo-v2-tts` — high quality Chinese + English voices

## Prerequisites

1. **OpenRouter API key** — [openrouter.ai](https://openrouter.ai) (get a free key)
2. **Xiaomi MiMo API key** — [platform.xiaomimimo.com](https://platform.xiaomimimo.com) (currently free tier)

## Quick Install

### 1. Clone

```bash
git clone https://github.com/ou-jiajian/claude-voice.git ~/.claude/scripts/hooks/voicesay
# or symlink if you prefer:
git clone https://github.com/ou-jiajian/claude-voice.git ~/Project/claude-voice
```

### 2. Install saymimo (TTS wrapper)

```bash
cp ~/Project/claude-voice/saymimo.sh ~/.local/bin/saymimo
chmod +x ~/.local/bin/saymimo
```

Or use the Python version:
```bash
cp ~/Project/claude-voice/saymimo ~/.local/bin/saymimo
chmod +x ~/.local/bin/saymimo
```

### 3. Set environment variables

Add to `~/.zshenv` (or `~/.bashrc`):

```bash
# OpenRouter API key (AI model)
export OPENROUTER_KEY="sk-or-v1-..."

# Xiaomi MiMo API key (TTS)
export MIMO_API_KEY="sk-..."
```

Then `source ~/.zshenv`

### 4. Register hooks in Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node \"/path/to/voicesay.js\" \"SessionStart\"",
        "async": true,
        "timeout": 35
      }]
    }],
    "PostToolUse": [{
      "matcher": "Read|Write|Edit|MultiEdit|Bash|Glob|Grep|Agent|Task|WebFetch|WebSearch",
      "hooks": [{
        "type": "command",
        "command": "node \"/path/to/voicesay.js\" \"PostToolUse\"",
        "async": true,
        "timeout": 25
      }]
    }],
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node \"/path/to/voicesay.js\" \"SessionEnd\"",
        "async": true,
        "timeout": 35
      }]
    }]
  }
}
```

Replace `/path/to/voicesay.js` with the actual path.

## Customization

### Use a different TTS

```bash
export VOICESAY_TTS="your-tts-command"
export VOICESAY_VOICE="voice_name"
```

### Use a different AI model

```bash
export VOICESAY_MODEL="your/model:free"
```

### Use a different voice for TTS

```bash
export VOICESAY_VOICE="default_en"  # English
export VOICESAY_VOICE="mimo_default" # Default
```

### Disable logging

Logs go to `/tmp/voicesay.log`. Delete the log function in `voicesay.js` if unwanted.

## Models (both FREE, no cost)

| Model | Latency | Output | Region |
|-------|---------|--------|--------|
| `liquid/lfm-2.5-1.2b-instruct:free` | **1.3s** | `content` field | ✅ works |
| `nvidia/nemotron-nano-12b-v2-vl:free` | ~6s | `reasoning` field | ✅ works |
| `google/gemini-3.1-flash-lite` | blocked in CN | — | ❌ |
| `liquid/lfm-2-24b-a2b` | ~2s | `content` | ⚠️ tiny cost |

**Default: `liquid/lfm-2.5-1.2b-instruct:free`** — 1.3s, zero cost, Chinese supported.

## License

MIT

## Contributing

PRs welcome! The core logic is in `voicesay.js` — ~180 lines of clean Node.js.
