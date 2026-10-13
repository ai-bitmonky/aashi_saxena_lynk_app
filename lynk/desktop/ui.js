/* ============ LYNK desktop UI layer (defined before the engine) ============ */
window.UI={go:uiGo,render:uiRender,sheet:uiSheet,closeSheet:uiCloseSheet,toast:uiToast,fields:uiFields,setFields:uiSetFields,remember:uiRemember};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const ic=(k,c='')=>`<svg class="i ${c}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const money=n=>n?`<sup class="r">₹</sup>${n.toLocaleString('en-IN')}`:'Free';
const tileH=(m,c='')=>`<span class="tile mt-${m} ${c}">${ic(m)}</span>`;
const modeKey=n=>Object.keys(M).find(k=>M[k].n===n)||'walk';
const UIS={pv:null,prev:null,mk:null,live:false,lastFocus:null,ret:null,mapKey:null};

/* ---------- small viz ---------- */
function ringH(v,big){const s=big?52:44,r=big?22:18,c=2*Math.PI*r;
  return `<span class="ring" role="img" aria-label="${v} out of 100"><svg viewBox="0 0 ${s} ${s}" aria-hidden="true"><circle class="tr" cx="${s/2}" cy="${s/2}" r="${r}"/><circle class="ar" cx="${s/2}" cy="${s/2}" r="${r}" stroke="${col(v)}" stroke-dasharray="${c.toFixed(2)}" style="--c:${c.toFixed(2)};stroke-dashoffset:${(c*(1-v/100)).toFixed(2)}"/></svg><b>${v}</b></span>`;}
const pillsH=v=>{const n=Math.round(v/20);return `<span class="pills" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;};
function chainH(legs){return legs.map((l,i)=>`${i?ic('chev','s16 ch'):''}${tileH(l[0])}<span class="mn">${l[2]}</span>`).join('');}
function ribbonH(legs){const t=sum(legs,l=>l[2]);return `<div class="rib" aria-hidden="true">${legs.map(l=>`<i class="mb-${l[0]}" style="flex:${Math.max(l[2],t*.05)}"></i>`).join('')}</div>`;}
function bigRibbon(legs){const t=sum(legs,l=>l[2]);return `<div class="brib" aria-hidden="true">${legs.map(l=>`<span class="mt-${l[0]}" style="flex:${Math.max(l[2],t*.11)}">${ic(l[0],'s16')}<b>${l[2]}</b></span>`).join('')}</div>`;}
function sparkH(r){const d=sparkData(r),w=96,h=28,lo=Math.min(...d,80)-6,hi=Math.max(...d,80)+6,y=v=>h-((v-lo)/(hi-lo))*h,x=i=>i*(w/6);
  const main=(r.legs.find(l=>l[0]!=='walk')||['walk'])[0];
  const p=d.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return `<div class="spark"><svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="0" x2="${w}" y1="${y(80)}" y2="${y(80)}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="2 3"/><path class="ln" d="${p}" stroke="var(--${main}-c)"/><circle cx="${x(6)}" cy="${y(d[6])}" r="2.5" fill="var(--${main}-c)" stroke="var(--surface)" stroke-width="1.5"/></svg><span>On time over the last 7 days. Dashed line is the 80% target.</span><b>${d[6]}%</b></div>`;}
function roll(el,to,from){ if(!el)return; if(RM.matches||from===to){el.textContent=to.toLocaleString('en-IN');return;}
  const t0=performance.now(),d=450; const f=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*e).toLocaleString('en-IN');if(k<1)requestAnimationFrame(f);};requestAnimationFrame(f);}

/* ---------- fields ---------- */
function uiFields(){return {from:$('#from').value.trim(),to:$('#to').value.trim()};}
function uiSetFields(f,t){$('#from').value=f;$('#to').value=t;$('#homeMsg').innerHTML='';}
function uiRemember(){return $('#remember').checked;}

/* ---------- toast ---------- */
function uiToast(t){const e=$('#toast');e.innerHTML=ic('info')+`<span>${t}</span>`;e.classList.add('on');clearTimeout(uiToast.t);uiToast.t=setTimeout(()=>e.classList.remove('on'),3000);}

/* ---------- navigation ---------- */
function navCur(v){$('#navHome').toggleAttribute('aria-current',v!=='recent');$('#navRecent').toggleAttribute('aria-current',v==='recent');if(v!=='recent')$('#navHome').setAttribute('aria-current','page');else $('#navRecent').setAttribute('aria-current','page');}
function uiGo(v){
  if(v==='home'){ if(UIS.live){UIS.live=false;mapLiveStop();} closePanel(); navCur('home'); renderHome(); renderSel(); mapSync(); setTimeout(()=>$('#from').focus({preventScroll:true}),0); return; }
  if(v==='results'){ closePanel(); navCur('home'); $('#bScroll').scrollTo({top:0,behavior:RM.matches?'auto':'smooth'}); return; }
  if(v==='live')UIS.live=true;
  if(v==='recent'){ if(UIS.live){UIS.live=false;mapLiveStop();} }
  if(UIS.pv!==v)uiRender(v);
  navCur(v); renderSel();
}
function uiRender(v,o={}){
  if(v==='home'){renderHome(o); if(S.trip)renderList(true); return;}
  if(v==='results'){renderResults(o);return;}
  if(v==='details')return pDetails();
  if(v==='live')return pLive();
  if(v==='end')return pEnd();
  if(v==='recent')return pRecent();
}

/* ---------- home (planner) ---------- */
function renderHome(o={}){
  const sug=Object.entries(TRIPS).map(([k,t])=>`<button class="chip sug" data-a="sug" data-v="${k}">${ic('route','s16')}<span><b>${t.from}</b> → ${t.to}</span></button>`).join('');
  $('#sugs').innerHTML=sug; $('#emptySugs').innerHTML=sug;
  $('#modes').innerHTML=['metro','bus','auto','cab','walk'].map(m=>{const off=S.avoid.has(m);
    return `<button class="chip mode ${off?'off':''}" data-a="mode" data-v="${m}" aria-pressed="${!off}" aria-label="${m==='walk'?'Long walks':M[m].n}${off?', skipped':''}"><span class="gl mt-${m}">${ic(m)}</span><span class="t">${m==='walk'?'Long walks':M[m].n}</span></button>`;}).join('');
  if(o.nomatch){clearTimeout(uiToast.t);$('#toast').classList.remove('on');}
  if(o.nomatch)$('#homeMsg').innerHTML=`<div class="msg" role="alert">${ic('info')}<span>This pilot only covers two corridors so far. Tap one of the suggestions above.</span></div>`;
  if(!S.trip)renderHomeRecent();
}
function tripRow(h,i,extra=''){return `<button class="trip" data-a="reuse" data-v="${i}"><span class="mini">${h.modes.split(' · ').map(n=>tileH(modeKey(n))).join('')}</span><span class="tx"><b>${h.from} → ${h.to}</b><span>${h.when}, ${h.mins} min, ${rupee(h.cost)}${extra?', '+h.modes:''}</span></span>${ic('chev','go')}</button>`;}
function renderHomeRecent(){
  $('#res').innerHTML=`<div class="lbl" style="margin-top:8px">Recent trips <button class="link" data-a="go" data-v="recent">See all</button></div>`+(HIST.length?HIST.slice(0,2).map((h,i)=>tripRow(h,i)).join(''):`<p class="sub">No trips yet. Finish a journey and it shows up here.</p>`);
}

/* ---------- results ---------- */
function cardH(o,i,dim){
  const {r,x}=o, best=i===0&&!dim, sel=!dim&&S.route&&S.route.id===r.id;
  return `<article class="card${best?' best':''}${dim?' dim':''}${sel?' sel':''}${S.hover===r.id&&!dim?' hl':''}" data-id="${r.id}${dim?'-h':''}"${dim?'':` data-card="${r.id}"`} aria-label="${r.name}, ${x.mins} minutes, ${rupee(x.cost)}${best?', '+BEST_LABEL[S.tab]:''}">
   ${best?`<span class="flag">${ic('flag','s16')}${BEST_LABEL[S.tab]}</span>`:''}
   <div class="c-top"><div><div class="c-time"><span class="v roll" data-k="mins">${x.mins}</span><small>min</small></div><div class="c-name">${r.name}</div></div>
   <div><div class="c-fare">${x.cost?`<span class="v"><sup class="r">₹</sup><span class="roll" data-k="cost">${x.cost}</span></span>`:'<span class="v">Free</span>'}</div><div class="c-arr">Arrive ${fmtT(x.mins)}</div></div></div>
   ${ribbonH(r.legs)}
   <div class="chain">${chainH(r.legs)}</div>
   <div class="scores">
    <div class="sc">${ringH(x.R)}<span class="sc-l"><b>Reliability</b>out of 100</span></div>
    <div class="sc cv"><span class="sc-l"><b>Convenience <span class="num cv-n roll" data-k="C">${x.C}</span></b>${pillsH(x.C)}</span></div>
    <div class="traffic"><b>${x.traffic}</b>traffic impact</div>
   </div>
   ${dim?`<p class="hid">${ic('info','s16')}Hidden because you skipped ${hidden(r,x)}.</p>`:`<div class="c-acts"><button class="btn ink md" data-a="pick" data-v="${r.id}">Choose route</button><button class="link why-l" data-a="why" data-v="${r.id}">Why this score?</button></div>`}
  </article>`;
}
function renderResults(o={}){
  if(!S.trip)return;
  if(S.route&&!S.trip.routes.includes(S.route))S.route=null;
  if($('#list')&&UIS.rTrip===S.trip){renderList(true,o.resort);return;}
  UIS.rTrip=S.trip;
  const ti=TABS.findIndex(t=>t[0]===S.tab);
  $('#res').innerHTML=`<h2 class="rh"><span>${S.trip.from}</span>${ic('chev','s16')}<span>${S.trip.to}</span></h2>
   <div class="seg" role="tablist" aria-label="Sort routes" id="seg"><span class="th" style="transform:translateX(${ti*100}%)"></span>${TABS.map(([k,n],j)=>`<button role="tab" id="tab-${k}" aria-selected="${S.tab===k}" tabindex="${S.tab===k?0:-1}" data-a="tab" data-v="${k}">${n}<kbd aria-hidden="true">${j+1}</kbd></button>`).join('')}</div>
   <p class="sub" id="sub"></p><div class="list" id="list" role="list"></div><div id="hidden"></div>`;
  $('#app .plan').classList.add('has-res');
  stageFor();
  renderList(false);
  requestAnimationFrame(()=>{const sc=$('#bScroll'),y=$('#res').offsetTop-$('#search').offsetHeight+4;if(matchMedia('(max-width:760px)').matches){window.scrollTo({top:$('#res').getBoundingClientRect().top+scrollY-64,behavior:RM.matches?'auto':'smooth'});return;}if(sc.scrollHeight>sc.clientHeight)sc.scrollTo({top:Math.max(0,y),behavior:RM.matches?'auto':'smooth'});});
}
function renderList(flip,resort){
  if(!$('#list'))return renderResults();
  const {ok,out}=ranked(), av=avoidNames(), list=$('#list');
  const ti=TABS.findIndex(t=>t[0]===S.tab);
  $('#seg .th').style.transform=`translateX(${ti*100}%)`;
  $$('#seg [role=tab]').forEach(b=>{const on=b.dataset.v===S.tab;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;});
  $('#sub').textContent=`${ok.length} options, ${TAB_NAME[S.tab]} first.${av.length?` Skipping ${av.join(', ')}.`:''}`;
  const first={},vals={};
  if(flip)$$('#list .card').forEach(c=>{first[c.dataset.id]=c.getBoundingClientRect().top;vals[c.dataset.id]={};c.querySelectorAll('.roll').forEach(n=>vals[c.dataset.id][n.dataset.k]=+n.textContent.replace(/\D/g,''));});
  list.className='list k-'+S.tab;
  list.innerHTML=ok.map((o,i)=>cardH(o,i,false)).join('')||`<div class="empty-r">Every route uses a mode you skipped. Go back and allow one more mode.</div>`;
  $('#hidden').innerHTML=out.length?`<button class="link more" data-a="all" aria-expanded="${S.showAll}">${S.showAll?'Hide':'View all routes'} (${out.length} hidden)</button>${S.showAll?`<div class="list hidl">${out.map((o,i)=>cardH(o,i,true)).join('')}</div>`:''}`:'';
  const key={cheap:'cost',fast:'mins',conv:'C'}[S.tab];
  $$('#list .card').forEach((c,i)=>{
    const id=c.dataset.id;
    if(flip&&first[id]!=null){
      const dy=first[id]-c.getBoundingClientRect().top;
      if(dy&&!RM.matches){c.style.transition='none';c.style.transform=`translateY(${dy}px)`;requestAnimationFrame(()=>requestAnimationFrame(()=>{c.style.transition='transform .32s var(--ease)';c.style.transform='';setTimeout(()=>{c.style.transition='';},360);}));}
      if(resort){const n=c.querySelector(`.roll[data-k="${key}"]`);if(n){const to=+n.textContent.replace(/\D/g,'');roll(n,to,Math.round(to*.6));}}
    } else {c.classList.add('rise');c.style.animationDelay=(i*40)+'ms';}
  });
  if(S.hover&&!ok.some(o=>o.r.id===S.hover))S.hover=null;
  mapSync(); renderSel();
}
function setHover(id){
  if(S.hover===id)return; S.hover=id;
  $$('#list .card').forEach(c=>c.classList.toggle('hl',c.dataset.card===id));
  mapSync();
}

/* ---------- selected summary (bottom of B) ---------- */
function renderSel(){
  const b=$('#selbar');
  if(!S.route||!S.trip||!S.trip.routes.includes(S.route)){b.hidden=true;b.innerHTML='';return;}
  const x=UIS.live?tripTotals():calc(S.route), was=b.hidden;
  b.innerHTML=`<div class="sx"><div class="nm">${UIS.live?'On your way':'Selected route'}: ${S.route.name}</div><div class="vv"><span class="num">${x.mins}<small>min</small></span><i class="dv"></i><span class="num">${money(x.cost)}</span></div></div>`+
   (UIS.live?`<button class="btn ink md" data-a="go" data-v="live">Step ${S.step+1} of ${S.legs.length}</button>`:(UIS.pv==='details'?`<button class="btn md" data-a="start">Start journey</button>`:`<button class="btn ink md" data-a="pick" data-v="${S.route.id}">Route details</button>`));
  b.hidden=false; if(was){b.style.animation='none';b.offsetHeight;b.style.animation='';}
}

/* ---------- floating panel ---------- */
function panelH(o){
  return `<header class="ph">${o.back?`<button class="ib" data-a="pBack" aria-label="Back">${ic('back')}</button>`:''}<h2 id="pTitle" tabindex="-1">${o.eb?`<span class="eb">${o.eb}</span>`:''}${o.title}</h2>${o.extra||''}${o.close===false?'':`<button class="ib" data-a="${o.closeA||'closePanel'}" aria-label="${o.closeL||'Close panel'}" title="Close (Esc)">${ic('x')}</button>`}</header>${o.top||''}<div class="pb" id="pb">${o.body}</div>${o.foot?`<footer class="pf">${o.foot}</footer>`:''}`;
}
function openPanel(view,o){
  const p=$('#panel'), was=!p.hidden&&!p.classList.contains('out'), changed=UIS.pv!==view;
  clearTimeout(closePanel.t);
  p.innerHTML=panelH(o); p.dataset.view=view; p.hidden=false; p.classList.remove('out');
  if(!was){p.classList.remove('in');p.offsetWidth;p.classList.add('in');UIS.ret=document.activeElement;}
  else if(changed){p.querySelectorAll('.pb,.ph').forEach(e=>e.classList.add('fade'));}
  UIS.pv=view; const pw=$('#stage').classList.contains('panel-on'); $('#stage').classList.add('panel-on'); if(!pw&&typeof MAPS!=="undefined"&&MAPS.bb)fitView(MAPS.bb.key,0);
  if(changed)setTimeout(()=>{$('#pTitle')?.focus({preventScroll:true});if(matchMedia('(max-width:760px)').matches)p.scrollIntoView({behavior:RM.matches?'auto':'smooth',block:'start'});},was?0:60);
  renderSel();
}
function closePanel(){
  const p=$('#panel'); if(p.hidden||!UIS.pv)return;
  UIS.pv=null;UIS.prev=null; p.classList.remove('in'); p.classList.add('out');
  $('#stage').classList.remove('panel-on');
  if(typeof MAPS!=="undefined"&&MAPS.bb)fitView(MAPS.bb.key,0);
  closePanel.t=setTimeout(()=>{p.hidden=true;p.classList.remove('out');p.innerHTML='';},RM.matches?10:240);
  navCur('home'); renderSel(); mapSync();
  const r=UIS.ret; UIS.ret=null; if(r&&document.contains(r)&&r!==document.body)r.focus({preventScroll:true});
}

/* details */
function pDetails(){
  const r=S.route,x=calc(r); markSel();
  openPanel('details',{eb:r.name,title:'Route details',
   body:`<div class="tiles"><div class="tl"><span class="t-big">${x.mins}<small>min</small></span><span>Arrive ${fmtT(x.mins)}</span></div><div class="tl"><span class="t-big">${money(x.cost)}</span><span>Total fare</span></div></div>
    ${bigRibbon(r.legs)}
    <div class="dscore"><div class="sc">${ringH(x.R)}<span class="sc-l"><b>Reliability</b>out of 100</span></div><div class="sc">${ringH(x.C)}<span class="sc-l"><b>Convenience</b>out of 100</span></div><button class="link" data-a="why" data-v="${r.id}">Why this score?</button></div>
    <h3 class="ptl">Steps</h3>
    <ol class="steps">${r.legs.map((l,i)=>stepH(l,i,'')).join('')}</ol>`,
   foot:`<button class="btn ghost" data-a="download">${ic('down')}Download route</button><button class="btn" data-a="start">Start journey</button>`});
  mapSync({draw:true});
}
function stepH(l,i,cls){
  const btn=cls==='act'?`<button class="btn md wide" data-a="book" data-v="${l[0]}">${ACTION[l[0]]}</button>`:cls===''?`<button class="btn ghost sm" data-a="book" data-v="${l[0]}">${ACTION[l[0]]}</button>`:'';
  return `<li class="st ${cls}"${cls==='act'?' aria-current="step"':''}>${cls==='done'?`<span class="tile">${ic('check')}</span>`:tileH(l[0])}<div class="bd"><b>${l[1]}</b><span class="mt">${l[2]} min, ${rupee(l[3])}</span>${btn}</div></li>`;
}

/* why this score */
function pWhy(r){
  const x=calc(r);
  if(UIS.pv&&UIS.pv!=='why')UIS.prev=UIS.pv;
  const row=(f,i)=>`<div class="fx"><span>${f[0]}</span><span class="bar"><i style="--v:${(Math.round(f[1])/100).toFixed(2)};background:${col(Math.round(f[1]))};animation-delay:${i*60}ms"></i></span><span class="v">${Math.round(f[1])}</span><span class="w">${f[2]}%</span></div>`;
  const grp=(t,s,a,sub,extra='')=>`<section class="grp"><div class="grp-h">${ringH(s,true)}<div><h3>${t}</h3><p>${sub}</p></div></div><div class="fx-h"><span>Factor</span><span>Score</span><span></span><span>Weight</span></div>${a.map(row).join('')}${extra}</section>`;
  openPanel('why',{back:!!UIS.prev,eb:r.name,title:'Why this score?',
   body:`<p class="lede">Bars show how well the route does on each factor. The percentage is how much that factor counts.</p>
    ${grp('How likely it works as planned',x.R,x.rel,'Reliability score',sparkH(r))}
    ${grp('How easy the journey feels',x.C,x.con,'Convenience score')}`,
   foot:`<button class="btn ink" data-a="pick" data-v="${r.id}">Choose route</button>`});
}

/* live */
function pLive(){
  UIS.live=true;
  const L=S.legs,n=L.length,last=S.step===n-1;
  openPanel('live',{eb:'On your way',title:`Step ${S.step+1} of ${n}`,close:false,
   extra:`<button class="btn ghost sm" data-a="exit">Exit trip</button>`,
   top:`<div class="prog" aria-hidden="true">${L.map((l,i)=>`<i class="${i<S.step?'d':i===S.step?'a':''}" style="flex:${l[2]}"></i>`).join('')}</div>`,
   body:`${S.rerouted?`<div class="note">${ic('check')}<span>Switched to a cab. About ${S.saved} min saved.</span></div>`:S.delay?`<div class="note warn">${ic('alert')}<span>${M[S.pend.mode].n} running ${S.delay} min late. Keeping your route.</span></div>`:''}
    <ol class="steps" aria-live="polite">${L.map((l,i)=>stepH(l,i,i<S.step?'done':i===S.step?'act':'up')).join('')}</ol>`,
   foot:`<button class="btn ink" data-a="next" id="nextBtn">${last?'I’ve arrived':'Done, next step'}</button>`});
  setTimeout(()=>$('#pb .st.act')?.scrollIntoView({block:'nearest',behavior:RM.matches?'auto':'smooth'}),40);
  mapSync({live:true});
}

/* end */
function endParts(){
  const t=tripTotals(),per=Math.ceil(t.cost/S.people);
  return {
   stars:[1,2,3,4,5].map(i=>`<button class="${S.rating>=i?'on':''}" data-a="star" data-v="${i}" aria-label="${i} star${i>1?'s':''}" aria-pressed="${S.rating>=i}">${ic('star')}</button>`).join(''),
   tags:FEEDBACK_TAGS.map(g=>`<button class="chip tag" data-a="tag" data-v="${g}" aria-pressed="${S.tags.has(g)}">${S.tags.has(g)?ic('check'):''}${g}</button>`).join(''),
   split:`<button data-a="ppl" data-v="-1" aria-label="Fewer people"${S.people<=1?' disabled':''}>${ic('minus')}</button><span class="n" aria-live="polite">${S.people}</span><button data-a="ppl" data-v="1" aria-label="More people"${S.people>=6?' disabled':''}>${ic('plus')}</button><span class="ea">${S.people>1?`<b>${money(per)}</b>each`:`<b>Just you</b>${t.cost?'pays '+rupee(t.cost):'no fare to split'}`}</span>`
  };
}
function pEnd(){
  if(UIS.pv==='end'){const p=endParts(),prev=$$('#stars .on').length;
    $('#stars').innerHTML=p.stars;
    $$('#stars button').forEach((b,i)=>{if(i<S.rating&&i>=prev){b.classList.add('pop');b.style.animationDelay=((i-prev)*50)+'ms';}});
    $('#tags').innerHTML=p.tags; $('#split').innerHTML=p.split; refocus(); return;}
  const t=tripTotals(),p=endParts();
  if(UIS.live){UIS.live=false;mapLiveStop();}
  openPanel('end',{eb:`${S.trip.from} → ${S.trip.to}`,title:'You’ve arrived',close:false,
   body:`<div class="tiles"><div class="tl"><span class="t-big">${t.mins}<small>min</small></span><span>Total time</span></div><div class="tl"><span class="t-big">${money(t.cost)}</span><span>Total cost</span></div></div>
    <section class="box"><h3>Changes on this trip</h3><p>${tripNote()}</p></section>
    <section class="box"><h3>How was this route?</h3><div class="stars" id="stars" role="group" aria-label="Rating">${p.stars}</div><div class="chips tags" id="tags">${p.tags}</div></section>
    <section class="box"><h3>Split the fare</h3><div class="stepper" id="split">${p.split}</div></section>
    <button class="btn ghost wide" data-a="download">${ic('down')}Download route</button>`,
   foot:`<button class="btn" data-a="finish">Done</button>`});
  mapSync();
}

/* recent */
function pRecent(){
  openPanel('recent',{title:'Recent activity',
   body:HIST.length?`<p class="lede">Tap a trip to plan it again.</p><div class="rlist">${HIST.map((h,i)=>tripRow(h,i,1)).join('')}</div>`:
    `<svg class="plat" viewBox="0 0 160 80" aria-hidden="true" fill="none" stroke="var(--ink)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 66h144M20 66V40h120v26"/><path d="M20 40l10-12h100l10 12"/><path d="M60 28V16h40v12"/><rect x="68" y="19" width="24" height="6" rx="3" fill="var(--sun)"/><path d="M44 52h12M104 52h12"/></svg><p class="emp">No trips yet. Finish a journey and it shows up here.</p>`});
}

/* ---------- modal (re-route / exit) ---------- */
function uiSheet(kind,d){
  if(kind==='why')return pWhy(d.r);
  UIS.lastFocus=document.activeElement; UIS.mk=kind;
  let h='';
  if(kind==='reroute'){const save=d.rem+d.d-d.nm;
    h=`<div class="banner">${ic('alert')}<span id="mT">${M[d.mode].n} is running ${d.d} min late</span></div>
     <div class="mcard"><h3>A cab from here could get you there sooner.</h3><p>Here is how it compares with staying on your route.</p>
      ${save>0?`<span class="save">${ic('check','s16')}Save ${save} min</span>`:''}
      <div class="tiles"><div class="tl hot"><span class="t-big">${d.nm}<small>min</small></span><span>Cab, instead of ${d.rem+d.d} min</span></div><div class="tl"><span class="t-big">+${money(d.extra)}</span><span>Extra cost</span></div></div>
      <div class="acts"><button class="btn ghost" data-a="keep">Keep my route</button><button class="btn" data-a="reroute">Switch to cab</button></div></div>`;}
  else h=`<div class="mcard"><h3 id="mT">Exit route?</h3><p>Your progress on this trip won’t be saved.</p><div class="acts"><button class="btn ghost" data-a="closeSheet">Stay on route</button><button class="btn ink" data-a="exitYes">Exit</button></div></div>`;
  $('#veilHost').innerHTML=`<div class="veil" id="veil"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mT">${h}</div></div>`;
  setTimeout(()=>$('#veil .acts .btn:last-child')?.focus(),60);
}
function uiCloseSheet(){
  if(!UIS.mk){ if(UIS.pv==='why')A.pBack(); return; }
  UIS.mk=null; const v=$('#veil'); if(!v)return; v.classList.add('out');
  setTimeout(()=>{$('#veilHost').innerHTML='';},RM.matches?10:200);
  const f=UIS.lastFocus; if(f&&document.contains(f))f.focus({preventScroll:true}); else $('#nextBtn')?.focus();
}

/* ---------- stage / map glue ---------- */
function stageFor(){
  const st=$('#stage');
  st.classList.toggle('idle',!S.trip);
  $('#empty').hidden=!!S.trip;
  if(!S.trip){$('#mapcap').innerHTML='';$('#legend').hidden=true;return;}
  $('#mapcap').innerHTML=`<span class="cn">${S.trip.from} ${ic('chev','s16')} ${S.trip.to}</span>`;
  const ms=[...new Set(S.trip.routes.flatMap(r=>r.legs.map(l=>l[0])))];
  $('#legend').innerHTML=ms.map(m=>`<span><i class="${m==='walk'?'dot':''}" style="${m==='walk'?'':'background:var(--'+m+'-c)'}"></i>${M[m].n}</span>`).join('');
  $('#legend').hidden=false;
}

/* keep keyboard focus on the same control after a partial re-render */
function refocus(){const k=UIS.fk;UIS.fk=null;if(!k)return;const el=document.querySelector(`[data-a="${k.a}"]${k.v!=null?`[data-v="${CSS.escape(k.v)}"]`:''}`);if(el&&!el.disabled)el.focus({preventScroll:true});else if(k.a==='ppl')$('#split button:not(:disabled)')?.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)UIS.fk={a:b.dataset.a,v:b.dataset.v};},true);
function markSel(){$$('#list .card[data-card]').forEach(c=>c.classList.toggle('sel',!!S.route&&c.dataset.card===S.route.id));}
