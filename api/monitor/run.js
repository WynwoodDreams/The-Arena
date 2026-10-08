// Only configured public websites can be checked; clients cannot supply a URL.
const sites = [{ id: "buildersbench", name: "BuildersBench", url: "https://www.buildersbench.dev/" }];

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, status: "Failed", message: "Use POST to check websites." });
  }
  const results = await Promise.all(sites.map(async (site) => {
    const started = performance.now();
    const checkedAt = new Date().toISOString();
    try {
      const response = await fetch(site.url, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "AgentArena-Monitor/1.0", "Accept": "text/html" },
        signal: AbortSignal.timeout(10000),
        cache: "no-store"
      });
      // No redirects to unconfigured hosts; no response body is needed.
      if (response.body) await response.body.cancel();
      const status = response.ok ? "Online" : response.status >= 300 && response.status < 400 ? "Redirect" : "HTTP error";
      return { ...site, status, httpStatus: response.status, responseTimeMs: Math.round(performance.now() - started), checkedAt };
    } catch (error) {
      return { ...site, status: error.name === "TimeoutError" || error.name === "AbortError" ? "Timeout" : "Unreachable", httpStatus: null, responseTimeMs: Math.round(performance.now() - started), checkedAt };
    }
  }));
  const healthy = results.every(site => site.status === "Online");
  return res.status(200).json({
    success: true,
    agent: "monitor",
    status: "Completed",
    healthy,
    message: healthy ? "BuildersBench is online. Website check completed." : "Website check completed. BuildersBench needs attention.",
    sites: results
  });
};
