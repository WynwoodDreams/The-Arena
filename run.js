// Vercel serverless route: POST /api/scout/run
// Keep n8n credentials here on the server, never in the public HTML.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, status: 'Failed', message: 'Method not allowed' });
  }
  const url = process.env.N8N_SCOUT_WEBHOOK_URL;
  if (!url) {
    return res.status(500).json({ success: false, status: 'Failed', message: 'Server is missing N8N_SCOUT_WEBHOOK_URL.' });
  }
  let parsed;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.pathname.includes('/webhook/')) throw new Error('invalid');
  } catch {
    return res.status(500).json({ success: false, status: 'Failed', message: 'Production webhook URL is invalid. Use the n8n Production URL (not webhook-test).' });
  }
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.N8N_SCOUT_AUTH_HEADER_VALUE) {
      headers[process.env.N8N_SCOUT_AUTH_HEADER_NAME || 'X-Agent-Arena-Key'] = process.env.N8N_SCOUT_AUTH_HEADER_VALUE;
    }
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agent: 'scout', source: 'agent-arena', requestedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(55000)
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }
    if (!upstream.ok) {
      return res.status(502).json({ success: false, status: 'Failed', message: `n8n returned HTTP ${upstream.status}. Check the n8n execution log.` });
    }
    // Never claim completion from an empty/non-JSON response.
    if (!data || data.success !== true || String(data.status).toLowerCase() !== 'completed') {
      return res.status(502).json({ success: false, status: 'Failed', message: 'n8n did not return the expected completed JSON. Check Respond to Webhook configuration.' });
    }
    return res.status(200).json({ success: true, agent: 'scout', status: 'Completed', message: String(data.message || 'Job search completed').slice(0, 2000) });
  } catch (error) {
    const timeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({ success: false, status: 'Failed', message: timeout ? 'n8n took too long to respond. Check n8n execution history before retrying.' : 'Could not reach n8n. Check the webhook URL and n8n execution history.' });
  }
};
