// Private Vercel website analytics in the existing Arena workspace.
(function () {
  const anchor = document.getElementById("command-suite");
  if (!anchor) return;
  anchor.insertAdjacentHTML("afterend", '<section class="panel ana-wrap" id="analytics-center"><div class="panel-top ana-head"><span>WEBSITE ANALYTICS · VERCEL</span><button id="ana-refresh" class="ana-refresh">Load analytics</button></div><div class="ana-intro"><span id="ana-desc">Actual visitors and pageviews from tracked Vercel sites</span><span id="ana-status">PRIVATE</span></div><div id="ana-body" class="ana-message">Select Load analytics to check site traffic.</div></section>');
  const el = id => document.getElementById(id);
  const escapeText = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const number = n => typeof n === "number" ? n.toLocaleString("en-US") : "—";
  async function update() {
    el("ana-refresh").disabled = true;
    try {
      const response = await apiFetch("/api/analytics/sites", {}, 20000);
      const result = await response.json();
      if (!response.ok || !result.success) {
        el("ana-status").textContent = "SETUP / ERROR";
        el("ana-body").textContent = result.message || "Analytics are not available yet.";
        return;
      }
      const sites = result.sites;
      sites.sort((a,b) => (b.status === "verified")-(a.status === "verified") || (b.visitors || 0)-(a.visitors || 0));
      const verified = sites.filter(s => s.status === "verified");
      const visitors = verified.reduce((n,s) => n+s.visitors,0);
      const views = verified.reduce((n,s) => n+s.pageviews,0);
      const header = '<div class="ana-stats"><div class="ana-stat"><span>SITE VISITORS</span><strong>'+number(visitors)+'</strong><small>Sum across sites</small></div><div class="ana-stat"><span>PAGE VIEWS</span><strong>'+number(views)+'</strong></div><div class="ana-stat"><span>REPORTING</span><strong>'+verified.length+' / '+sites.length+'</strong></div><div class="ana-stat"><span>PERIOD</span><strong>30 days</strong></div></div>';
      const cards = sites.map(s => '<article class="ana-card"><div class="ana-card-head"><h3>'+escapeText(s.name)+'</h3><span class="ana-badge" data-state="'+escapeText(s.status)+'">'+(s.status==="verified"?"Verified":s.status==="not_enabled"?"Not enabled":"Unavailable")+'</span></div><div class="ana-numbers"><div><strong>'+number(s.visitors)+'</strong><span> Visitors</span></div><div><strong>'+number(s.pageviews)+'</strong><span> Views</span></div></div><div class="ana-explain">'+escapeText(s.project)+'</div></article>').join("");
      el("ana-body").innerHTML = header+'<div class="ana-grid">'+cards+'</div>';
      el("ana-desc").textContent = "Live Vercel Web Analytics. No invented traffic.";
      el("ana-status").textContent = "REFRESHED "+new Date(result.checkedAt).toLocaleDateString();
    } catch {
      el("ana-status").textContent = "UNAVAILABLE";
      el("ana-body").textContent = "Analytics request failed. Retry later.";
    } finally {el("ana-refresh").disabled=false}
  }
  el("ana-refresh").addEventListener("click",update);
})();
