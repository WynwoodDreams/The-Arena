// Agent dossier: uses existing Arena state, robots, links and connected actions.
// One click selects the inspector; a second click (double click) expands the dossier.
(function(){
 "use strict";
 const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const fmt=v=>Number.isFinite(v)?v.toLocaleString("en-US"):"—";
 const safeUrl=v=>{try{const u=new URL(v);return u.protocol==="https:"?u.href:null}catch{return null}};
 const dialog=document.createElement("dialog");
 dialog.className="agent-focus-dialog";
 dialog.id="agent-focus-dialog";
 dialog.setAttribute("aria-labelledby","agent-focus-title");
 dialog.innerHTML='<div class="agent-focus-top"><span class="agent-focus-kicker">◈ THE ARENA / AGENT DOSSIER</span><button class="agent-focus-close" type="button" aria-label="Close agent card">×</button></div><div class="agent-focus-scroll" id="agent-focus-scroll"></div>';
 document.body.appendChild(dialog);
 dialog.querySelector(".agent-focus-close").onclick=()=>dialog.close();
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
 let current=null;
 let filterQuery="";
 const section=(title,body,wide=false)=>'<section class="agent-focus-section'+(wide?' wide':'')+'"><h3>'+escape(title)+'</h3>'+body+'</section>';
 const stats=items=>'<div class="agent-focus-meta">'+items.map(item=>'<div><small>'+escape(item[0])+'</small><strong>'+escape(item[1])+'</strong></div>').join("")+'</div>';
 const info=(title,detail,meta)=>'<div class="agent-focus-item"><strong>'+escape(title)+'</strong>'+(meta?'<small> · '+escape(meta)+'</small>':'')+(detail?'<p>'+escape(detail)+'</p>':'')+'</div>';
 const empty=message=>'<p class="empty-agent-data">'+escape(message)+'</p>';
 const actions=items=>'<div class="agent-focus-actions">'+items.join("")+'</div>';
 const button=(text,act,disabled=false)=>'<button type="button" data-focus-action="'+escape(act)+'"'+(disabled?' disabled':'')+'>'+escape(text)+'</button>';
 const link=(text,url)=>{
   const safe=safeUrl(url);
   return safe?'<a href="'+escape(safe)+'" target="_blank" rel="noopener noreferrer">'+escape(text)+' ↗</a>':'';
 };
 const runRecords=id=>state.runs.filter(r=>r.agent===id).slice(0,5);
 const lastRunSection=id=>{
   const records=runRecords(id);
   return section("Recent execution history",records.length?'<div class="agent-focus-list">'+records.map(r=>info(r.status||"Recorded",r.message||"",r.createdAt?time(r.createdAt):"")).join("")+'</div>':empty("No execution requests recorded in this browser."));
 };
 function details(a){
   const id=a.id;
   if(id==="chief"){
     const waiting=pending().length;
     const latest=state.inbox.slice(0,8);
     return [
       section("Decision overview",stats([["PENDING REVIEWS",fmt(waiting)],["RECORDED DECISIONS",fmt(state.inbox.filter(r=>r.status!=="pending").length)]])),
       section("Chief controls",'<p>Human approvals, issues, and your saved decision log. Records are kept in this browser; no external action is taken.</p>'+actions([button("Open Chief inbox","inbox")])),
       section("Latest decision items",latest.length?'<div class="agent-focus-list">'+latest.map(item=>info(item.title,item.detail,item.status||"pending")).join("")+'</div>':empty("No decisions recorded yet."),true)
     ].join("");
   }
   if(id==="scout"){
     const reports=scoutResearchTitles.filter(t=>t.toLocaleLowerCase().includes(filterQuery.toLocaleLowerCase()));
     return [
       section("Scout overview",stats([["N8N REQUEST",scoutRun.status],["RESEARCH TITLES",fmt(scoutResearchTitles.length)]])+'<p>'+escape(scoutRun.message||"No Scout request recorded yet.")+'</p>'),
       section("Scout controls",'<p>AI Jobs Monitor searches via your connected n8n workflow. “Started” means accepted, not completed.</p>'+actions([button(scoutRun.status==="Running"?"Running…":"Run Scout","scout",scoutRun.status==="Running")])),
       section("NotebookLM / My Reports",'<input class="agent-focus-search" id="agent-focus-filter" placeholder="Search your research titles…" aria-label="Search Scout research titles" type="search" value="'+escape(filterQuery)+'"><div class="agent-focus-list" id="agent-focus-reports">'+(reports.length?reports.map(t=>info(t,"")).join(""):empty("No matching reports."))+'</div>',true),
       lastRunSection("scout")
     ].join("");
   }
   if(id==="forge"){
     return [
       section("Project library",stats([["LINKED PROJECTS",fmt(forgeProjects.length)],["BUILD REPORTING","Not connected"]])+'<p>Repository and website shortcuts use your existing project registry. Build progress is not inferred.</p>'),
       section("Actions",actions([button("Open work columns","columns")])),
       section("Linked creative projects",forgeProjects.length?'<div class="agent-focus-list">'+forgeProjects.map(p=>'<div class="agent-focus-item"><strong>'+escape(p.name)+'</strong><p>'+escape(p.category||"Linked project")+'</p>'+actions([link("Launch site",p.url),...(p.repository?[link("GitHub",p.repository)]:[]).filter(Boolean)])+'</div>').join("")+'</div>':empty("No linked projects."),true),
       lastRunSection("forge")
     ].join("");
   }
   if(id==="flow"){
     const rows=flowWorkflows.map(w=>{
       const r=flowRuns[w.id]||{status:"Ready",message:""};
       return '<div class="agent-focus-item"><strong>'+escape(w.name)+'</strong><small> · '+escape(r.status)+'</small><p>'+escape(r.message||w.detail||"")+'</p>'+actions([button(r.status==="Running"?"Starting…":"Run workflow","flow:"+w.id,r.status==="Running")])+'</div>';
     });
     const delegated=workflowConfig.filter(w=>w.station).map(w=>info(w.name,w.detail,"Via "+w.station));
     return [
       section("Automation overview",stats([["N8N WORKFLOWS",fmt(flowWorkflows.length)],["CURRENT STATUS",flowSummary()]])+'<p>Webhook acceptance is not proof of completed execution.</p>'),
       section("Connected automations",'<div class="agent-focus-list">'+(rows.join("")||empty("No connected workflows."))+'</div>'),
       ...(delegated.length?[section("Delegated workflows",'<div class="agent-focus-list">'+delegated.join("")+'</div>',true)]:[]),
       lastRunSection("flow")
     ].join("");
   }
   if(id==="pulse"){
     const items=state.inbox.filter(i=>i.agent==="pulse").slice(0,6);
     return [
       section("Connection",stats([["SOCIAL INTEGRATION","Not connected"],["SAVED REVIEWS",fmt(items.length)]])+'<p>Pulse is reserved for future publishing and monitoring connections. No live social statistics are available.</p>'),
       section("Review status",items.length?'<div class="agent-focus-list">'+items.map(i=>info(i.title,i.detail,i.status)).join("")+'</div>':empty("No Pulse reviews recorded yet.")),
       section("Work tracking",actions([button("View work columns","columns")]),true)
     ].join("");
   }
   if(id==="monitor"){
     const checked=monitorRun.sites.filter(s=>s.checkedAt);
     const online=checked.filter(s=>s.status==="Online").length;
     const failures=checked.filter(s=>s.status!=="Online").length;
     return [
       section("Website monitor",stats([["ONLINE",checked.length?online+"/"+monitorRun.sites.length:"Not checked"],["ISSUES",checked.length?fmt(failures):"Not checked"]])+'<p>'+escape(monitorRun.message||"Checks run when the Arena opens or when you request them.")+'</p>'),
       section("Monitor controls",actions([button(monitorRun.status==="Running"?"Checking…":"Check all websites","monitor",monitorRun.status==="Running")])),
       section("Connected websites",'<div class="agent-focus-list">'+monitorRun.sites.map(s=>{
         const stamp=s.checkedAt?time(s.checkedAt):"Not checked";
         return '<div class="agent-focus-item"><strong>'+escape(s.name)+'</strong><small> · '+escape(s.status)+' · '+escape(stamp)+'</small><p>'+escape(s.httpStatus?"HTTP "+s.httpStatus:"HTTP not checked")+(s.responseTimeMs!=null?" · "+escape(s.responseTimeMs)+"ms":"")+'</p>'+actions([link("Open website",s.url)])+'</div>';
       }).join("")+'</div>',true),
       lastRunSection("monitor")
     ].join("");
   }
   return section("Connection",empty("This station is not connected."));
 }
 function render(){
   if(!current||!dialog.open)return;
   const a=agents.find(x=>x.id===current);
   if(!a)return;
   dialog.style.setProperty("--focus-accent",a.color);
   const mode=stationMode(a);
   let currentStatus=cardStatus(a);
   const idx=agents.findIndex(x=>x.id===a.id)+1;
   const root=dialog.querySelector("#agent-focus-scroll");
   const oldY=root.scrollTop;
   root.innerHTML='<div class="agent-focus-hero"><div class="agent-focus-art"><div class="agent-focus-portrait" id="agent-focus-portrait"></div><div class="agent-focus-portrait-tag">STATION '+String(idx).padStart(2,"0")+' / 06</div></div>'+
     '<div class="agent-focus-profile"><div class="agent-focus-id">AGENT / '+String(idx).padStart(2,"0")+'</div>'+
     '<div class="agent-focus-heading"><span class="agent-focus-symbol">'+escape(a.icon)+'</span><h2 id="agent-focus-title">'+escape(a.name)+'</h2></div>'+
     '<div class="agent-focus-role">'+escape(a.role)+'</div><p class="agent-focus-description">'+escape(a.task)+'</p>'+
     '<span class="agent-focus-pill"><span class="agent-focus-indicator" data-mode="'+escape(mode)+'"></span>'+escape(currentStatus)+'</span></div></div>'+
     '<div class="agent-focus-body">'+details(a)+'</div>';
   const art=root.querySelector("#agent-focus-portrait");
   const scene=document.querySelector(".scene>img");
   if(art&&scene?.src){
     art.style.backgroundImage='url("'+scene.src+'")';
     art.style.backgroundPosition=a.x+"% "+a.y+"%";
   }
   root.scrollTop=oldY;
 }
 function open(id){
   const a=agents.find(x=>x.id===id);
   if(!a)return;
   current=id;
   filterQuery="";
   if(!dialog.open)dialog.showModal();
   render();
   dialog.querySelector(".agent-focus-close")?.focus({preventScroll:true});
 }
 dialog.addEventListener("input",event=>{
   if(event.target.id!=="agent-focus-filter")return;
   filterQuery=event.target.value;
   const container=dialog.querySelector("#agent-focus-reports");
   if(!container)return;
   const matches=scoutResearchTitles.filter(t=>t.toLocaleLowerCase().includes(filterQuery.toLocaleLowerCase()));
   container.innerHTML=matches.length?matches.map(t=>info(t,"")).join(""):empty("No matching reports.");
 });
 dialog.addEventListener("click",async event=>{
   const control=event.target.closest("[data-focus-action]");
   if(!control||control.disabled)return;
   const action=control.dataset.focusAction;
   if(action==="inbox"){dialog.close();openInbox();return}
   if(action==="columns"){
     const id=current;
     selected=id;
     columnsOpen=true;
     renderCards();renderDetails();renderColumns();
     dialog.close();
     document.querySelector("#agent-columns")?.scrollIntoView({behavior:"smooth",block:"start"});
     return;
   }
   const operation=action==="scout"?runScout():action==="monitor"?runMonitor():action.startsWith("flow:")?runFlow(action.slice(5)):null;
   render();
   if(operation&&typeof operation.then==="function"){
     try{await operation}catch{}
     render();
   }
 });
 window.AgentFocus={open,refresh:render,close:()=>dialog.close()};
})();
