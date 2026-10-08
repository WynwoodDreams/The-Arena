const {randomUUID}=require('crypto');
// Starts the Scout n8n workflow. The webhook URL and auth stay server-side.
const guard = require("../../lib/guard.js");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, status: "Failed", message: "Method not allowed" });
  }

  // Scout can start paid work, so it needs the page's origin and, when configured, the access key.
  const hit = guard.check(req, { requireKey: true });
  if (hit) return guard.reject(res, hit);

  const url = process.env.N8N_SCOUT_WEBHOOK_URL;
  if (!url) {
    return res.status(500).json({ success: false, status: "Failed", message: "Missing n8n webhook URL" });
  }

  const requestId=randomUUID();
  try {
    const headers = { "Content-Type": "application/json" };
    if (process.env.N8N_SCOUT_AUTH_HEADER_VALUE) {
      headers[process.env.N8N_SCOUT_AUTH_HEADER_NAME || "X-Agent-Arena-Key"] = process.env.N8N_SCOUT_AUTH_HEADER_VALUE;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ agent: "scout", arenaRequestId: requestId, source: "agent-arena", requestedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) throw new Error(`n8n returned ${response.status}`);

    return res.status(202).json({ success: true, requestId, agent: "scout", status: "Started", message: "Scout job search started successfully in n8n." });
  } catch (error) {
    return res.status(502).json({ success: false, status: "Failed", message: `Unable to start n8n workflow: ${error.message}` });
  }
};
