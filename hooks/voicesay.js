#!/usr/bin/env node
/**
 * voicesay — AI-powered voice announcements for Claude Code
 *
 * Model: liquid/lfm-2.5-1.2b-instruct:free (free, ~1.7s latency)
 * TTS:    Xiaomi MiMo mimo-v2-tts (free) via saymimo
 *
 * State:  reads ~/.claude/voice-state.json
 *         { enabled: true, mode: "full" }
 */

"use strict";

const { execSync } = require("child_process");
const https = require("https");
const fs   = require("fs");
const os   = require("os");
const path = require("path");

// ─── Load env from ~/.zshenv ───────────────────────────────────────────────
function loadEnv() {
  const zshenv = path.join(os.homedir(), ".zshenv");
  if (!fs.existsSync(zshenv)) return;
  for (const line of fs.readFileSync(zshenv, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("export ")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(7, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (k && !process.env[k]) process.env[k] = v;
  }
}
loadEnv();

// ─── Config ─────────────────────────────────────────────────────────
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || "";
const MODEL         = process.env.VOICESAY_MODEL || "liquid/lfm-2.5-1.2b-instruct:free";
const USE_REASONING = MODEL.includes("nemotron");
const TTS_CMD       = process.env.VOICESAY_TTS || "/Users/oujiajian/.local/bin/saymimo";
const TTS_VOICE     = process.env.VOICESAY_VOICE || "default_zh";
const TIMEOUT       = parseInt(process.env.VOICESAY_TIMEOUT || "30000", 10);
const STATE_FILE    = path.join(os.homedir(), ".claude", "voice-state.json");

// ─── State ───────────────────────────────────────────────────────────
function readVoiceState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch { return { enabled: true, mode: "full" }; }
}

// ─── OpenRouter AI ──────────────────────────────────────────────────
function ask(prompt, maxTokens = 50) {
  if (!OPENROUTER_KEY) throw new Error("OPENROUTER_KEY not set");

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_output_tokens: maxTokens,
      temperature: 0.8,
    });

    const req = https.request({
      hostname: "openrouter.ai",
      path:    "/api/v1/chat/completions",
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer":  "https://claudecode.local",
        "X-Title":       "ClaudeCode Voice",
      },
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          if (!USE_REASONING) {
            const content = (j?.choices?.[0]?.message?.content || "").trim();
            if (content) resolve(content);
            else reject(new Error("empty response"));
            return;
          }
          const reasoning = j?.choices?.[0]?.message?.reasoning || "";
          const lines = reasoning.split("\n").reverse();
          for (const line of lines) {
            const t = line.trim();
            if (t.length >= 4 && /[\u4e00-\u9fa5]/.test(t) &&
              !t.includes("用户") && !t.includes("请求") &&
              !t.includes("考虑") && !t.includes("首先")) {
              resolve(t.replace(/[。！？，、：；—\s]+$/, "").trim());
              return;
            }
          }
          reject(new Error("no content extracted"));
        } catch { reject(new Error("parse failed")); }
      });
    });

    req.on("error", reject);
    req.setTimeout(TIMEOUT, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(payload);
    req.end();
  });
}

// ─── TTS playback ───────────────────────────────────────────────────
function speak(text) {
  if (!text || !text.trim()) return;
  const cmd = `bash -lc 'source ~/.zshenv 2>/dev/null; ${TTS_CMD} -v ${TTS_VOICE} ${JSON.stringify(text.trim())}'`;
  try { execSync(cmd, { stdio: "ignore", timeout: 12000 }); } catch { /* silent */ }
}

// ─── Context builder ────────────────────────────────────────────────
function buildContext(toolName, toolInput, toolOutput) {
  const i = toolInput  || {};
  const o = typeof toolOutput === "string" ? toolOutput : "";
  const err = /error:|failed|✗|❌|exit code [1-9]|permission denied/i.test(o);
  if (err) {
    if (toolName === "Bash") return `Bash command error: ${(i.command || "").slice(0, 80)} — ${o.slice(0, 80)}`;
    return `${toolName} error on ${(i.file_path || "").split("/").pop() || toolName}: ${o.slice(0, 60)}`;
  }
  switch (toolName) {
    case "Bash":      return `Bash: ${(i.command || "").slice(0, 70)}`;
    case "Read":      return `Reading ${(i.file_path || "").split("/").pop()}`;
    case "Write":     return `Writing ${(i.file_path || "").split("/").pop()}`;
    case "Edit":      return `Editing ${(i.file_path || "").split("/").pop()}`;
    case "MultiEdit": return `Editing multiple files`;
    case "Glob":      return `Globbing ${i.pattern || ""}`;
    case "Grep":      return `Searching for ${(i.pattern || "").slice(0, 40)}`;
    case "Agent":     return `Spawning parallel agents`;
    case "Task":      return `Starting sub-task`;
    case "WebFetch":  return `Fetching web page`;
    case "WebSearch": return `Searching the web`;
    case "TaskCreate": case "TaskUpdate": case "TaskGet": return `Managing tasks`;
    default:          return `${toolName} operation`;
  }
}

// ─── Handlers ───────────────────────────────────────────────────────
async function handleSessionStart() {
  if (!readVoiceState().enabled) return;
  try {
    const reply = await ask("Say a short Chinese welcome phrase, 15 chars max. Only output the phrase.", 30);
    speak(reply);
  } catch { /* silent */ }
}

async function handlePostToolUse(toolName, toolInput, toolOutput) {
  const state = readVoiceState();
  if (!state.enabled) return;
  try {
    const ctx = buildContext(toolName, toolInput, toolOutput);
    const [reply, done] = await Promise.all([
      ask(`In 1 short Chinese sentence (20 chars max, casual), describe: ${ctx}. Vary your wording each time.`, 50),
      ask("Say a short Chinese completion phrase, 10 chars max, casual and confident (like 搞定了/完成啦/好嘞). Only output the phrase.", 20),
    ]);
    speak(reply);
    setTimeout(() => speak(done), 1500);
  } catch { /* silent */ }
}

async function handleSessionEnd() {
  if (!readVoiceState().enabled) return;
  try {
    const reply = await ask("Say a short Chinese goodbye, 15 chars max. Only output the phrase.", 30);
    speak(reply);
  } catch { /* silent */ }
}

// ─── Entry point ────────────────────────────────────────────────────
async function main() {
  const hookType = process.argv[2] || "";
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", c => (raw += c));
  process.stdin.on("end", async () => {
    raw = raw.trim();
    let input = {};
    try { input = JSON.parse(raw); } catch { /* ignore */ }

    switch (hookType) {
      case "SessionStart": await handleSessionStart(); break;
      case "PostToolUse":  await handlePostToolUse(input.tool_name || "", input.tool_input || {}, input.tool_output || {}); break;
      case "SessionEnd":    await handleSessionEnd();   break;
    }

    process.stdout.write(raw);
  });
}

main().catch(() => process.exit(0));
