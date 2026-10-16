#!/usr/bin/env node
// Outer-loop input: pulls Chief's decisions from Supabase and prints them grouped by station.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/export-decisions.js [--days 7] [--agent monitor] [--json]
// Run this from a trusted machine or a scheduled Claude Code session; never from the browser.
const decisions = require("../lib/decisions.js");

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i === -1 ? fallback : args[i + 1]; };
const days = Number(flag("--days", 7)) || 7;
const agent = flag("--agent", null);
const asJson = args.includes("--json");

(async () => {
  const cfg = decisions.config();
  if (!cfg) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first."); process.exit(1); }
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let query = "?select=*&order=created_at.desc&limit=1000&created_at=gte." + since;
  if (agent) query += "&agent=eq." + encodeURIComponent(agent);
  const rows = (await decisions.rest(cfg, "GET", query) || []).map(decisions.fromRow);
  if (asJson) { console.log(JSON.stringify(rows, null, 2)); return; }

  const byAgent = {};
  rows.forEach(d => { (byAgent[d.agent] ||= []).push(d); });
  console.log(`# Chief decisions · last ${days} day${days === 1 ? "" : "s"} · ${rows.length} rows\n`);
  for (const [station, list] of Object.entries(byAgent)) {
    const counts = {};
    list.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    console.log(`## ${station} · ` + Object.entries(counts).map(([s, n]) => `${s} ${n}`).join(" · "));
    const signal = list.filter(d => d.status === "changes requested" || d.status === "rejected");
    if (signal.length) {
      console.log("\nPushback (what the skill should change):");
      signal.forEach(d => console.log(`- [${d.status}] ${d.title}${d.note ? " — " + d.note : ""}`));
    }
    const repeats = {};
    list.forEach(d => { repeats[d.key] = (repeats[d.key] || 0) + 1; });
    const noisy = Object.entries(repeats).filter(([, n]) => n >= 3);
    if (noisy.length) {
      console.log("\nRepeated items (candidates to auto-resolve or merge):");
      noisy.forEach(([key, n]) => console.log(`- ${key} × ${n}`));
    }
    console.log("");
  }
})().catch(error => { console.error(error.message); process.exit(1); });
