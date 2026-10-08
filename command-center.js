// Read-only public project intelligence + existing n8n controls.
// No fake metrics, no webhook URL, no credential in this file.
(function(){
  "use strict";
  const after=document.getElementById("agent-columns");
  if(!after)return;
  const html=[
    '<section class="command-suite" id="command-suite" aria-label="Project and mission command">',
    '<section class="panel" aria-labelledby="cmd-project-title">',
    '<div class="panel-top cmd-head"><span><i class="live-dot"></i> <span id="cmd-project-title">LIVE PROJECT COMMAND</span></span><button id="cmd-refresh" type="button">Refresh GitHub</button></div>',
    '<div class="cmd-meta"><span id="cmd-project-status">Loading public GitHub repositories…</span><input id="cmd-project-search" type="search" placeholder="Find a project" aria-label="Filter connected projects"></div>',
    '<div class="cmd-list cmd-project-list" id="cmd-project-list" aria-live="polite"></div>',
    '<p class="cmd-note">GitHub commits and Vercel deployment status are read-only. Website checks come from Monitor. Unknown means unverified, not offline.</p></section>',
    '<section class="panel" aria-labelledby="cmd-missions-title">',
    '<div class="panel-top cmd-head"><span><i class="live-dot"></i> <span id="cmd-missions-title">AGENT MISSION CONTROL</span></span><span class="muted">N8N · REAL REQUESTS</span></div>',
    '<div class="cmd-meta">Run a connected workflow or inspect its last acknowledged request.</div>',
    '<div class="cmd-list" id="cmd-mission-list" aria-live="polite"></div>',
    '<div class="cmd-history"><div class="cmd-history-heading">REQUEST HISTORY <span>THIS BROWSER</span></div><div id="cmd-run-list"></div></div>',
    '<p class="cmd-note">Started = accepted by n8n, not finished. No completion or progress is invented. Completion is retrieved when private n8n API access is configured; the data itself stays in n8n Executions.</p></section></section>'
  ].join("");
  after.insertAdjacentHTML("afterend",html);

  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const dateLabel=raw=>{
    if(!raw)return "Unknown time";
    const date=new Date(raw);
    return Number.isNaN(date.getTime())?"Unknown time":date.toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+" ET";
  };
  const https=url=>{try{const parsed=new URL(url);return parsed.protocol==="https:"?parsed.href:null}catch{return null}};
  const source={
    loading:true,projects:[],error:null,checkedAt:null
  };

  function siteHealth(id){
    if(typeof monitorRun==="undefined")return "Not checked";
    const site=monitorRun.sites.find(s=>s.id===id);
    if(!site||!site.checkedAt)return "Not checked";
    return site.status==="Online"?"Online at last check":site.status+" at last check";
  }

  function projectView(){
    $("cmd-refresh").disabled=source.loading;
    $("cmd-refresh").textContent=source.loading?"Checking…":"Refresh GitHub";
    if(source.loading&&!source.projects.length){
      $("cmd-project-list").innerHTML='<p class="cmd-empty">Loading live GitHub data…</p>';return;
    }
    if(source.error&&!source.projects.length){
      $("cmd-project-status").textContent="Live project data unavailable";
      $("cmd-project-list").innerHTML='<p class="cmd-empty">'+esc(source.error)+'</p>';return;
    }
    const all=source.projects;
    const checked=all.filter(p=>p.lastCommit).length;
    $("cmd-project-status").textContent=checked+" verified public repositories · "+all.length+" tracked projects · "+dateLabel(source.checkedAt);
    const q=$("cmd-project-search").value.trim().toLowerCase();
    const matches=all.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q));
    $("cmd-project-list").innerHTML=matches.map(p=>{
      const commit=p.lastCommit;
      const deploy=p.deployment;
      const display=deploy?({success:"Deployed",pending:"Pending",failure:"Failed",error:"Error"}[deploy.status]||"Unknown"):(p.repository?"Unverified":"No repository");
      const state=deploy?.status||"Not linked";
      const app=https(p.url),repo=https(p.repository);
      const vercel=deploy?.url&&/^https:\/\/vercel\.com(\/|$)/i.test(deploy.url)?deploy.url:null;
      const detail=commit?(commit.message||"No commit message"):"GitHub commit data not available";
      const extra=commit?"Commit "+commit.sha+" · "+dateLabel(commit.at):p.repository?"Public GitHub data unavailable":"No linked GitHub repository";
      const site=(window.ARENA_SITES||[]).some(s=>s.id===p.id)?" · Website: "+siteHealth(p.id):"";
      return '<article class="cmd-card"><div class="cmd-card-head"><div><h3>'+esc(p.name)+'</h3><small>'+esc(p.category||"Creative project")+'</small></div><span class="cmd-state" data-state="'+esc(state)+'">'+esc(display)+'</span></div>'+
        '<p class="cmd-detail">'+esc(detail)+'</p><div class="cmd-source">'+esc(extra)+site.split("<").join("&lt;")+'</div><div class="cmd-links">'+
        (app?'<a href="'+esc(app)+'" target="_blank" rel="noopener noreferrer">Open site ↗</a>':"")+
        (repo?'<a href="'+esc(repo)+'" target="_blank" rel="noopener noreferrer">Repository ↗</a>':"")+
        (vercel?'<a href="'+esc(vercel)+'" target="_blank" rel="noopener noreferrer">Vercel ↗</a>':"")+'</div></article>';
    }).join("")||'<p class="cmd-empty">No matching projects.</p>';
  }

  async function loadProjects(force){
    if(source.loading&&source.projects.length)return;
    source.loading=true;source.error=null;projectView();
    try{
      const url="/api/projects/status"+(force?"?refresh="+Date.now():"");
      const res=await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(18000)});
      if(!res.ok)throw new Error("GitHub request returned HTTP "+res.status);
      const data=await res.json();
      if(data.success!==true||!Array.isArray(data.projects))throw new Error("Unexpected project response");
      source.projects=data.projects;
      source.checkedAt=data.checkedAt||new Date().toISOString();
    }catch(error){
      source.error=error.name==="TimeoutError"?"GitHub request timed out. Try refreshing.":"GitHub could not be checked. Try refreshing.";
    }finally{source.loading=false;projectView()}
  }

  function renderMissions(){
    if(typeof scoutRun==="undefined"||typeof flowRuns==="undefined"||typeof state==="undefined")return;
    const workflows=(window.ARENA_WORKFLOWS||[]).filter(w=>w.path);
    const all=[{id:"scout",name:"Scout · AI Jobs Monitor",station:"Scout",status:scoutRun.status,message:scoutRun.message},...workflows.map(w=>({id:w.id,name:w.name,station:"Flow",status:flowRuns[w.id]?.status||"Ready",message:flowRuns[w.id]?.message||w.detail}))];
    $("cmd-mission-list").innerHTML=all.map(m=>{
      const started=m.status==="Started";
      const message=started?"n8n accepted the request; waiting for a saved execution result.":m.message||"Ready. No request submitted yet.";
      return '<article class="cmd-card"><div class="cmd-card-head"><div><h3>'+esc(m.name)+'</h3><small>'+esc(m.station)+' · n8n</small></div><span class="cmd-state" data-state="'+esc(m.status)+'">'+esc(m.status)+'</span></div>'+
       '<p class="cmd-detail">'+esc(message)+'</p><div class="cmd-links"><button type="button" data-cmd-run="'+esc(m.id)+'"'+(m.status==="Running"?" disabled":"")+">"+(m.status==="Running"?"Sending…":"Run "+esc(m.station==="Scout"?"Scout":m.name))+"</button></div></article>";
    }).join("");
    const past=state.runs.filter(r=>r.agent==="scout"||r.agent==="flow").slice(0,6);
    $("cmd-run-list").innerHTML=past.map(r=>'<div class="cmd-run"><b>'+esc(r.agent)+'</b><div><strong>'+esc(r.status)+'</strong> · '+esc(r.message||"Request recorded")+'<time>'+esc(dateLabel(r.createdAt))+'</time></div></div>').join("")||'<p class="cmd-empty">No workflow requests recorded on this device yet.</p>';
  }

  $("cmd-refresh").onclick=()=>loadProjects(true);
  $("cmd-project-search").addEventListener("input",projectView);
  $("cmd-mission-list").addEventListener("click",event=>{
    const b=event.target.closest("button[data-cmd-run]");
    if(!b||b.disabled)return;
    const task=b.dataset.cmdRun;
    const result=task==="scout"?runScout():runFlow(task);
    renderMissions();
    Promise.resolve(result).then(renderMissions,renderMissions);
  });
  window.ArenaCommand={refreshViews:()=>{projectView();renderMissions()},refreshProjects:()=>loadProjects(true)};
  projectView();renderMissions();loadProjects(false);
})();