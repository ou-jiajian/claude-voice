---
description: Toggle AI voice on/off
---

# Voice Command

Toggle AI-powered voice announcements on or off.

## Usage

```
/voice        — toggle on/off
/voice on     — enable voice
/voice off    — disable voice
/语音         — toggle on/off
/语音 开启    — enable voice
/语音 关闭    — disable voice
```

## Description

When enabled, Claude Code will narrate each action in natural Chinese:
- **Session start**: welcome phrase
- **Tool use**: AI-generated description of what it's doing + completion phrase
- **Session end**: goodbye phrase

Uses `liquid/lfm-2.5-1.2b-instruct:free` (OpenRouter, free) + Xiaomi MiMo TTS (free).

## State

Voice state is stored in `~/.claude/voice-state.json`. Default is **enabled**.

## Requirements

- `OPENROUTER_KEY` in `~/.zshenv` — get free key at openrouter.ai
- `MIMO_API_KEY` in `~/.zshenv` — get free key at platform.xiaomimimo.com
- `saymimo` in PATH or `~/.local/bin/saymimo`
