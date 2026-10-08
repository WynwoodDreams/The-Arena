// Shared protection for the server endpoints. Nothing here is a secret.
const crypto = require("crypto");

function sameOrigin(req) {
  // Browsers always send Origin on cross-site and same-site fetch POSTs; a missing one is not a browser page of ours.
  const origin = req.headers && req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

function keyOk(req) {
  const want = process.env.ARENA_ACCESS_KEY;
  if (!want) return true; // Key not configured: origin check alone applies.
  const got = String((req.headers && req.headers["x-arena-key"]) || "");
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Returns null when the request may proceed, else {status, body} to send.
function check(req, { requireKey = true } = {}) {
  if (!sameOrigin(req)) return { status: 403, body: { success: false, status: "Failed", message: "Request origin not allowed." } };
  if (requireKey && !keyOk(req)) return { status: 401, body: { success: false, status: "Failed", message: "Access key required.", needsKey: true } };
  return null;
}

function reject(res, hit) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(hit.status).json(hit.body);
}

module.exports = { check, reject, sameOrigin, keyOk };
