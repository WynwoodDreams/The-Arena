// Operations room life: Miami through the window, robots that move, couriers while work runs.
// Everything sits on a stage that matches the cropped background image, so positions are
// image percentages at any screen size. No data is invented: motion follows stationMode().
(function(){
  "use strict";
  const scene=document.querySelector(".scene");
  const img=scene&&scene.querySelector(":scope>img");
  if(!scene||!img)return;
  const IMG_W=1672,IMG_H=941;

  // Head boxes in image pixels: left, top, right, bottom. Bottom stops at each monitor's top edge,
  // so only the robot moves and the desk in front of it stays still.
  const HEADS={
    scout:[442,222,558,318],pulse:[778,228,894,316],flow:[1114,225,1230,316],
    forge:[339,426,463,503],monitor:[770,411,894,506],chief:[1205,421,1329,501]
  };
  // Courier routes in image percent (feet position). Each ends in front of Chief's desk.
  const ROUTES={
    scout:[[38.5,45.5],[38,74],[74,76]],
    flow:[[62,45.5],[63.5,74],[74,76]],
    forge:[[25,74],[50,77],[74,76]],
    monitor:[[51,74],[62,76.5],[74,76]]
  };

  const stage=document.createElement("div");
  stage.className="scene-stage";
  stage.setAttribute("aria-hidden","true");
  img.insertAdjacentElement("afterend",stage);

  function fit(){
    const w=scene.clientWidth,h=scene.clientHeight,r=IMG_W/IMG_H;
    let sw=w,sh=w/r;
    if(sh<h){sh=h;sw=h*r}
    stage.style.width=sw+"px";stage.style.height=sh+"px";
    stage.style.left=(w-sw)/2+"px";stage.style.top=(h-sh)/2+"px";
  }
  fit();
  if(window.ResizeObserver)new ResizeObserver(fit).observe(scene);else window.addEventListener("resize",fit);

  // One blob URL for every sprite instead of copying the inline image string into each style.
  let spriteUrl=img.currentSrc||img.src;
  try{
    const m=/^data:([^;]+);base64,(.*)$/.exec(img.getAttribute("src")||"");
    if(m){
      const bin=atob(m[2]),bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      spriteUrl=URL.createObjectURL(new Blob([bytes],{type:m[1]}));
    }
  }catch{}

  const pct=(v,total)=>v/total*100;
  function sprite(el,box){
    const [l,t,r,b]=box;
    const L=pct(l,IMG_W),T=pct(t,IMG_H),W=pct(r-l,IMG_W),H=pct(b-t,IMG_H);
    el.style.left=L+"%";el.style.top=T+"%";el.style.width=W+"%";el.style.height=H+"%";
    el.style.backgroundImage="url("+spriteUrl+")";
    el.style.backgroundSize=(10000/W)+"% "+(10000/H)+"%";
    el.style.backgroundPosition=(L/(100-W)*100)+"% "+(T/(100-H)*100)+"%";
  }

  // Miami through the window: Brickell at night, Miami Tower's lit crown, the bay, a causeway and palms.
  const towers=[
    [-14,150,16],[0,118,13],[11,170,14],[24,96,10],[33,140,12],[44,182,16],[58,128,11],[68,160,13],[80,108,12],[92,150,14],[104,132,12]
  ];
  let windowsSvg="";
  towers.forEach(([x,top,w],i)=>{
    windowsSvg+='<rect x="'+x+'" y="'+top+'" width="'+w+'" height="'+(272-top)+'" fill="url(#mia-tower)"/><rect x="'+(x+w-1.2)+'" y="'+top+'" width="1.2" height="'+(272-top)+'" fill="#ff9ad8" opacity=".35"/>';
    for(let y=top+8;y<262;y+=9){
      for(let c=2;c<w-2;c+=4){
        if(((x*7+y*3+c*11+i*5)%9)<4)windowsSvg+='<rect class="mia-lit'+(((x+y+c)%4===0)?" mia-twinkle":"")+'" x="'+(x+c)+'" y="'+y+'" width="1.6" height="2.4"/>';
      }
    }
  });
  const svg='<svg class="miami-window" viewBox="0 0 '+IMG_W+' '+IMG_H+'" preserveAspectRatio="none" aria-hidden="true">'+
    '<defs>'+
      '<clipPath id="mia-glass"><path d="M21 88 L88 51 Q96 52 97 60 L101 92 L108 290 Q110 330 104 343 L80 351 L37 356 L28 250 Z"/><path d="M0 100 L9 97 L12 362 L0 366 Z"/></clipPath>'+
      '<linearGradient id="mia-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0c33"/><stop offset=".34" stop-color="#2b1b5e"/><stop offset=".5" stop-color="#8a3a9a"/><stop offset=".6" stop-color="#ff6f91"/><stop offset=".67" stop-color="#ffb56b"/><stop offset="1" stop-color="#ffb56b"/></linearGradient>'+
      '<linearGradient id="mia-tower" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#323a7c"/><stop offset="1" stop-color="#121842"/></linearGradient>'+
      '<linearGradient id="mia-bay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3f86"/><stop offset=".35" stop-color="#2a2f70"/><stop offset="1" stop-color="#0b1232"/></linearGradient>'+
      '<linearGradient id="mia-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".14"/><stop offset=".35" stop-color="#ffffff" stop-opacity="0"/><stop offset=".7" stop-color="#9ff" stop-opacity=".05"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>'+
    '</defs>'+
    '<g clip-path="url(#mia-glass)">'+
      '<g transform="skewY(-12) translate(0 22)">'+
        '<rect x="-30" y="20" width="170" height="380" fill="url(#mia-sky)"/>'+
        '<circle cx="82" cy="92" r="6" fill="#ffe9c9" opacity=".85"/>'+
        '<g class="mia-stars"><circle cx="30" cy="70" r=".9"/><circle cx="52" cy="58" r=".7"/><circle cx="70" cy="76" r=".8"/><circle cx="18" cy="104" r=".7"/><circle cx="96" cy="110" r=".8"/></g>'+
        windowsSvg+
        // Miami Tower: three stepped, lit crowns that cycle colors like the real building.
        '<rect x="46" y="150" width="20" height="122" fill="#121838"/>'+
        '<path class="mia-crown mia-crown-1" d="M44 152 Q56 140 68 152 Z"/>'+
        '<path class="mia-crown mia-crown-2" d="M47 140 Q56 129 65 140 Z"/>'+
        '<path class="mia-crown mia-crown-3" d="M50 129 Q56 120 62 129 Z"/>'+
        '<rect x="55.4" y="108" width="1.2" height="14" fill="#ffd2f0"/>'+
        // Bay, reflections, causeway with moving car lights.
        '<rect x="-30" y="272" width="170" height="120" fill="url(#mia-bay)"/>'+
        '<g class="mia-reflect"><rect x="54" y="276" width="4" height="40" fill="#ff7ad9" opacity=".35"/><rect x="20" y="278" width="3" height="30" fill="#7af0ff" opacity=".3"/><rect x="84" y="277" width="3" height="34" fill="#ffd27a" opacity=".3"/></g>'+
        '<path d="M-30 300 Q50 288 140 296" stroke="#2c335e" stroke-width="3" fill="none"/>'+
        '<g class="mia-cars"><circle class="mia-car" r="1.4" fill="#fff4c4"/><circle class="mia-car mia-car-2" r="1.4" fill="#ff5a6b"/><circle class="mia-car mia-car-3" r="1.4" fill="#fff4c4"/></g>'+
        // Palms in the foreground.
        '<g class="mia-palms" fill="#0a0d1e" stroke="#0a0d1e">'+
          '<path d="M18 360 Q20 320 30 286" stroke-width="3.2" fill="none"/>'+
          '<path d="M30 286 Q14 280 4 292 Q18 282 30 288 Q24 270 12 266 Q28 270 31 286 Q40 268 54 270 Q38 276 32 288 Q48 282 58 296 Q42 286 31 289Z"/>'+
          '<path d="M96 360 Q94 330 86 304" stroke-width="2.6" fill="none"/>'+
          '<path d="M86 304 Q74 298 66 308 Q78 300 86 306 Q80 292 70 288 Q84 292 87 304 Q94 290 106 292 Q94 296 88 306 Q100 302 108 312 Q96 304 87 307Z"/>'+
        '</g>'+
      '</g>'+
      '<rect x="0" y="40" width="130" height="330" fill="url(#mia-sheen)"/>'+
    '</g>'+
  '</svg>';
  stage.insertAdjacentHTML("beforeend",svg);

  const heads={},couriers={};
  Object.entries(HEADS).forEach(([id,box],i)=>{
    const wrap=document.createElement("div");
    wrap.className="robot-life";wrap.dataset.agent=id;
    wrap.style.setProperty("--delay",(-i*1.3)+"s");
    const plate=document.createElement("div");plate.className="robot-plate";sprite(plate,box);
    const head=document.createElement("div");head.className="robot-head";sprite(head,box);
    const [l,t,r,b]=box;
    const glow=document.createElement("div");glow.className="robot-screen";
    glow.style.left=pct(l-24,IMG_W)+"%";glow.style.top=pct(b-6,IMG_H)+"%";glow.style.width=pct(r-l+48,IMG_W)+"%";glow.style.height=pct(40,IMG_H)+"%";
    const bits=document.createElement("div");bits.className="robot-bits";
    bits.style.left=pct(l,IMG_W)+"%";bits.style.top=pct(t-10,IMG_H)+"%";bits.style.width=pct(r-l,IMG_W)+"%";bits.style.height=pct(b-t,IMG_H)+"%";
    bits.innerHTML="<i></i><i></i><i></i><i></i>";
    const zzz=document.createElement("div");zzz.className="robot-zzz";
    zzz.style.left=pct(r-10,IMG_W)+"%";zzz.style.top=pct(t+4,IMG_H)+"%";zzz.innerHTML="<i>z</i><i>z</i><i>z</i>";
    wrap.append(plate,glow,head,bits,zzz);
    stage.appendChild(wrap);
    heads[id]=wrap;
    if(ROUTES[id]){
      const c=document.createElement("div");c.className="courier courier-"+id;
      const bot=document.createElement("div");bot.className="courier-bot";
      const face=document.createElement("div");face.className="courier-face";
      // The courier wears its station's own face, cropped from the same image.
      const fx=l+(r-l)*.12,fy=t+(b-t)*.15,fr=r-(r-l)*.12,fb=b-(b-t)*.1;
      const W=pct(fr-fx,IMG_W),H=pct(fb-fy,IMG_H),L=pct(fx,IMG_W),T=pct(fy,IMG_H);
      face.style.backgroundImage="url("+spriteUrl+")";
      face.style.backgroundSize=(10000/W)+"% "+(10000/H)+"%";
      face.style.backgroundPosition=(L/(100-W)*100)+"% "+(T/(100-H)*100)+"%";
      bot.append(face);
      const packet=document.createElement("span");packet.className="courier-packet";
      bot.append(packet);
      c.append(bot);
      const [p0,p1,p2]=ROUTES[id];
      c.style.setProperty("--x0",p0[0]+"%");c.style.setProperty("--y0",p0[1]+"%");
      c.style.setProperty("--x1",p1[0]+"%");c.style.setProperty("--y1",p1[1]+"%");
      c.style.setProperty("--x2",p2[0]+"%");c.style.setProperty("--y2",p2[1]+"%");
      stage.appendChild(c);
      couriers[id]=c;
    }
  });

  function sync(){
    if(typeof agents==="undefined"||typeof stationMode!=="function")return;
    agents.forEach(a=>{
      const mode=stationMode(a);
      const h=heads[a.id];
      if(h)h.style.setProperty("--agent",a.color);
      if(couriers[a.id])couriers[a.id].style.setProperty("--agent",a.color);
      if(h){h.classList.toggle("working",mode==="working");h.classList.toggle("offline",mode==="offline");h.classList.toggle("online",mode==="online")}
      const c=couriers[a.id];
      if(c)c.classList.toggle("active",mode==="working");
    });
    const chief=heads.chief;
    if(chief)chief.classList.toggle("receiving",Object.values(couriers).some(c=>c.classList.contains("active")));
  }
  window.ArenaRoom={sync,fit};
  sync();
})();
