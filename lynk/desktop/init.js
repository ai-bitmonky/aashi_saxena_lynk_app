/* ============ LYNK desktop: UI-only actions, keyboard, map glue, boot (after engine) ============ */
const _eng={pick:A.pick,find:A.find,exitYes:A.exitYes,theme:A.theme,swap:A.swap};
Object.assign(A,{
 closePanel:()=>closePanel(),
 pBack:()=>{const p=UIS.prev;UIS.prev=null;if(p==='details'&&S.route){UIS.pv=null;$('#panel').hidden||0;pDetails();}else closePanel();},
 pick:d=>{if(UIS.live){uiToast('Finish or exit your current trip first.');return;}UIS.prev=null;_eng.pick(d);},
 find:d=>{if(UIS.live){uiToast('Finish or exit your current trip first.');return;}$('#homeMsg').innerHTML='';_eng.find(d);},
 exitYes:()=>{UIS.live=false;mapLiveStop();_eng.exitYes();},
 swap:()=>{_eng.swap();const b=$('#swapBtn');b.classList.toggle('spin');},
 theme:()=>{_eng.theme();themeIcon();},
 keys:()=>{const k=$('#keys'),open=k.hidden;k.hidden=!open;$('#keysBtn').setAttribute('aria-expanded',open);}
});
function themeIcon(){const t=S.theme,ic={auto:'auto-th',dark:'moon',light:'sun'}[t];
  $('#themeBtn').innerHTML=`<svg class="i s24" aria-hidden="true"><use href="#i-${ic}"/></svg><span class="tip" aria-hidden="true">Theme: ${t==='auto'?'match system':t}</span>`;
  $('#themeBtn').setAttribute('aria-label',`Theme: ${t==='auto'?'match system':t}. Change theme`);
  mapSync();}
/* rail nav while a trip is running asks first */
const _go=uiGo;
UI.go=uiGo=function(v){ if(UIS.live&&(v==='home'||v==='recent')&&!UIS.exiting&&UIS.pv==='live'){A.exit();return;} UIS.exiting=false; _go(v); };
A.exitYes=(()=>{const f=A.exitYes;return()=>{UIS.exiting=true;f();};})();
A.go=d=>{ if(d.v==='live'&&UIS.live){pLive();return;} UI.go(d.v); };

/* ---------- keyboard ---------- */
function cardIds(){return $$('#list .card[data-card]').map(c=>c.dataset.card);}
function moveHl(dir){UIS.kb=true;const ids=cardIds();if(!ids.length)return;let i=ids.indexOf(S.hover);i=i<0?(dir>0?0:ids.length-1):Math.max(0,Math.min(ids.length-1,i+dir));setHover(ids[i]);
  const c=$(`#list .card[data-card="${ids[i]}"]`);c.scrollIntoView({block:'nearest',behavior:RM.matches?'auto':'smooth'});}
document.addEventListener('keydown',e=>{
  const t=e.target, typing=t.matches('input,textarea'), k=e.key;
  if(k==='Escape'){
    if(!$('#keys').hidden){A.keys();$('#keysBtn').focus();return;}
    if(UIS.mk){ if(UIS.mk==='exit')uiCloseSheet(); return; }
    if(typing){t.blur();return;}
    if(UIS.pv&&UIS.pv!=='live'&&UIS.pv!=='end'){e.preventDefault();UIS.pv==='why'&&UIS.prev?A.pBack():closePanel();}
    return;}
  if(UIS.mk){ if(k==='Tab'){const f=$$('#veil button');if(!f.length)return;const a=f.indexOf(document.activeElement);if(e.shiftKey&&a<=0){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&a===f.length-1){e.preventDefault();f[0].focus();}} return; }
  if(typing){ if(k==='Enter'){e.preventDefault(); if(t.id==='from'&&!$('#to').value.trim())$('#to').focus(); else A.find({});} return; }
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(k==='/'){e.preventDefault();$('#from').focus();$('#from').select();return;}
  if(k==='?'){A.keys();return;}
  if(k==='s'||k==='S'){A.swap();return;}
  if(t.closest&&t.closest('[role=tablist]')&&(k==='ArrowLeft'||k==='ArrowRight')){e.preventDefault();const i=TABS.findIndex(x=>x[0]===S.tab),n=(i+(k==='ArrowRight'?1:2))%3;A.tab({v:TABS[n][0]});$('#tab-'+TABS[n][0]).focus();return;}
  if(!S.trip||!$('#list'))return;
  if(k==='1'||k==='2'||k==='3'){A.tab({v:TABS[+k-1][0]});return;}
  if(k==='j'||k==='J'||k==='ArrowDown'&&!t.closest('.pb,.scroll')){e.preventDefault();moveHl(1);return;}
  if(k==='k'||k==='K'||k==='ArrowUp'&&!t.closest('.pb,.scroll')){e.preventDefault();moveHl(-1);return;}
  if(k==='Enter'&&S.hover&&(UIS.kb||!t.closest('button,a,input'))&&!t.closest('#list .card button,.pb,.pf')){e.preventDefault();UIS.kb=false;A.pick({v:S.hover});return;}
  if((k==='w'||k==='W')){const id=S.hover||(S.route&&S.route.id)||cardIds()[0];if(id)A.why({v:id});return;}
});

/* ---------- hover link + card click ---------- */
$('#res').addEventListener('pointerover',e=>{const c=e.target.closest('.card[data-card]');if(c)setHover(c.dataset.card);});
$('#res').addEventListener('pointerleave',()=>{if(!UIS.kb)setHover(null);});
$('#res').addEventListener('pointermove',()=>{UIS.kb=false;},{passive:true});
$('#res').addEventListener('focusin',e=>{const c=e.target.closest('.card[data-card]');if(c)setHover(c.dataset.card);});
$('#res').addEventListener('click',e=>{if(e.target.closest('button,a'))return;const c=e.target.closest('.card[data-card]');if(c)A.pick({v:c.dataset.card});});
document.addEventListener('click',e=>{const k=$('#keys');if(!k.hidden&&!e.target.closest('#keys,#keysBtn'))A.keys();});
$('#bScroll').addEventListener('scroll',()=>$('#search').classList.toggle('stuck',$('#bScroll').scrollTop>$('#top').offsetHeight-4),{passive:true});

/* ---------- map glue ---------- */
const MAPS={svg:$('#map'),key:null,drawn:''};
function mapSync(){
  const svg=MAPS.svg; if(!window.LynkMap)return;
  const key=S.tripKey||'dwarka';
  if(MAPS.key!==key){LynkMap.mount(svg,{corridor:key,size:'desktop'});MAPS.key=key;MAPS.drawn='';}
  if(!S.trip){LynkMap.routes(svg,[],{});LynkMap.pins(svg,{from:false,to:false});return;}
  LynkMap.pins(svg,{from:S.trip.from,to:S.trip.to});
  const trip=UIS.live||UIS.pv==='end';
  let list,active=null,hover=null;
  if(trip&&S.route){list=[{id:S.route.id,legs:S.legs}];active=S.route.id;hover=active;}
  else{list=ranked().ok.map(o=>({id:o.r.id,legs:o.r.legs}));
    const sel=S.route&&list.some(r=>r.id===S.route.id)?S.route.id:null;active=sel;hover=S.hover||(UIS.pv==='details'?sel:null);}
  LynkMap.routes(svg,list,{active,hover});
  const cur=active?active+'|'+(trip?S.legs:S.route.legs).map(l=>l[0]+l[2]).join(','):'';
  if(cur&&cur!==MAPS.drawn&&(UIS.pv==='details'||UIS.live)){MAPS.drawn=cur;LynkMap.drawIn(svg,active);}
  if(!active)MAPS.drawn='';
  fitView(key,list.length);
  if(UIS.live&&S.route)LynkMap.progress(svg,S.legs,S.step);
  else LynkMap.stop(svg,{hide:true});
  const L=trip&&S.route?S.legs:active?S.route.legs:null;
  $('#mapText').textContent=L?`Route on the map: ${L.map(l=>l[1]).join(', then ')}.`:`Map shows ${list.length} routes from ${S.trip.from} to ${S.trip.to}.`;
}
/* fit the corridor's routes + pins into the visible canvas (module mounts with 'slice', which crops the ends) */
function fitView(key,n){
  const svg=MAPS.svg; if(!S.trip)return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  svg.querySelectorAll((S.route&&(UIS.pv||UIS.live)?'.routes .rt.on path.ln':'.routes path.ln')+',.pins .pin').forEach(e=>{try{const b=e.getBBox();let x=b.x,y=b.y;const t=(e.getAttribute('transform')||'').match(/translate\(([-\d.]+)[ ,]([-\d.]+)/);if(t){x+=+t[1];y+=+t[2];}x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+b.width);y1=Math.max(y1,y+b.height);}catch(_){}});
  if(x0>x1)return; const P=12; x0-=P;y0-=P;x1+=P;y1+=P; MAPS.bb={key,n,x0,y0,x1,y1};
  const r=svg.getBoundingClientRect(); if(!r.width||!r.height)return;
  const wide=!matchMedia('(max-width:760px)').matches, pnl=wide&&$('#stage').classList.contains('panel-on')&&r.width-396>=200?396:0;
  const av=r.width-pnl, tight=av<560, pl=tight?24:wide?96:72,pr=tight?24:wide?120:96,pt=wide?80:24,pb=wide?60:16, vw=av-pl-pr, vh=r.height-pt-pb, cw=x1-x0, ch=y1-y0;
  const k=Math.min(vw/cw,vh/ch,2.4), W=r.width/k, H=r.height/k;
  const x=x0-(pl+(vw-cw*k)/2)/k, y=y0-(pt+(vh-ch*k)/2)/k;
  svg.setAttribute('viewBox',[x,y,W,H].map(v=>+v.toFixed(1)).join(' '));
  svg.setAttribute('preserveAspectRatio','xMidYMid slice');
  /* keep labels readable whatever the zoom: >=11.5px for stations, >=9px road names */
  const f=v=>(Math.max(v[0],v[1]/k)).toFixed(2)+'px';
  svg.style.setProperty('--lb',f([9.5,wide?11.5:10.5])); svg.style.setProperty('--lr',f([6.5,9])); svg.style.setProperty('--lp',f([8.5,10.5])); svg.style.setProperty('--sw',Math.max(1,1/k).toFixed(3)); svg.style.setProperty('--lh',(Math.max(3,3.4/k)).toFixed(2)+'px');
  declutterLabels(svg);
}
function declutterLabels(svg){const kept=[];
  svg.querySelectorAll('.labels .lb').forEach(t=>{t.classList.remove('hid');});
  svg.querySelectorAll('.labels .lb').forEach(t=>{let bb;try{bb=t.getBBox();}catch(_){return;}if(!bb.width)return;
    const b={x:bb.x-2,y:bb.y-1,w:bb.width+4,h:bb.height+2},hit=kept.some(q=>b.x<q.x+q.w&&q.x<b.x+b.w&&b.y<q.y+q.h&&q.y<b.y+b.h);
    if(hit&&t.getAttribute('data-major')!=='1')t.classList.add('hid');else kept.push(b);});}
let _rz;addEventListener('resize',()=>{cancelAnimationFrame(_rz);_rz=requestAnimationFrame(()=>S.trip&&MAPS.bb&&fitView(MAPS.bb.key,0));});
function mapLiveStop(){ if(window.LynkMap)LynkMap.stop(MAPS.svg,{hide:true}); }
MAPS.svg.addEventListener('lynkmap:hover',e=>{ if(!UIS.live&&UIS.pv!=='end')setHover(e.detail.id); });
MAPS.svg.addEventListener('lynkmap:select',e=>{ if(!UIS.live&&UIS.pv!=='end')A.pick({v:e.detail.id}); });

/* ---------- boot ---------- */
themeIcon(); renderHome(); stageFor(); mapSync();
