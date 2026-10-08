// Run with: npm test
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

function fakeRes() {
  const res = { headers: {}, statusCode: 0, body: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}
function req(extra = {}) {
  const { headers, ...rest } = extra;
  return { method: "POST", ...rest, headers: { host: "arena.test", origin: "https://arena.test", ...headers } };
}
const realFetch = global.fetch;
const env = { ...process.env };
beforeEach(() => { delete require.cache[require.resolve("../api/monitor/run.js")]; });
afterEach(() => { global.fetch = realFetch; process.env = { ...env }; });

test("guard: missing origin is rejected", () => {
  const guard = require("../lib/guard.js");
  assert.equal(guard.check({ headers: { host: "a" } }).status, 403);
  assert.equal(guard.check({ headers: { host: "a", origin: "https://evil" } }).status, 403);
  assert.equal(guard.check({ headers: { host: "a", origin: "https://a" } }), null);
});

test("guard: access key required only when configured", () => {
  const guard = require("../lib/guard.js");
  process.env.ARENA_ACCESS_KEY = "secret";
  assert.equal(guard.check(req()).status, 401);
  assert.equal(guard.check(req({ headers: { "x-arena-key": "wrong" } })).status, 401);
  assert.equal(guard.check(req({ headers: { "x-arena-key": "secret" } })), null);
  assert.equal(guard.check(req(), { requireKey: false }), null);
});

test("scout: forwards to n8n and answers Started", async () => {
  process.env.N8N_SCOUT_WEBHOOK_URL = "https://n8n.test/webhook/scout";
  let called = null;
  global.fetch = async (url, opts) => { called = { url, opts }; return { ok: true, status: 200 }; };
  const res = fakeRes();
  await require("../api/scout/run.js")(req(), res);
  assert.equal(res.statusCode, 202);
  assert.equal(res.body.status, "Started");
  assert.equal(called.url, "https://n8n.test/webhook/scout");
});

test("scout: rejects a request without the page origin before touching n8n", async () => {
  process.env.N8N_SCOUT_WEBHOOK_URL = "https://n8n.test/webhook/scout";
  let called = false;
  global.fetch = async () => { called = true; return { ok: true }; };
  const res = fakeRes();
  await require("../api/scout/run.js")({ method: "POST", headers: { host: "arena.test" } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(called, false);
});

test("flow: derives the Grant Radar path from the Scout host", async () => {
  delete process.env.N8N_GRANT_RADAR_WEBHOOK_URL;
  process.env.N8N_SCOUT_WEBHOOK_URL = "https://n8n.test/webhook/scout";
  let url = null;
  global.fetch = async (u) => { url = u; return { ok: true, status: 200 }; };
  const res = fakeRes();
  await require("../api/flow/run.js")(req(), res);
  assert.equal(res.statusCode, 202);
  assert.equal(url, "https://n8n.test/webhook/agent-arena-grant-radar");
});

test("monitor: checks every site once, then serves the cache", async () => {
  let hits = 0;
  global.fetch = async () => { hits++; return { ok: true, status: 200, headers: { get: () => null }, body: { cancel: async () => {} } }; };
  const handler = require("../api/monitor/run.js");
  const a = fakeRes(); await handler(req(), a);
  const b = fakeRes(); await handler(req(), b);
  assert.equal(a.statusCode, 200);
  assert.equal(a.body.sites.length, require("../connections.js").length);
  assert.equal(a.body.cached, false);
  assert.equal(b.body.cached, true);
  assert.equal(hits, require("../connections.js").length);
});

test("portfolio.json holds only public fields", () => {
  const j = require("../board/portfolio.json");
  assert.equal(j.app, "my-arena-portfolio");
  for (const [id, p] of Object.entries(j.items)) {
    assert.match(id, /^[A-Za-z0-9_.~:@+-]{1,200}$/);
    for (const k of ["tasks", "notes", "people", "files"]) assert.equal(k in p, false, `${id} must not carry ${k}`);
  }
});
