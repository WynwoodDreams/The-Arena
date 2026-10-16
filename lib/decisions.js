// Shared shape of a Chief decision, used by the sync endpoint and the export script.
// Nothing here is a secret.
const AGENTS = ["chief", "scout", "flow", "pulse", "forge", "monitor"];
const KINDS = ["issue", "review", "approval"];
const STATUSES = ["pending", "approved", "changes requested", "rejected", "reviewed", "resolved"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Returns a clean decision or null when the input cannot be trusted.
function clean(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").toLowerCase();
  const createdAt = isoOrNull(raw.createdAt);
  if (!UUID.test(id) || !createdAt) return null;
  if (!AGENTS.includes(raw.agent) || !KINDS.includes(raw.kind) || !STATUSES.includes(raw.status)) return null;
  const title = String(raw.title || "").trim().slice(0, 140);
  if (!title) return null;
  return {
    id,
    key: String(raw.key || "manual").slice(0, 120),
    agent: raw.agent,
    kind: raw.kind,
    title,
    detail: String(raw.detail || "").slice(0, 2000),
    status: raw.status,
    note: String(raw.note || "").trim().slice(0, 500),
    createdAt,
    decidedAt: raw.status === "pending" ? null : isoOrNull(raw.decidedAt)
  };
}

function toRow(d) {
  return { id: d.id, key: d.key, agent: d.agent, kind: d.kind, title: d.title, detail: d.detail, status: d.status, note: d.note, created_at: d.createdAt, decided_at: d.decidedAt };
}

function fromRow(r) {
  return { id: r.id, key: r.key, agent: r.agent, kind: r.kind, title: r.title, detail: r.detail, status: r.status, note: r.note || "", createdAt: r.created_at, decidedAt: r.decided_at, updatedAt: r.updated_at };
}

// Supabase REST access with the service role key. Only ever called server-side.
function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return { base: parsed.origin + "/rest/v1/arena_decisions", key };
  } catch { return null; }
}

async function rest(cfg, method, query, body, prefer) {
  const headers = { apikey: cfg.key, Authorization: "Bearer " + cfg.key, Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(cfg.base + (query || ""), { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Supabase returned HTTP " + response.status);
  return response.status === 204 ? null : response.json();
}

async function list(cfg, limit = 200) {
  const rows = await rest(cfg, "GET", "?select=*&order=created_at.desc&limit=" + limit);
  return (Array.isArray(rows) ? rows : []).map(fromRow);
}

// Upserts the given decisions. A decision Chief already settled on another device is never
// reopened by a stale pending copy; everything else is replaced by the newer copy.
async function merge(cfg, incoming) {
  if (!incoming.length) return;
  const ids = incoming.map(d => d.id);
  const existing = await rest(cfg, "GET", "?select=id,status&id=in.(" + ids.join(",") + ")");
  const settled = new Set((existing || []).filter(r => r.status !== "pending").map(r => r.id));
  const rows = incoming.filter(d => !(d.status === "pending" && settled.has(d.id))).map(toRow);
  if (rows.length) await rest(cfg, "POST", "", rows, "resolution=merge-duplicates,return=minimal");
}

module.exports = { AGENTS, KINDS, STATUSES, clean, toRow, fromRow, config, rest, list, merge };
