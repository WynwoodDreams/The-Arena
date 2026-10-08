(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
scoutRun.lastNode=state.scout?.lastNode;scoutRun.outputs=state.scout?.outputs;Object.keys(flowRuns).forEach(id=>{flowRuns[id].lastNode=state.flows[id]?.lastNode;flowRuns[id].outputs=state.flows[id]?.outputs});
const key='arena-scout-saves-v1';let saves=[];try{saves=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saves))saves=[]}catch{}
function safeLink(raw){try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function mount(host){if(!host||host.querySelector('.scout-saves'))return;
 const section=document.createElement('section');section.className='scout-saves scout-library';
 section.innerHTML='<div class="detail-label">SAVE TO SCOUT</div><form><label>Link or idea<input name="content" required maxlength="2000" placeholder="Paste a link or write an idea"></label><label>Tags<input name="tags" maxlength="200" placeholder="AI, music, next build"></label><button class="inspect-button" type="submit">Save to Scout</button><p class="inspect-note" role="status">Saved on this device. Use Export for a backup.</p></form><input type="search" placeholder="Find saved links and ideas…" aria-label="Search saved Scout items"><button class="inspect-button" type="button" data-export>Export saved items</button><div data-items class="scout-research-list"></div>';
 host.append(section);
 const list=section.querySelector('[data-items]'),search=section.querySelector('[type=search]');
 function draw(){const q=search.value.toLowerCase();list.innerHTML=saves.filter(s=>(s.content+' '+s.tags).toLowerCase().includes(q)).map(s=>'<div class="scout-research-item">'+(safeLink(s.content)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safeLink(s.content))+'">'+esc(s.content)+'</a>':esc(s.content))+'<p>'+esc(s.tags)+' · '+esc(new Date(s.createdAt).toLocaleDateString())+'</p><button type="button" data-remove="'+esc(s.id)+'">Remove</button></div>').join('')||'<p class="inspect-note">No saved items yet.</p>'}
 section.querySelector('form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget;const item={id:crypto.randomUUID(),content:f.elements.content.value.trim(),tags:f.elements.tags.value.trim(),createdAt:new Date().toISOString()};if(!item.content)return;const next=[item,...saves];try{localStorage.setItem(key,JSON.stringify(next));saves=next;f.reset();draw();f.querySelector('[role=status]').textContent='Saved to Scout on this device.'}catch{f.querySelector('[role=status]').textContent='Could not save: browser storage is full or unavailable.'}};
 search.oninput=draw;list.onclick=e=>{const b=e.target.closest('[data-remove]');if(!b)return;const next=saves.filter(s=>s.id!==b.dataset.remove);try{localStorage.setItem(key,JSON.stringify(next));saves=next;draw()}catch{toast('Unable to save removal.')}};
 section.querySelector('[data-export]').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(saves,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='scout-saved-items.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};draw();
}
function readable(raw){try{const items=JSON.parse(raw);return items.map(item=>{if(typeof item==='string')return item;const text=item.output||item.text||item.summary||item.content||item.message?.content||item.message;if(typeof text==='string')return text;return JSON.stringify(item,null,2)}).join('\n\n')}catch{return raw}}
function outputMount(host,run,label){
 if(!host||!run)return;
 const id=label||'Scout';let box=Array.from(host.querySelectorAll('.mission-result')).find(b=>b.dataset.resultId===id);
 if(!box){box=document.createElement('section');box.className='mission-result scout-library';box.dataset.resultId=id;host.prepend(box)}
 const message=run.trackingMessage||(!run.requestId&&run.status==='Started'?'This older run has no tracking ID. Start a new run to track its result.':run.message||'No run recorded yet.');
 const choices=Array.isArray(run.outputs)?run.outputs:[];
 const choose=choices.length?'<label>Workflow output<select data-output-node>'+choices.map(o=>'<option'+(o.node===run.lastNode?' selected':'')+'>'+esc(o.node)+'</option>').join('')+'</select></label>':'';
 const markup='<div class="detail-label">'+esc(id)+' RESULTS · '+esc(run.status)+'</div><p class="inspect-note" role="status">'+esc(message)+'</p><button type="button" class="inspect-button" data-check-results>Check results</button>'+choose+(run.output?'<details open><summary>Execution output'+(run.lastNode?' · '+esc(run.lastNode):'')+'</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto">'+esc(readable(run.output))+'</pre></details>':'');
 if(box.dataset.markup!==markup){box.innerHTML=markup;box.dataset.markup=markup;box.querySelector('[data-check-results]').onclick=()=>check(true,run);const picker=box.querySelector('[data-output-node]');if(picker)picker.onchange=()=>{const item=choices.find(o=>o.node===picker.value);if(item){run.output=item.output;run.lastNode=item.node;saveState();enhance()}}}
}
function enhance(){const details=document.getElementById('details');if(selected==='scout'){mount(details);outputMount(details,scoutRun,'Scout')}const focus=document.getElementById('agent-focus-scroll');if(focus?.querySelector('#agent-focus-reports')){mount(focus);outputMount(focus,scoutRun,'Scout')}if(selected==='flow')flowWorkflows.forEach(w=>outputMount(details,flowRuns[w.id],w.name));if(focus?.querySelector('[data-focus-action^="flow:"]'))flowWorkflows.forEach(w=>outputMount(focus,flowRuns[w.id],w.name))}
// Explicit inbox navigation closes the modal before opening the requested agent.
document.addEventListener('click',event=>{const button=event.target.closest('[data-inspect]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const id=button.dataset.inspect;closeInbox();window.ArenaMobile?.close(false);select(id);window.AgentFocus?.open(id)},true);
let busy=false;
async function check(force=false,target=null){
 if(busy||document.hidden)return;busy=true;
 try{for(const [agent,run] of [['scout',scoutRun],...Object.entries(flowRuns)]){
  if(target&&run!==target)continue;
  if(!run.requestId){if(force)run.trackingMessage='Start a new run to retrieve its results.';continue}
  if(!force&&!['Started','Running'].includes(run.status))continue;
  const requestId=run.requestId;run.trackingMessage='Checking n8n results…';enhance();
  try{
   const body={requestId};let response;
   if(force)response=await apiFetch('/api/missions/status',body,18000);
   else{const headers={'Content-Type':'application/json'};try{const access=localStorage.getItem(KEY_STORE);if(access)headers['X-Arena-Key']=access}catch{}response=await fetch('/api/missions/status',{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(18000)})}
   const data=await response.json();if(run.requestId!==requestId)continue;
   if(!response.ok||!data.configured){run.trackingMessage=data.message||'Execution tracking unavailable.';continue}
   run.trackingMessage='Execution '+(data.executionId||'pending');
   if(['Completed','Failed'].includes(data.status)){
    const changed=run.status!==data.status;run.status=data.status;run.message=data.message;run.output=data.output;run.outputs=data.outputs;run.lastNode=data.lastNode;
    if(changed)recordRun(agent==='scout'?'scout':'flow',run.status,run.message);
    if(agent==='scout')agents.find(a=>a.id==='scout').progress=run.status==='Completed'?100:0;
    saveState();renderAll();window.ArenaCommand?.refreshViews();window.AgentFocus?.refresh();
   }else run.trackingMessage=data.message;
  }catch{run.trackingMessage='Unable to check completion. Try Check results again.'}
 }}finally{busy=false;enhance()}
}
const observer=new MutationObserver(enhance);observer.observe(document.getElementById('details'),{childList:true});observer.observe(document.getElementById('agent-focus-scroll'),{childList:true});enhance();setInterval(check,10000);check();
})();
