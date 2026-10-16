// Pushes this browser's Chief decisions to Supabase and returns the shared list.
// Writes need the access key when one is configured; the service role key never leaves the server.
const guard = require("../../lib/guard.js");
const decisions = require("../../lib/decisions.js");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Use POST to sync decisions." });
  }
  const hit = guard.check(req, { requireKey: true });
  if (hit) return guard.reject(res, hit);

  const cfg = decisions.config();
  if (!cfg) return res.status(200).json({ success: true, configured: false, decisions: [], message: "Shared decisions are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const incoming = (Array.isArray(body.decisions) ? body.decisions : []).slice(0, 200).map(decisions.clean).filter(Boolean);
  try {
    await decisions.merge(cfg, incoming);
    const shared = await decisions.list(cfg, 200);
    return res.status(200).json({ success: true, configured: true, pushed: incoming.length, decisions: shared, syncedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ success: false, configured: true, message: "Could not reach shared decisions: " + error.message });
  }
};
