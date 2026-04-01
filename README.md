# claude-voice

> AI-powered voice announcements for Claude Code — every action narrated in natural Chinese.

## Features

- **Session Start** — AI generates a welcome phrase in Chinese
- **Tool Use** — AI narrates each action (Read, Write, Edit, Bash, Glob, Grep...) + completion phrase
- **Session End** — AI says goodbye
- **Toggle on/off** — `/voice` or `/语音` command to enable/disable anytime

## How it sounds

- *"正在读取文件"* (reading a file)
- *"完成啦"* (completion phrase, 1.5s after action)
- *"下次见！"* (goodbye)

## Architecture

```
Claude Code hook → voicesay.js → OpenRouter AI model → Xiaomi MiMo TTS → speakers
```

**AI model** (free): `liquid/lfm-2.5-1.2b-instruct:free` — ~1.7s latency, zero cost
**TTS** (free): Xiaomi MiMo `mimo-v2-tts`

## Prerequisites

1. **OpenRouter API key** — [openrouter.ai](https://openrouter.ai) (free tier)
2. **Xiaomi MiMo API key** — [platform.xiaomimimo.com](https://platform.xiaomimimo.com) (free tier)

## Quick Install

### Option 1: Git clone

```bash
git clone https://github.com/ou-jiajian/claude-voice.git ~/.claude/plugins/ou-jiajian/claude-voice
```

### Option 2: Manual

```bash
# 1. Clone
git clone https://github.com/ou-jiajian/claude-voice.git ~/path/to/claude-voice

# 2. Run install
bash ~/path/to/claude-voice/install.sh

# 3. Add the plugin
claude plugin add "~/path/to/claude-voice"
```

## Setup API Keys

Add to `~/.zshenv`:

```bash
export OPENROUTER_KEY="sk-or-v1-..."
export MIMO_API_KEY="sk-..."
```

Then `source ~/.zshenv`.

## Usage

```
/voice      — toggle voice on/off
/voice on   — enable
/voice off  — disable
/语音       — toggle
/语音 开启  — enable
/语音 关闭  — disable
```

State is persisted in `~/.claude/voice-state.json`.

## Customization

```bash
# Different AI model
export VOICESAY_MODEL="nvidia/nemotron-nano-12b-v2-vl:free"

# Different TTS voice
export VOICESAY_VOICE="default_en"   # English
export VOICESAY_VOICE="mimo_default"  # Default
```

## Uninstall

```bash
# Remove plugin
claude plugin remove claude-voice

# Remove saymimo
rm ~/.local/bin/saymimo

# Remove state
rm ~/.claude/voice-state.json
```

## License

MIT
