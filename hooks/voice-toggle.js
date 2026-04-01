#!/usr/bin/env node
/**
 * voice-toggle.js — Toggle voice on/off via /voice or /语音 command
 *
 * Listens to PreToolUse User messages. Detects:
 *   /voice        → toggle
 *   /voice on     → enable
 *   /voice off    → disable
 *   /voice status → read current state
 *   /语音         → toggle
 *   /语音 开启    → enable
 *   /语音 关闭    → disable
 *
 * State: ~/.claude/voice-state.json
 */

"use strict";

const fs   = require("fs");
const os   = require("os");
const path = require("path");

const STATE_FILE = path.join(os.homedir(), ".claude", "voice-state.json");

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); }
  catch { return { enabled: true, mode: "full" }; }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function main() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", c => (raw += c));
  process.stdin.on("end", () => {
    raw = raw.trim();
    let input = {};
    try { input = JSON.parse(raw); } catch { input = {}; }

    // Only respond to User messages
    const toolName = input.tool_name || "";
    if (toolName !== "User") {
      process.stdout.write(raw);
      return;
    }

    // Extract text from tool_input
    const rawText = (input.tool_input && (input.tool_input.text || input.tool_input.text_content || "")) || "";
    const text = rawText.trim();

    // Match command patterns
    const isToggle = /^\/voice\b/.test(text);
    const isVoiceOn = /^\/voice\s+on\b/i.test(text);
    const isVoiceOff = /^\/voice\s+off\b/i.test(text);
    const isZhToggle = /^\/语音\b/.test(text);
    const isZhOn = /^\/语音\s*(开启|启用)?\b/.test(text);
    const isZhOff = /^\/语音\s*(关闭|禁用)?\b/.test(text);

    if (!isToggle && !isVoiceOn && !isVoiceOff && !isZhToggle && !isZhOn && !isZhOff) {
      process.stdout.write(raw);
      return;
    }

    const state = readState();

    if (isVoiceOn || isZhOn) {
      state.enabled = true;
      writeState(state);
      console.error("[voice-toggle] 语音已开启");
    } else if (isVoiceOff || isZhOff) {
      state.enabled = false;
      writeState(state);
      console.error("[voice-toggle] 语音已关闭");
    } else {
      // toggle
      state.enabled = !state.enabled;
      writeState(state);
      console.error(`[voice-toggle] 语音${state.enabled ? "已开启" : "已关闭"}`);
    }

    process.stdout.write(raw);
  });
}

main();
