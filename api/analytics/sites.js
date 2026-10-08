// Private, read-only Vercel Web Analytics endpoint.
// Set VERCEL_ANALYTICS_TOKEN and ARENA_ANALYTICS_ACCESS_KEY in Vercel.
// Never expose visitor numbers on a public route without access-key validation.
const crypto = require("crypto");
const sites = require("../../lib/analytics-sites.js");
const TEAM_ID = "team_g6NkapUNAEH5U9sagjaSsRfz";

function equalSecret(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function querySite(site, since, until, token, teamId) {
  const params = new URLSearchParams({
    projectId: site.project,
    since: new Date(since).toISOString(),
    until: new Date(until).toISOString(),
    teamId
  });
  try {
    const response = await fetch("https://api.vercel.com/v1/query/web-analytics/visits/count?" + params.toString(), {
      headers: {Authorization: "Bearer " + token, Accept: "application/json"},
      redirect: "error",
      signal: AbortSignal.timeout(7500)
    });
    if (!response.ok) {
      let code = "";
      try {const body = await response.json();code = String(body.error?.code || "");} catch {}
      return {...site, status: code === "web_analytics_not_enabled" ? "not_enabled" :
        response.status === 401 || response.status === 403 ? "restricted" : "unavailable",
        visitors: null, pageviews: null};
    }
    const body = await response.json();
    const metrics = body.data || body.result?.data || {};
    const visitors = metrics.visitors;
    const pageviews = metrics.pageviews;
    if (!Number.isFinite(visitors) || !Number.isFinite(pageviews)) {
      return {...site, status: "unavailable", visitors: null, pageviews: null};
    }
    return {...site, status: "verified", visitors, pageviews};
  } catch {
    return {...site, status: "unavailable", visitors: null, pageviews: null};
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({success:false,message:"GET only"});
  }
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const accessKey = process.env.ARENA_ANALYTICS_ACCESS_KEY;
  if (!token || !accessKey) {
    return res.status(503).json({
      success:false, needsSetup:true,
      message:"Analytics are not configured yet. Add VERCEL_ANALYTICS_TOKEN and ARENA_ANALYTICS_ACCESS_KEY in the Arena Vercel environment settings."
    });
  }
  if (!equalSecret(req.headers["x-arena-analytics-key"], accessKey)) {
    return res.status(401).json({success:false,needsKey:true,message:"Enter your private Arena Analytics access key."});
  }
  const until = Date.now();
  const since = until - 30*24*60*60*1000;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID || TEAM_ID;
  const rows = await Promise.all(sites.map(site=>querySite(site, since, until, token, teamId)));
  return res.status(200).json({
    success:true,source:"Vercel Web Analytics",periodDays:30,
    since:new Date(since).toISOString(),until:new Date(until).toISOString(),
    checkedAt:new Date().toISOString(),
    sites:rows
  });
};
