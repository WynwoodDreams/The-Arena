// Compact command-deck behavior: quick navigation, horizontal rows and actual telemetry.
// Presentation only. Never simulates agent, website or analytics results.
(function(){
  "use strict";
  const $=selector=>document.querySelector(selector);
  const nav=$(".arena-rail");
  const markActive=(active)=>{
    if(!nav)return;
    nav.querySelectorAll("[data-rail]").forEach(el=>{
      if(el.dataset.rail===active)el.setAttribute("aria-current","page");
      else el.removeAttribute("aria-current");
    });
  };
  if(nav){
    nav.addEventListener("click",event=>{
      const control=event.target.closest("[data-agent-link]");
      if(!control)return;
      event.preventDefault();
      const agent=control.dataset.agentLink;
      if(typeof select==="function"){
        select(agent);
        if(!window.matchMedia("(max-width: 810px)").matches){
          $(".workgrid")?.scrollIntoView({behavior:"smooth",block:"start"});
        }
        markActive("operations");
      }
    });
    nav.querySelectorAll("a[data-rail]").forEach(a=>{
      a.addEventListener("click",()=>markActive(a.dataset.rail));
    });
  }
  function addCarouselButtons(id,label){
    const target=document.getElementById(id);
    if(!target||target.dataset.deckControls)return;
    const header=target.closest(".panel")?.querySelector(".panel-top");
    if(!header)return;
    target.dataset.deckControls="yes";
    const controls=document.createElement("div");
    controls.className="carousel-quick-controls";
    controls.setAttribute("aria-label",label+" row navigation");
    const caption=document.createElement("span");
    caption.textContent="SCROLL";
    const prev=document.createElement("button");
    const next=document.createElement("button");
    prev.type=next.type="button";
    prev.textContent="‹";next.textContent="›";
    prev.setAttribute("aria-label","Previous "+label);
    next.setAttribute("aria-label","Next "+label);
    const scroll=direction=>{
      const distance=Math.max(230,Math.round(target.clientWidth*.76));
      target.scrollBy({left:direction*distance,behavior:"smooth"});
    };
    prev.addEventListener("click",()=>scroll(-1));
    next.addEventListener("click",()=>scroll(1));
    controls.append(caption,prev,next);
    header.appendChild(controls);
  }
  addCarouselButtons("website-grid","websites");
  addCarouselButtons("cmd-project-list","projects");
  addCarouselButtons("cmd-mission-list","missions");

  function update(){
    const el=document.getElementById("arena-telemetry-values");
    if(!el)return;
    const sites=typeof monitorRun!=="undefined"?monitorRun.sites:[];
    const checked=sites.filter(s=>s.checkedAt);
    const online=checked.filter(s=>s.status==="Online").length;
    const siteLabel=checked.length?online+"/"+sites.length+" sites online":"sites unchecked";
    const todo=typeof pending==="function"?pending().length:0;
    const runs=typeof state!=="undefined"?state.runs.length:0;
    el.textContent=siteLabel+" · "+todo+" inbox · "+runs+" runs";
    const moduleNumber=document.getElementById("arena-module-total");
    if(moduleNumber&&typeof agents!=="undefined")moduleNumber.textContent=String(agents.length).padStart(2,"0");
  }
  // The agent panel opens as an immediately usable bottom sheet on phone screens.
  const phone=window.matchMedia("(max-width: 810px)");
  const sheet=$(".workgrid .inspector");
  const backdrop=document.createElement("div");
  backdrop.className="arena-sheet-backdrop";
  backdrop.setAttribute("aria-hidden","true");
  document.body.appendChild(backdrop);
  const closeButton=document.createElement("button");
  closeButton.type="button";
  closeButton.id="mobile-inspector-close";
  closeButton.className="mobile-inspector-close";
  closeButton.setAttribute("aria-label","Close agent inspector");
  closeButton.textContent="×";
  const grip=document.createElement("span");
  grip.className="mobile-inspector-grip";
  grip.setAttribute("aria-hidden","true");
  sheet?.querySelector(".panel-top")?.append(grip,closeButton);
  if(sheet){
    sheet.id="mobile-agent-inspector";
    sheet.setAttribute("aria-label","Agent inspector");
  }
  let originButton=null;
  let sheetOpen=false;
  const isPhone=()=>phone.matches;

  function syncMobileState(){
    if(!sheet)return;
    const active=isPhone()&&sheetOpen;
    if(!isPhone())sheetOpen=false;
    document.body.classList.toggle("mobile-sheet-open",active);
    sheet.inert=isPhone()&&!active;
    if(isPhone()){
      sheet.setAttribute("role","dialog");
      sheet.setAttribute("aria-modal",active?"true":"false");
      sheet.setAttribute("aria-hidden",active?"false":"true");
    }else{
      sheet.removeAttribute("role");
      sheet.removeAttribute("aria-modal");
      sheet.removeAttribute("aria-hidden");
    }
  }
  function closeSheet(restoreFocus=true){
    if(!sheetOpen&&!document.body.classList.contains("mobile-sheet-open"))return;
    sheetOpen=false;
    syncMobileState();
    if(restoreFocus&&isPhone()){
      const candidate=originButton?.isConnected?originButton:$("#agents .agent-card.selected");
      candidate?.focus({preventScroll:true});
    }
  }
  function openSheet(){
    if(!isPhone()||!sheet)return;
    sheetOpen=true;
    sheet.scrollTop=0;
    const details=sheet.querySelector("#details");
    if(details)details.scrollTop=0;
    syncMobileState();
    closeButton.focus({preventScroll:true});
  }
  closeButton.addEventListener("click",()=>closeSheet());
  backdrop.addEventListener("click",()=>closeSheet());
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&sheetOpen){event.preventDefault();closeSheet()}
    if(event.key!=="Tab"||!sheetOpen||!isPhone())return;
    const items=[...sheet.querySelectorAll("button:not([disabled]),input:not([disabled]),a[href],select:not([disabled]),textarea:not([disabled])")].filter(el=>el.getClientRects().length);
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
  document.addEventListener("click",event=>{
    if(!isPhone())return;
    const clicked=event.target.closest(".agent-card,.hotspot,.robot-target,[data-agent-link]");
    if(clicked)originButton=clicked;
  },true);
  phone.addEventListener("change",()=>{
    if(!isPhone())sheetOpen=false;
    syncMobileState();
    // Recreate full motion layers only when returning to a desktop-width view.
    if(typeof renderCards==="function")renderCards();
  });
  let initialTouch=null;
  sheet?.querySelector(".panel-top")?.addEventListener("touchstart",event=>{
    if(!isPhone()||event.target.closest("button"))return;
    initialTouch=event.touches[0]?.clientY??null;
  },{passive:true});
  sheet?.querySelector(".panel-top")?.addEventListener("touchend",event=>{
    if(initialTouch!==null&&event.changedTouches[0]&&event.changedTouches[0].clientY-initialTouch>75)closeSheet();
    initialTouch=null;
  },{passive:true});
  syncMobileState();

  // Native finger-friendly horizontal swipe carousel for the six stations.
  const agentList=document.getElementById("agents");
  const modules=$(".modules-heading");
  if(agentList&&modules){
    const controls=document.createElement("div");
    controls.className="agent-swipe-controls";
    controls.setAttribute("aria-label","Browse agent modules");
    const prev=document.createElement("button");
    const next=document.createElement("button");
    const position=document.createElement("span");
    prev.type=next.type="button";
    prev.textContent="‹";next.textContent="›";
    prev.setAttribute("aria-label","Previous agents");
    next.setAttribute("aria-label","Next agents");
    position.className="agent-position";
    position.setAttribute("aria-live","off");
    controls.append(prev,position,next);
    modules.appendChild(controls);
    const count=()=>agentList.querySelectorAll(".agent-card").length;
    const stride=()=>{
      const card=agentList.querySelector(".agent-card");
      return card?card.getBoundingClientRect().width+parseFloat(getComputedStyle(agentList).gap||"0"):178;
    };
    const current=()=>Math.min(Math.max(1,Math.round(agentList.scrollLeft/stride())+1),Math.max(1,count()));
    let tick=null;
    const refresh=()=>{
      if(tick)cancelAnimationFrame(tick);
      tick=requestAnimationFrame(()=>{
        const n=count(),index=current();
        position.textContent=index+" / "+n;
        prev.disabled=agentList.scrollLeft<5;
        next.disabled=agentList.scrollLeft+agentList.clientWidth>=agentList.scrollWidth-5;
      });
    };
    const move=direction=>agentList.scrollBy({left:direction*stride(),behavior:"smooth"});
    prev.addEventListener("click",()=>move(-1));
    next.addEventListener("click",()=>move(1));
    agentList.addEventListener("scroll",refresh,{passive:true});
    window.addEventListener("resize",refresh,{passive:true});
    const observer=new MutationObserver(refresh);
    observer.observe(agentList,{childList:true});
    refresh();
  }
  window.ArenaMobile={
    onAgentSelect(id){
      if(id==="chief"){closeSheet(false);return}
      openSheet();
    },
    close:closeSheet
  };
  window.ArenaExperience={update};
  update();
})();