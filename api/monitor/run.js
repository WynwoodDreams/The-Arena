// Fixed public websites only. Browser-supplied URLs are never fetched.
const sites = require("../../connections.js");
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
  const results = await Promise.all(sites.map(checkSite));
  const online = results.filter(site => site.status === "Online").length;
  return res.status(200).json({ success: true, agent: "monitor", status: "Completed", healthy: online === sites.length, message: online === sites.length ? "All "+sites.length+" websites are online." : online+" of "+sites.length+" websites are online. Review the highlighted results.", sites: results });
};
