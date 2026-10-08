// Fixed public websites only. Browser-supplied URLs are never fetched.
const sites = require("../../connections.js");
const guard = require("../../lib/guard.js");
// Results are reused for a short time per instance, so repeated page opens do not re-check every site.
const CACHE_MS = 120000;
let cache = null;
async function checkSite(site) {
  const started = performance.now();
  const checkedAt = new Date().toISOString();
  const original = new URL(site.url);
  const allowedHosts = new Set([original.hostname]);
  if (original.hostname.startsWith("www.")) allowedHosts.add(original.hostname.slice(4));
  const signal = AbortSignal.timeout(10000);
  try {
    let url = site.url;
    let response;
    for (let hop = 0; hop <= 3; hop++) {
      response = await fetch(url, { method: "GET", redirect: "manual", headers: { "User-Agent": "AgentArena-Monitor/1.0", "Accept": "text/html" }, signal, cache: "no-store" });
      if (response.body) await response.body.cancel();
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location || hop === 3) break;
      const next = new URL(location, url);
      if (next.protocol !== "https:" || next.port || next.username || next.password || !allowedHosts.has(next.hostname)) break;
      url = next.href;
    }
    const status = response.ok ? "Online" : response.status >= 300 && response.status < 400 ? "Redirect" : "HTTP error";
    return { ...site, status, httpStatus: response.status, responseTimeMs: Math.round(performance.now() - started), checkedAt };
  } catch (error) {
    return { ...site, status: error.name === "TimeoutError" || error.name === "AbortError" ? "Timeout" : "Unreachable", httpStatus: null, responseTimeMs: Math.round(performance.now() - started), checkedAt };
  }
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, status: "Failed", message: "Use POST to check websites." });
  }
  // Read-only, but still only for the Arena page itself.
  const hit = guard.check(req, { requireKey: false });
  if (hit) return guard.reject(res, hit);
  let results, cached = false;
  if (cache && Date.now() - cache.at < CACHE_MS) { results = cache.results; cached = true; }
  else { results = await Promise.all(sites.map(checkSite)); cache = { at: Date.now(), results }; }
  const online = results.filter(site => site.status === "Online").length;
  return res.status(200).json({ success: true, agent: "monitor", status: "Completed", cached, healthy: online === sites.length, message: online === sites.length ? "All "+sites.length+" websites are online." : online+" of "+sites.length+" websites are online. Review the highlighted results.", sites: results });
};
