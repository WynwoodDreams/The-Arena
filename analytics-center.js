// Analytics appear inside the EXISTING Website Monitor cards, not a separate panel.
// Historical values below are verified Vercel Web Analytics observations for Sep 8–Oct 8, 2026.
// When the private Vercel Analytics endpoint is configured, fresh values replace these snapshots.
(function () {
  "use strict";
  const snapshots = Object.freeze({
    buildersbench: { visitors:194, pageviews:266 },
    cob: { visitors:141, pageviews:211 },
    emriders: { visitors:41, pageviews:75 },
    arrestintelligence: { visitors:2, pageviews:2 }
  });
  const disabled = new Set(["mdpd", "environmental"]);
  const snapshotPeriod = "Sep 8–Oct 8, 2026";
  let current = null;
  let requested = false;
  let onlineTotal = null, onlineSites = 0, onlineWindow = 5, onlineCheckedAt = null;

  const safeNumber = n => Number.isFinite(n) && n >= 0 ? n.toLocaleString("en-US") : "—";

  function cardMarkup(site) {
    const live = current && current[site.id];
    const verified = live && live.status === "verified" &&
      Number.isFinite(live.visitors) && Number.isFinite(live.pageviews);
    const historical = snapshots[site.id];
    const record = verified ? live : historical;
    const onlineKnown = live && Number.isFinite(live.online);
    const onlineCell = '<div class="site-online"><span>ONLINE NOW</span><strong>' + (onlineKnown ? safeNumber(live.online) : '—') + '</strong></div>';
    if (!record) {
      return '<div class="site-traffic site-traffic-muted">' + onlineCell +
        (disabled.has(site.id) ? "Web Analytics not enabled" : "No verified analytics available") +
        '</div>';
    }
    return '<div class="site-traffic"><div class="site-traffic-values">' + onlineCell +
      '<div><span>VISITORS</span><strong>' + safeNumber(record.visitors) + '</strong></div>' +
      '<div><span>PAGE VIEWS</span><strong>' + safeNumber(record.pageviews) + '</strong></div>' +
      '</div><div class="site-traffic-note">' +
      (verified ? 'Vercel · last 30 days · live query' : 'Vercel · ' + snapshotPeriod + ' · verified snapshot') +
      (onlineKnown ? ' · online = visitors in the last ' + onlineWindow + ' min' : '') +
      '</div></div>';
  }

  async function refresh() {
    if (requested) return;
    requested = true;
    try {
      const headers = {"Content-Type": "application/json"};
      let key = "";
      try { key = localStorage.getItem("arena-access-key") || ""; } catch {}
      if (key) headers["X-Arena-Key"] = key;
      const response = await fetch("/api/analytics/sites", {
        method: "POST", headers, body: "{}", cache: "no-store",
        signal: AbortSignal.timeout(16000)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success === true && Array.isArray(data.sites)) {
          current = Object.fromEntries(data.sites.map(s => [s.id, s]));
          onlineTotal = Number.isFinite(data.totalOnline) ? data.totalOnline : null;
          onlineSites = Number.isFinite(data.onlineSites) ? data.onlineSites : 0;
          onlineWindow = Number.isFinite(data.onlineWindowMinutes) ? data.onlineWindowMinutes : onlineWindow;
          onlineCheckedAt = data.checkedAt || null;
          if (typeof renderWebsites === "function") renderWebsites();
          renderTotal();
        }
      }
      // No setup? Keep the labelled historical snapshot, without a popup or misleading zero.
    } catch {
      // No traffic numbers are invented on network errors.
    } finally {
      requested = false;
    }
  }
  // Total people online across every site, shown in the Website Monitor header and on the wall.
  function totalText() {
    if (onlineTotal === null) return 'ONLINE NOW · —';
    const partial = onlineSites < Object.keys(current || {}).length ? ' · ' + onlineSites + ' SITES REPORTING' : '';
    return 'ONLINE NOW · ' + safeNumber(onlineTotal) + partial;
  }
  function renderTotal() {
    const header = document.getElementById('website-online');
    if (header) { header.textContent = totalText(); header.title = onlineCheckedAt ? 'Visitors in the last ' + onlineWindow + ' min, checked ' + new Date(onlineCheckedAt).toLocaleTimeString() : 'Needs the private Vercel Analytics endpoint'; }
    const wall = document.getElementById('wall-online');
    if (wall) wall.textContent = onlineTotal === null ? 'USERS · —' : 'USERS · ' + safeNumber(onlineTotal) + ' ONLINE';
  }
  window.ArenaAnalytics = { cardMarkup, refresh, totalOnline: () => onlineTotal, renderTotal };
  if (typeof renderWebsites === "function") renderWebsites();
  renderTotal();
  // A ready private API can quietly replace the historical snapshot with live traffic.
  refresh();
  // Online counts go stale quickly, so refresh each minute while the page is visible.
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();