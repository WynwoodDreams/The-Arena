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
        $(".workgrid")?.scrollIntoView({behavior:"smooth",block:"start"});
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
  window.ArenaExperience={update};
  update();
})();