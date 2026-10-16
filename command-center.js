// Read-only public project intelligence + existing n8n controls.
// No fake metrics, no webhook URL, no credential in this file.
(function(){
  "use strict";
  const after=document.getElementById("agent-columns");
  if(!after)return;
  const html=[
    '<section class="command-suite" id="command-suite" aria-label="Project and mission command">',
    '<section class="panel" aria-labelledby="cmd-project-title">',
    '<div class="panel-top cmd-head"><span><i class="live-dot"></i> <span id="cmd-project-title">FORGE · PROJECT COMMAND</span></span><button id="cmd-refresh" type="button">Refresh GitHub</button></div>',
    '<div class="cmd-meta"><span id="cmd-project-status">Loading public GitHub repositories…</span><input id="cmd-project-search" type="search" placeholder="Find a project" aria-label="Filter connected projects"></div>',
    '<div class="forge-board"><aside class="forge-lanes" id="forge-lanes" aria-label="Deployment states"></aside><div class="forge-feed" id="forge-feed" aria-live="polite"></div></div>',
    '<section class="forge-summary" id="forge-summary" aria-label="Recent code activity"></section>',
    '<p class="cmd-note">GitHub commits, line counts, and Vercel deployment status are read-only. Line counts cover the recent commits listed, not whole repositories. Website checks come from Monitor. Unverified means GitHub data was unavailable, not offline.</p></section>',
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

  const ago=raw=>{
    if(!raw)return "Unknown time";
    const diff=Date.now()-new Date(raw).getTime();
    if(Number.isNaN(diff))return "Unknown time";
    const m=Math.round(diff/60000);
    if(m<1)return "just now";
    if(m<60)return m+"m ago";
    const h=Math.round(m/60);
    if(h<24)return h+"h ago";
    const d=Math.round(h/24);
    if(d<30)return d+"d ago";
    return dateLabel(raw);
  };
  const num=v=>Number(v||0).toLocaleString("en-US");
  const LANES=[["Deployed","success","Vercel reported success"],["Pending","pending","Vercel build in progress"],["Failed","failure","Vercel reported failure or error"],["Unverified","unverified","No deployment status on the latest commit"],["No repository","unlinked","Website only; nothing to inspect"]];
  function laneOf(p){
    if(!p.repository)return "unlinked";
    if(!p.deployment)return "unverified";
    if(p.deployment.status==="success")return "success";
    if(p.deployment.status==="pending")return "pending";
    if(p.deployment.status==="failure"||p.deployment.status==="error")return "failure";
    return "unverified";
  }
  const laneLabel={success:"Deployed",pending:"Pending",failure:"Failed",unverified:"Unverified",unlinked:"No repository"};
  const initials=name=>String(name||"?").split(/[\s-]+/).map(w=>w[0]||"").join("").slice(0,2).toUpperCase();

  function renderLanes(all){
    $("forge-lanes").innerHTML=LANES.map(([label,key,hint])=>{
      const members=all.filter(p=>laneOf(p)===key);
      return '<div class="forge-lane" data-lane="'+key+'"><div class="forge-lane-head"><span>'+esc(label)+'</span><strong>'+members.length+'</strong></div><small>'+esc(hint)+'</small>'+
        (members.length?'<ul>'+members.map(p=>'<li><i style="--dot:'+esc(p.color||"#8d97aa")+'"></i>'+esc(p.name)+'</li>').join("")+'</ul>':'<p class="forge-lane-empty">None</p>')+'</div>';
    }).join("");
  }

  function renderSummary(all){
    const withActivity=all.filter(p=>p.codeActivity&&p.codeActivity.counted>0);
    if(!withActivity.length){
      $("forge-summary").innerHTML='<div class="forge-summary-head"><h3>Recent code activity</h3><span class="muted">GITHUB</span></div><p class="cmd-empty">No line counts available yet. GitHub commit details could not be read for the tracked repositories.</p>';return;
    }
    const additions=withActivity.reduce((n,p)=>n+p.codeActivity.additions,0);
    const deletions=withActivity.reduce((n,p)=>n+p.codeActivity.deletions,0);
    const commits=withActivity.reduce((n,p)=>n+p.codeActivity.counted,0);
    const ranked=withActivity.slice().sort((a,b)=>(b.codeActivity.additions+b.codeActivity.deletions)-(a.codeActivity.additions+a.codeActivity.deletions));
    const latest=all.flatMap(p=>(p.recentCommits||[]).map(c=>({...c,project:p.name,color:p.color}))).filter(c=>c.at).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6);
    $("forge-summary").innerHTML='<div class="forge-summary-head"><h3>'+num(additions+deletions)+' lines changed</h3><span class="muted">LAST '+commits+' COUNTED COMMIT'+(commits===1?"":"S")+' · <b class="plus">+'+num(additions)+'</b> <b class="minus">−'+num(deletions)+'</b></span></div>'+
      '<div class="forge-summary-grid"><div><div class="forge-sub">Most active projects</div><ol class="forge-rank">'+ranked.map((p,i)=>'<li><span class="forge-avatar" style="--dot:'+esc(p.color||"#8d97aa")+'">'+esc(initials(p.name))+'</span><div><strong>'+esc(p.name)+'</strong><small>'+p.codeActivity.counted+' counted of '+p.codeActivity.commits+' recent commits · <b class="plus">+'+num(p.codeActivity.additions)+'</b> <b class="minus">−'+num(p.codeActivity.deletions)+'</b></small></div><span class="forge-badge'+(i<3?" top":"")+'">#'+(i+1)+'</span></li>').join("")+'</ol></div>'+
      '<div><div class="forge-sub">Latest commits</div><ul class="forge-commits">'+latest.map(c=>'<li><i style="--dot:'+esc(c.color||"#8d97aa")+'"></i><div><strong>'+esc(c.message||"No commit message")+'</strong><small>'+esc(c.project)+' · '+esc(c.sha)+(c.author?' · '+esc(c.author):"")+' · '+esc(ago(c.at))+(c.additions!=null?' · <b class="plus">+'+num(c.additions)+'</b> <b class="minus">−'+num(c.deletions)+'</b>':"")+'</small></div></li>').join("")+'</ul></div></div>';
  }

  function projectView(){
    $("cmd-refresh").disabled=source.loading;
    $("cmd-refresh").textContent=source.loading?"Checking…":"Refresh GitHub";
    if(source.loading&&!source.projects.length){
      $("forge-feed").innerHTML='<p class="cmd-empty">Loading live GitHub data…</p>';$("forge-lanes").innerHTML="";$("forge-summary").innerHTML="";return;
    }
    if(source.error&&!source.projects.length){
      $("cmd-project-status").textContent="Live project data unavailable";
      $("forge-feed").innerHTML='<p class="cmd-empty">'+esc(source.error)+'</p>';$("forge-lanes").innerHTML="";$("forge-summary").innerHTML="";return;
    }
    const all=source.projects;
    const checked=all.filter(p=>p.lastCommit).length;
    $("cmd-project-status").textContent=checked+" verified public repositories · "+all.length+" tracked projects · "+dateLabel(source.checkedAt);
    renderLanes(all);
    renderSummary(all);
    const q=$("cmd-project-search").value.trim().toLowerCase();
    const matches=all.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q));
    $("forge-feed").innerHTML=matches.map(p=>{
      const commit=p.lastCommit;
      const deploy=p.deployment;
      const lane=laneOf(p);
      const app=https(p.url),repo=https(p.repository);
      const vercel=deploy?.url&&/^https:\/\/vercel\.com(\/|$)/i.test(deploy.url)?deploy.url:null;
      const detail=commit?(commit.message||"No commit message"):p.repository?"GitHub commit data not available":"Website only. No linked repository.";
      const when=commit?"Committed "+ago(commit.at)+" · "+commit.sha:p.repository?"Public GitHub data unavailable":"";
      const authors=[...new Set((p.recentCommits||[]).map(c=>c.author).filter(Boolean))].slice(0,4);
      const site=(window.ARENA_SITES||[]).some(s=>s.id===p.id)?siteHealth(p.id):null;
      return '<article class="forge-row" data-lane="'+lane+'"><i class="forge-row-dot" style="--dot:'+esc(p.color||"#8d97aa")+'"></i><div class="forge-row-main"><h3>'+esc(p.name)+' <small>'+esc(p.category||"Creative project")+'</small></h3><p class="forge-row-title">'+esc(detail)+'</p><div class="forge-row-meta">'+(when?'<span>'+esc(when)+'</span>':"")+
        (authors.length?'<span class="forge-authors">'+authors.map(a=>'<b title="'+esc(a)+'">'+esc(initials(a))+'</b>').join("")+'</span>':"")+
        (p.codeActivity&&p.codeActivity.counted?'<span><b class="plus">+'+num(p.codeActivity.additions)+'</b> <b class="minus">−'+num(p.codeActivity.deletions)+'</b> in '+p.codeActivity.counted+' commits</span>':"")+
        (site?'<span>Website: '+esc(site)+'</span>':"")+'</div><div class="cmd-links">'+
        (app?'<a href="'+esc(app)+'" target="_blank" rel="noopener noreferrer">Open site ↗</a>':"")+
        (repo?'<a href="'+esc(repo)+'" target="_blank" rel="noopener noreferrer">Repository ↗</a>':"")+
        (vercel?'<a href="'+esc(vercel)+'" target="_blank" rel="noopener noreferrer">Vercel ↗</a>':"")+'</div></div><span class="forge-chip" data-lane="'+lane+'">'+esc(laneLabel[lane])+'</span></article>';
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
      const palette=new Map((window.ARENA_SITES||[]).map(site=>[site.id,site.color]));
      source.projects.forEach(p=>{p.color=palette.get(p.id)||"#b498ff"});
      if(typeof render==="function"&&typeof selected!=="undefined"&&selected==="forge")render();
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
  window.ArenaCommand={refreshViews:()=>{projectView();renderMissions()},refreshProjects:()=>loadProjects(true),project:id=>source.projects.find(p=>p.id===id)||null};
  projectView();renderMissions();loadProjects(false);
})();