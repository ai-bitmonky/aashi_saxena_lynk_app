/* ============ LYNK mobile UI layer (defined before the engine; engine calls UI.* only on user actions) ============ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
window.UI=(()=>{
 const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const buzz=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
 const ic=(k,c='i')=>`<svg class="${c}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
 const tileH=(m,sz='')=>`<span class="tile ${sz} m-${m}" aria-hidden="true">${ic(m)}</span>`;
 const rH=n=>n?INR.format(n).replace('₹','<span class="cur">₹</span>'):'Free';
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const ribH=(legs,cls='')=>{const tot=sum(legs,l=>l[2]);return `<div class="rib ${cls}" aria-hidden="true">${legs.map(l=>`<i class="m-${l[0]}" style="flex:${Math.max(l[2],tot*.06)}"></i>`).join('')}</div>`;};
 const chainH=legs=>`<div class="chain" aria-label="${esc(legs.map(l=>`${M[l[0]].n} ${l[2]} min`).join(', then '))}">${legs.map((l,i)=>`${i?ic('chev-r','i ch'):''}<span class="lk">${tileH(l[0],'sm')}<em>${l[2]}</em></span>`).join('')}</div>`;
 const ringH=(v,big)=>{const C=113.1;return `<span class="ring" role="img" aria-label="Reliability ${v} out of 100"><svg viewBox="0 0 44 44"><circle class="tk" cx="22" cy="22" r="18"/><circle class="ar" cx="22" cy="22" r="18" style="stroke:${col(v)};stroke-dashoffset:${(C*(1-v/100)).toFixed(1)}"/></svg><b>${v}</b></span>`;};
 const pipsH=v=>{const n=Math.round(v/20);return `<span class="pips" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;};
 const trafCol=t=>t==='Low'?'var(--good)':t==='Medium'?'var(--mid)':'var(--poor)';
 const legKey=r=>{const t=r.legs.filter(l=>l[0]!=='walk');return t.length?t[0][0]:'walk';};

 /* ---------- navigation stack ---------- */
 const ROOTS=['home','recent'];
 let stack=['home'], cur='home', anims=[];
 const pg=id=>$('#p-'+id);
 function finishAnims(){anims.forEach(a=>{try{a.finish()}catch(e){}});anims=[];}
 function trans(fromId,toId,type){
  finishAnims();
  const f=pg(fromId),t=pg(toId),rm=RM();
  t.classList.add('on');t.inert=false;f.inert=true;
  const ease='cubic-bezier(.32,.72,0,1)',dur=rm?150:380;
  let a1,a2;
  if(type==='fade'||rm){
   t.style.zIndex=3;
   a1=t.animate([{opacity:0},{opacity:1}],{duration:rm?150:220,easing:'cubic-bezier(.2,0,0,1)'});
  }else if(type==='push'){
   t.style.zIndex=3;t.style.boxShadow='-10px 0 32px rgba(14,14,15,.12)';
   a1=t.animate([{transform:'translateX(100%)'},{transform:'none'}],{duration:dur,easing:ease});
   a2=f.animate([{transform:'none',filter:'brightness(1)'},{transform:'translateX(-28%)',filter:'brightness(.9)'}],{duration:dur,easing:ease});
  }else{
   f.style.zIndex=3;f.style.boxShadow='-10px 0 32px rgba(14,14,15,.12)';
   a1=f.animate([{transform:'none'},{transform:'translateX(100%)'}],{duration:dur,easing:ease});
   a2=t.animate([{transform:'translateX(-28%)',filter:'brightness(.9)'},{transform:'none',filter:'brightness(1)'}],{duration:dur,easing:ease});
  }
  anims=[a1,a2].filter(Boolean);
  a1.onfinish=()=>{f.classList.remove('on');[f,t].forEach(p=>{p.style.zIndex='';p.style.boxShadow='';p.style.transform='';});anims=[];};
  cur=toId;
  try{t.focus({preventScroll:true})}catch(e){}
  if(toId==='live')startMapLoop();else stopMapLoop();
 }
 function go(id){
  if(ROOTS.includes(id)){render(id);}
  if(id===cur)return;
  const idx=stack.indexOf(id);
  if(idx>=0){const from=cur;stack=stack.slice(0,idx+1);trans(from,id,'pop');}
  else if(ROOTS.includes(id)){const from=cur;stack=[id];trans(from,id,'fade');}
  else{const from=cur;stack.push(id);const s=pg(id).querySelector('.scroll');if(s)s.scrollTop=0;pg(id).classList.remove('collapsed');trans(from,id,'push');}
 }
 function back(){ if(stack.length>1&&!['live','end'].includes(cur))go(stack[stack.length-2]); }

 /* edge swipe-back */
 function edgeSwipe(){
  $$('.edge').forEach(ed=>{
   let x0=0,t0=0,on=false,w=0,f,t;
   ed.addEventListener('pointerdown',e=>{
    if(stack.length<2||['live','end'].includes(cur)||!$('#layer').hidden)return;
    finishAnims();on=true;x0=e.clientX;t0=performance.now();ed.setPointerCapture(e.pointerId);
    f=pg(cur);t=pg(stack[stack.length-2]);w=f.offsetWidth;t.classList.add('on');t.style.zIndex=1;f.style.zIndex=3;f.style.boxShadow='-10px 0 32px rgba(14,14,15,.12)';
    f.style.willChange='transform';
   });
   ed.addEventListener('pointermove',e=>{ if(!on)return; const dx=Math.max(0,e.clientX-x0)/(+getComputedStyle($('#devwrap')).getPropertyValue('--s')||1),p=dx/w;
    f.style.transform=`translateX(${dx}px)`;t.style.transform=`translateX(${-28*(1-p)}%)`;t.style.filter=`brightness(${.9+.1*p})`; });
   const end=e=>{ if(!on)return;on=false;
    const sc=+getComputedStyle($('#devwrap')).getPropertyValue('--s')||1;
    const dx=Math.max(0,e.clientX-x0)/sc,v=dx/(performance.now()-t0),done=dx>w*.35||v>.5;
    const ease='cubic-bezier(.32,.72,0,1)';
    const fa=f.animate([{transform:f.style.transform},{transform:done?'translateX(100%)':'none'}],{duration:280,easing:ease});
    t.animate([{transform:t.style.transform,filter:t.style.filter},{transform:done?'none':'translateX(-28%)',filter:done?'brightness(1)':'brightness(.9)'}],{duration:280,easing:ease});
    const ff=f,tt=t;
    fa.onfinish=()=>{[ff,tt].forEach(p=>{p.style.transform='';p.style.filter='';p.style.zIndex='';p.style.boxShadow='';p.style.willChange='';});
     if(done){ff.classList.remove('on');ff.inert=true;tt.inert=false;stack.pop();cur=stack[stack.length-1];if(cur==='live')startMapLoop();else stopMapLoop();}
     else tt.classList.remove('on');};
   };
   ed.addEventListener('pointerup',end);ed.addEventListener('pointercancel',end);
  });
 }

 /* collapsing headers */
 function headers(){
  $$('.page').forEach(p=>{const s=p.querySelector('.scroll');if(!s)return;let q=0;
   s.addEventListener('scroll',()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;p.classList.toggle('collapsed',s.scrollTop>(p.id==='p-home'?52:44));});},{passive:true});});
 }

 /* ---------- toast ---------- */
 let tT;
 function toast(t){const e=$('#toast');e.innerHTML=ic('info')+`<span>${esc(t)}</span>`;
  const onTab=['home','recent'].includes(cur);e.style.bottom=onTab?'calc(var(--hb) + 136px)':'calc(var(--hb) + 88px)';
  e.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>e.classList.remove('on'),2800);}

 /* ---------- fields ---------- */
 const fields=()=>({from:$('#from').value.trim(),to:$('#to').value.trim()});
 function setFields(f,t){$('#from').value=f;$('#to').value=t;clearMsg();}
 const remember=()=>$('#remember').getAttribute('aria-checked')==='true';
 function clearMsg(){$('#homeMsg').innerHTML='';}

 /* ---------- HOME ---------- */
 function recRow(h,i){
  const keys=h.modes.split(' · ').map(n=>Object.keys(M).find(k=>M[k].n===n)||'walk');
  const main=keys.find(k=>k!=='walk')||'walk';
  return `<button class="rec" data-a="reuse" data-v="${i}" aria-label="Plan again: ${esc(h.from)} to ${esc(h.to)}, ${esc(h.when)}, ${h.mins} minutes, ${rupee(h.cost)}">
   ${tileH(main,'lg')}
   <span class="tx"><b>${esc(h.from)} → ${esc(h.to)}</b><span>${esc(h.when)} · <span class="num">${h.mins}</span> min · <span class="num">${rupee(h.cost)}</span></span>
   <span class="rib">${keys.map(k=>`<i class="m-${k}" style="flex:${k==='walk'?1:3}"></i>`).join('')}</span></span>
   ${ic('chev-r','i chev')}</button>`;
 }
 function renderHome(o={}){
  const sg=$('#sugs');
  if(!sg.children.length) sg.innerHTML=Object.entries(TRIPS).map(([k,t])=>`<button class="sug" data-a="sug" data-v="${k}" aria-label="${t.from} to ${t.to}">${ic('pin')}<b>${t.from}</b>${ic('arrow','i ar')}${t.to}</button>`).join('');
  const md=$('#modes'),list=['metro','bus','auto','cab','walk'];
  if(!md.children.length) md.innerHTML=list.map(m=>`<button class="mc" data-a="mode" data-v="${m}">${tileH(m,'sm')}<span class="lb">${m==='walk'?'Long walks':M[m].n}</span></button>`).join('');
  md.querySelectorAll('.mc').forEach(b=>{const off=S.avoid.has(b.dataset.v);b.classList.toggle('off',off);b.setAttribute('aria-pressed',String(!off));b.setAttribute('aria-label',(b.dataset.v==='walk'?'Long walks':M[b.dataset.v].n)+(off?', skipped':', allowed'));});
  $('#homeRecent').innerHTML=HIST.slice(0,2).map(recRow).join('');
  $('#homeRecent').previousElementSibling.hidden=!HIST.length;$('#homeRecent').hidden=!HIST.length;
  if(o.nomatch){
   clearTimeout(tT);$('#toast').classList.remove('on');
   $('#homeMsg').innerHTML=`<div class="note pop">${ic('info')}<span>This pilot only covers two corridors so far. Tap one of the suggestions above.</span></div>`;
   const fl=$('#fields');fl.classList.remove('shake');void fl.offsetWidth;if(!RM())fl.classList.add('shake');
  }
 }

 /* ---------- RESULTS ---------- */
 let lastTab='cheap';
 function card(o,i,dim){
  const {r,x}=o,best=i===0&&!dim,k=S.tab;
  return `<article class="rc ${best?'best':''} ${dim?'dim':''}" data-id="${r.id}" ${dim?'':`data-a="pick" data-v="${r.id}"`} style="--i:${i}" aria-label="${esc(r.name)}">
   ${best?`<span class="flag">${ic(k==='cheap'?'tag':k==='fast'?'bolt':'seat')}${BEST_LABEL[k]}</span>`:''}
   <div class="rc-top"><div><div class="hn num" data-roll="${x.mins}" data-k="fast">${x.mins}<small>min</small></div><div class="meta">Arrive ${fmtT(x.mins)}</div></div>
    <div><div class="hn fare num" data-roll="${x.cost}" data-k="cheap">${rH(x.cost)}</div><div class="meta" style="text-align:right">${esc(r.name)}</div></div></div>
   ${chainH(r.legs)}${ribH(r.legs)}
   <div class="scores">
    <div class="sc">${ringH(x.R)}<span class="lb"><b>Reliability</b>${x.R>=80?'Works as planned':x.R>=60?'Some risk':'Often disrupted'}</span></div>
    <div class="sc"><span class="cv" role="img" aria-label="Convenience ${x.C} out of 100"><b>Convenience</b><span class="pp">${pipsH(x.C)}<span class="n" data-roll="${x.C}" data-k="conv">${x.C}</span></span></span></div>
   </div>
   <div class="tr"><i class="dot" style="background:${trafCol(x.traffic)}"></i>${x.traffic} traffic impact</div>
   ${dim?`<p class="why-h">${ic('alert')}Hidden because you skipped ${hidden(r,x)}.</p>`:`<div class="acts"><button class="lnk" data-a="why" data-v="${r.id}">Why this score?</button><button class="btn b-ink b-sm" data-a="pick" data-v="${r.id}">Choose route</button></div>`}
  </article>`;
 }
 function segH(){
  const s=$('#seg');
  if(!s.querySelector('button')) s.insertAdjacentHTML('beforeend',TABS.map(([k,n])=>`<button role="tab" id="tab-${k}" data-a="tab" data-v="${k}" aria-controls="resCards">${n}</button>`).join(''));
  const i=TABS.findIndex(t=>t[0]===S.tab);
  $('#segTh').style.transform=`translateX(${i*100}%)`;
  s.querySelectorAll('button').forEach(b=>{const on=b.dataset.v===S.tab;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;});
 }
 function hiddenH(out){
  return out.length?`<button class="morebtn" data-a="all" aria-expanded="${S.showAll}">${S.showAll?'Hide':'View all routes'} (${out.length} hidden)${ic('chev-d')}</button>${S.showAll?`<div class="hiddenlist">${out.map((o,i)=>card(o,i,true)).join('')}</div>`:''}`:'';
 }
 function subTxt(ok){const av=avoidNames();return `${ok.length} options, ${TAB_NAME[S.tab]} first.${av.length?` Skipping ${av.join(', ')}.`:''}`;}
 function roll(el,from,to,fmt){
  if(RM()||from===to){el.innerHTML=fmt(to);return;}
  const t0=performance.now(),D=450;
  const f=t=>{const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);el.innerHTML=fmt(Math.round(from+(to-from)*e));if(p<1)requestAnimationFrame(f);};requestAnimationFrame(f);
 }
 function renderResults(o={}){
  const T=S.trip,{ok,out}=ranked();
  if(o.resort&&cur==='results'){
   const old={};$$('#resCards .rc').forEach(c=>old[c.dataset.id]=c.getBoundingClientRect().top);
   $('#resCards').innerHTML=ok.map((q,i)=>card(q,i,false)).join('')||emptyH();
   $('#resSub').textContent=subTxt(ok);segH();
   $$('#resCards .rc').forEach(c=>{const y=old[c.dataset.id];if(y==null||RM())return;const dy=y-c.getBoundingClientRect().top;
    if(dy)c.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:320,easing:'cubic-bezier(.2,0,0,1)'});});
   const fl=$('#resCards .flag');if(fl&&!RM())fl.classList.add('pop');
   $$(`#resCards [data-k="${S.tab}"]`).forEach(el=>{const v=+el.dataset.roll;const fmt=S.tab==='fast'?n=>`${n}<small>min</small>`:S.tab==='cheap'?n=>rH(n):n=>n;roll(el,Math.round(v*.6),v,fmt);});
   lastTab=S.tab;return;
  }
  if(cur==='results'&&!o.full){ $('#resHidden').innerHTML=hiddenH(out);return; }
  $('#resCt').textContent=`${T.from} → ${T.to}`;
  $('#resHead').innerHTML=`<h1 class="trip-t" aria-label="${T.from} to ${T.to}"><span class="fr"><i class="od"></i>${T.from}</span><span class="to"><i class="dd"></i>${T.to}</span></h1>`;
  segH();
  $('#resSub').textContent=subTxt(ok);
  $('#resCards').innerHTML=ok.map((q,i)=>card(q,i,false)).join('')||emptyH();
  $$('#resCards .rc').forEach(c=>c.classList.add('in'));
  $('#resHidden').innerHTML=hiddenH(out);
  if(!o.keepScroll)$('#resScroll').scrollTop=0;
  lastTab=S.tab;
 }
 const emptyH=()=>`<div class="empty-r">Every route uses a mode you skipped. Go back and allow one more mode.</div>`;

 /* pull to refresh */
 function ptr(){
  const sc=$('#resScroll'),mv=$('#resMove'),pr=$('#ptr'),ring=pr.querySelector('.pr'),svg=pr.querySelector('svg');
  let y0=null,dy=0,busy=false,pulled=false;
  const sF=()=>+getComputedStyle($('#devwrap')).getPropertyValue('--s')||1;
  const startY=y=>{if(busy||sc.scrollTop>0||!S.trip)return;y0=y;dy=0;pulled=false;};
  const moveY=(y,e)=>{if(y0==null)return;dy=(y-y0)/sF();if(dy<=0){reset0();return;}if(dy>6){pulled=true;if(e&&e.cancelable)e.preventDefault();}
   const d=Math.min(110,dy*.55);mv.style.transform=`translateY(${d}px)`;svg.style.opacity=Math.min(1,d/40);svg.style.transform=`translateY(${d-8}px)`;
   ring.style.strokeDashoffset=62.8*(1-Math.min(1,d/64));};
  const reset0=()=>{mv.style.transform='';svg.style.opacity=0;};
  const endY=()=>{if(y0==null)return;y0=null;const d=Math.min(110,dy*.55);
   if(d>=64){busy=true;buzz();mv.style.transition='transform .3s cubic-bezier(.32,.72,0,1)';mv.style.transform='translateY(48px)';pr.classList.add('spin');ring.style.strokeDashoffset=44;
    $('#resCards').innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    setTimeout(()=>{mv.style.transform='';svg.style.opacity=0;pr.classList.remove('spin');renderResults({full:true,keepScroll:true});setTimeout(()=>{mv.style.transition='';busy=false;},300);},900);
   }else{mv.style.transition='transform .3s cubic-bezier(.32,.72,0,1)';reset0();setTimeout(()=>mv.style.transition='',300);}
  };
  sc.addEventListener('touchstart',e=>startY(e.touches[0].clientY),{passive:true});
  sc.addEventListener('touchmove',e=>moveY(e.touches[0].clientY,e),{passive:false});
  sc.addEventListener('touchend',endY);
  sc.addEventListener('mousedown',e=>{if(e.button===0)startY(e.clientY);});
  window.addEventListener('mousemove',e=>{if(y0!=null&&e.buttons)moveY(e.clientY);});
  window.addEventListener('mouseup',()=>{const p=pulled;endY();if(p){const k=ev=>{ev.stopPropagation();ev.preventDefault();};window.addEventListener('click',k,{capture:true,once:true});setTimeout(()=>window.removeEventListener('click',k,{capture:true}),50);}});
 }

 /* ---------- SHEETS ---------- */
 let sh={open:false,kind:'',snaps:[],idx:0,H:0,ret:null};
 const appH=()=>$('#app').offsetHeight;
 function whyH(r){
  const x=calc(r),sp=sparkData(r),mk=legKey(r);
  const fx=(a)=>`<div class="fxh"><span>Factor</span><span>Score</span><span>Weight</span></div>`+a.map((f,k)=>{const v=Math.round(f[1]);return `<div class="fx"><span class="l">${f[0]}</span><span class="v">${v}</span><span class="w">${f[2]}%</span><span class="bar"><i style="--v:${(v/100).toFixed(3)};--c:${col(v)};--k:${k}"></i></span></div>`;}).join('');
  const W=96,Hh=30,mn=Math.min(...sp,70)-4,mx=Math.max(...sp,95)+2,X=i=>(i*W/6).toFixed(1),Y=v=>(Hh-(v-mn)/(mx-mn)*Hh).toFixed(1);
  const path=sp.map((v,i)=>`${i?'L':'M'}${X(i)} ${Y(v)}`).join(''),last=sp[6];
  return `<div class="grab"><span class="grabber"></span><div class="sh-head"><div class="tx"><h2 id="shT">${esc(r.name)}</h2><p>Bars show how well the route does on each factor. The percentage is how much that factor counts.</p></div><button class="ib" data-a="closeSheet" aria-label="Close">${ic('close')}</button></div></div>
  <div class="sh-body">
   <section class="wg"><div class="wg-h">${ringH(x.R)}<div><h3>How likely it works as planned</h3><p>Reliability, <span class="num">${x.R}</span> out of 100</p></div></div>${fx(x.rel)}
    <div class="spark m-${mk}"><div class="tx"><b>On time, last 7 days</b>Dashed line is the 80% target</div>
     <svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="On-time share over 7 days: ${sp.join(', ')} percent"><line class="tg" x1="0" x2="${W}" y1="${Y(80)}" y2="${Y(80)}"/><path class="ln" d="${path}" stroke="var(--mc)"/><circle cx="${X(6)}" cy="${Y(last)}" r="3" fill="var(--mc)" stroke="var(--surface)" stroke-width="1.5"/></svg>
     <span class="pv">${last}%</span></div>
   </section>
   <section class="wg"><div class="wg-h"><span class="ring" role="img" aria-label="Convenience ${x.C} out of 100"><svg viewBox="0 0 44 44"><circle class="tk" cx="22" cy="22" r="18"/><circle class="ar" cx="22" cy="22" r="18" style="stroke:${col(x.C)};stroke-dashoffset:${(113.1*(1-x.C/100)).toFixed(1)}"/></svg><b>${x.C}</b></span><div><h3>How easy the journey feels</h3><p>Convenience, <span class="num">${x.C}</span> out of 100</p></div></div>${fx(x.con)}</section>
  </div>`;
 }
 function rerouteH(o){
  const nm=M[o.mode].n;
  return `<div class="grab"><span class="grabber"></span></div><div class="sh-body">
   <div class="rr-h"><span class="tile lg m-${o.mode}">${ic(o.mode)}<span class="badge">${ic('alert')}</span></span><div><h2 class="big" id="shT">${nm} is running ${o.d} min late</h2></div></div>
   <p class="lead" style="margin:-4px 0 16px">A cab from here could get you there sooner.</p>
   <div class="tiles">
    <div class="tl2 hl2"><span style="display:flex;align-items:center;gap:8px">${tileH('cab','sm')}<span>Cab</span></span><div class="hn num" style="margin-top:6px">${o.nm}<small>min</small></div><span>Cab, instead of <span class="num">${o.rem+o.d}</span> min</span><span class="save bounce">Saves ${o.rem+o.d-o.nm} min</span></div>
    <div class="tl2"><span style="display:flex;align-items:center;gap:8px"><span class="tile sm m-walk">${ic('tag')}</span><span>Fare</span></span><div class="hn num" style="margin-top:6px">+${rH(o.extra).replace('Free','<span class="cur">₹</span>0')}</div><span>Extra cost</span></div>
   </div>
   <div class="sh-acts"><button class="btn b-ghost" data-a="keep">Keep my route</button><button class="btn b-sun" data-a="reroute">Switch to cab</button></div></div>`;
 }
 function exitH(){
  return `<div class="grab"><span class="grabber"></span></div><div class="sh-body">
   <h2 class="big" id="shT">Exit route?</h2><p class="lead">Your progress on this trip won’t be saved.</p>
   <div class="sh-acts"><button class="btn b-ghost" data-a="closeSheet">Stay on route</button><button class="btn b-ink" data-a="exitYes">Exit</button></div></div>`;
 }
 function setY(y,anim){
  const s=$('#sheet');s.style.transition=anim?`transform ${RM()?150:420}ms cubic-bezier(.32,.72,0,1)`:'none';
  s.style.transform=`translateY(${y}px)`;
  const vis=sh.H-y,low=sh.snaps[0];const p=clamp(vis/low,0,1);
  const sc=$('#scrim');sc.style.transition=anim?`opacity ${RM()?150:420}ms cubic-bezier(.32,.72,0,1)`:'none';sc.style.opacity=(.4*p).toFixed(3);
 }
 function snapTo(i){sh.idx=i;setY(sh.H-sh.snaps[i],true);$('#sheet').classList.toggle('peek',i<sh.snaps.length-1);}
 function sheet(kind,data){
  const L=$('#layer'),s=$('#sheet');
  sh.ret=document.activeElement;sh.kind=kind;
  s.innerHTML=kind==='why'?whyH(data.r):kind==='reroute'?rerouteH(data):exitH();
  L.hidden=false;$('#pages').inert=true;
  const A_=appH();
  if(kind==='why'){sh.H=Math.round(A_*.92);s.style.height=sh.H+'px';sh.snaps=[Math.round(A_*.58),sh.H];}
  else{s.style.height='';sh.H=s.offsetHeight;sh.snaps=[sh.H];}
  setY(sh.H,false);s.offsetHeight;
  sh.open=true;
  requestAnimationFrame(()=>{snapTo(0);});
  if(kind==='reroute'){buzz();}
  setTimeout(()=>{const b=s.querySelector(kind==='why'?'.ib':'.btn');b&&b.focus({preventScroll:true});},60);
 }
 function closeSheet(){
  if(!sh.open)return;sh.open=false;
  setY(sh.H,true);
  $('#banner').classList.remove('on');
  setTimeout(()=>{if(sh.open)return;$('#layer').hidden=true;$('#pages').inert=false;$('#sheet').innerHTML='';try{sh.ret&&sh.ret.focus({preventScroll:true})}catch(e){}},RM()?160:420);
 }
 function sheetDrag(){
  const s=$('#sheet');let lastUp=0,y0=null,base=0,last=[],dragging=false,fromBody=false;
  s.addEventListener('pointerdown',e=>{
   if(e.button>0||e.target.closest('button'))return;
   const body=e.target.closest('.sh-body');fromBody=!!body;
   if(body&&!s.classList.contains('peek')&&body.scrollTop>0)return;
   y0=e.clientY;base=sh.H-sh.snaps[sh.idx];last=[[e.clientY,performance.now()]];dragging=false;
  });
  window.addEventListener('pointermove',e=>{
   if(y0==null)return;const sc=+getComputedStyle($('#devwrap')).getPropertyValue('--s')||1;
   let dy=(e.clientY-y0)/sc;
   if(!dragging){ if(Math.abs(dy)<6)return;
    if(fromBody&&!s.classList.contains('peek')&&dy<0){y0=null;return;}
    dragging=true;s.classList.add('drag');try{s.setPointerCapture(e.pointerId)}catch(_){}}
   let y=base+dy;if(y<0)y=-Math.pow(-y,.7);
   setY(y,false);last.push([e.clientY,performance.now()]);if(last.length>5)last.shift();
  });
  const up=e=>{
   if(y0==null)return;const was=dragging;if(was)lastUp=performance.now();y0=null;dragging=false;s.classList.remove('drag');if(!was)return;
   const sc=+getComputedStyle($('#devwrap')).getPropertyValue('--s')||1;
   const a=last[0],b=last[last.length-1],v=(b[1]-a[1])?(b[0]-a[0])/sc/(b[1]-a[1]):0;
   const curY=+(s.style.transform.match(/-?[\d.]+/)||[0])[0],vis=sh.H-curY;
   if(v>.5){ if(sh.idx===0)return closeSheet(); return snapTo(sh.idx-1);}
   if(v<-.5){ return snapTo(Math.min(sh.snaps.length-1,sh.idx+1)); }
   if(vis<sh.snaps[0]*.7)return closeSheet();
   let bi=0;sh.snaps.forEach((h,i)=>{if(Math.abs(h-vis)<Math.abs(sh.snaps[bi]-vis))bi=i;});snapTo(bi);
  };
  window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  $('#scrim').addEventListener('click',()=>{if(performance.now()-lastUp>250)closeSheet();});
  document.addEventListener('keydown',e=>{
   if(!sh.open)return;
   if(e.key==='Escape'){e.preventDefault();closeSheet();}
   if(e.key==='Tab'){const f=[...s.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);if(!f.length)return;
    const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}
  });
 }
 function banner(o){
  const b=$('#banner');b.innerHTML=`<span class="bi">${ic('clock')}</span><span><b>Delay on your route</b><span>${M[o.mode].n} is running ${o.d} min late</span></span>`;
  b.classList.add('on');
 }

 /* ---------- MAP hooks (filled once map.js is pasted) ---------- */
 let mapRAF=0;
 function mapCard(id){return `<div class="mapcard"><svg class="map" id="${id}" role="img" aria-label="Map of ${esc(S.trip.from)} to ${esc(S.trip.to)}"><title>Route map</title><desc>The steps are listed below as text.</desc></svg></div>`;}
 function mountMap(el,live){
  if(!window.LynkMap||!el)return;
  try{
   const c=el.parentNode,asp=c.offsetWidth&&c.offsetHeight?c.offsetWidth/c.offsetHeight:361/300;
   LynkMap.mount(el,{corridor:S.tripKey,size:'mobile',aspect:asp});
   LynkMap.routes(el,[{id:S.route.id,legs:live?S.legs:S.route.legs}],{active:S.route.id});
   LynkMap.pins(el,{from:S.trip.from,to:S.trip.to});
   if(!live)LynkMap.drawIn(el,S.route.legs);
  }catch(e){console.warn('map',e);}
 }
 function startMapLoop(){
  const el=$('#liveMap');if(!window.LynkMap||!el||!S.legs.length)return;
  try{LynkMap.routes(el,[{id:S.route.id,legs:S.legs}],{active:S.route.id});LynkMap.progress(el,S.legs,S.step);}catch(e){console.warn('map',e);}
 }
 function stopMapLoop(){const el=$('#liveMap');if(window.LynkMap&&el)try{LynkMap.stop(el)}catch(e){}}

 /* ---------- DETAILS ---------- */
 function stepLi(l,i,cls,btn){
  return `<li class="st m-${l[0]} ${cls||''}">${tileH(l[0])}<div class="bd"><h3>${esc(l[1])}</h3><p class="mt"><span class="num">${l[2]}</span> min · <span class="num">${rupee(l[3])}</span></p>${btn||''}</div></li>`;
 }
 function renderDetails(){
  const r=S.route,x=calc(r),T=S.trip;
  $('#detBody').innerHTML=`<h1 class="lt">${esc(r.name)}</h1><p class="lt-sub">${esc(T.from)} → ${esc(T.to)}</p>
   <div class="summ"><div class="tl2"><div class="hn num">${x.mins}<small>min</small></div><span>Arrive ${fmtT(x.mins)}</span></div><div class="tl2"><div class="hn num">${rH(x.cost)}</div><span>Total fare</span></div></div>
   <div style="margin-top:20px">${chainH(r.legs)}<div style="margin-top:10px">${ribH(r.legs,'thick')}</div></div>
   ${mapCard('detMap')}
   <div class="sl">Steps <em>${r.legs.length} step${r.legs.length>1?"s":""}</em></div>
   <ol class="tl">${r.legs.map((l,i)=>stepLi(l,i,'',`<button class="btn b-ghost b-sm" data-a="book" data-v="${l[0]}">${ACTION[l[0]]}</button>`)).join('')}</ol>`;
  mountMap($('#detMap'),false);
 }

 /* ---------- LIVE ---------- */
 let liveStep=-1;
 function renderLive(){
  const L=S.legs,n=L.length,first=cur!=='live',T=S.trip;
  const rem=sum(L.slice(S.step),l=>l[2])+S.delay;
  if(first||!$('#lvT')){
   liveStep=-1;
   $('#liveBody').innerHTML=`<h1 class="lt" id="lvT"></h1><p class="lt-sub">On your way to ${esc(T.to)}</p>
    <div class="live-h"><div class="eta" id="lvEta"></div><div class="arr">Arrive<b id="lvArr"></b></div></div>
    <div class="prog" id="prog" aria-hidden="true"></div>
    ${mapCard('liveMap')}
    <p class="vh" id="lvLive" aria-live="polite"></p>
    <ol class="tl livetl" id="lvTl"></ol>`;
   $('#liveBody').scrollTop=0;
  }
  $('#lvT').textContent=`Step ${S.step+1} of ${n}`;$('#liveCt').textContent=`Step ${S.step+1} of ${n}`;
  $('#lvEta').innerHTML=`${rem}<small>min left</small>`;$('#lvArr').textContent=fmtT(rem);
  $('#prog').innerHTML=L.map((l,i)=>`<i class="${i<S.step?'d':i===S.step?'a':''}" style="flex:${Math.max(l[2],3)}"></i>`).join('');
  const adv=S.step===liveStep+1&&liveStep>=0;
  $('#lvTl').innerHTML=L.map((l,i)=>{
   const cls=i<S.step?'done':i===S.step?'act':'up';
   const extra=(adv&&i===S.step?' go':'')+(adv&&i===S.step-1?' just':'');
   if(i<S.step)return `<li class="st m-${l[0]} ${cls}${extra}"><span class="tile">${ic('check')}</span><div class="bd"><h3>${esc(l[1])}</h3><p class="mt">Done · <span class="num">${l[2]}</span> min</p></div></li>`;
   return stepLi(l,i,cls+extra,i===S.step?`<button class="btn b-sun b-sm" style="width:100%" data-a="book" data-v="${l[0]}">${ACTION[l[0]]}</button>`:'');
  }).join('');
  $('#lvLive').textContent=`Step ${S.step+1} of ${n}: ${L[S.step][1]}`;
  $('#nextBtn').textContent=S.step===n-1?'I’ve arrived':'Done, next step';
  if(first)mountMap($('#liveMap'),true);
  liveStep=S.step;
  if(!first){const a=$('#lvTl .act'),sc=$('#liveBody');if(a){const top=a.offsetTop-sc.clientHeight/2+a.offsetHeight/2;sc.scrollTo({top:Math.max(0,top),behavior:RM()?'auto':'smooth'});}}
  if(cur==='live'||first)startMapLoop();
 }

 /* ---------- END ---------- */
 let prevRating=0;
 function endStars(anim){
  return [1,2,3,4,5].map(i=>`<button class="star ${S.rating>=i?'on':''} ${anim&&i>prevRating&&i<=S.rating?'f':''}" style="--d:${(i-prevRating-1)*50}ms" data-a="star" data-v="${i}" aria-label="${i} star${i>1?'s':''}" aria-pressed="${S.rating>=i}"><svg viewBox="0 0 24 24"><use href="#i-star"/></svg></button>`).join('');
 }
 function splitH(){
  const t=tripTotals(),per=Math.ceil(t.cost/S.people);
  return `<div class="stepper"><button data-a="ppl" data-v="-1" aria-label="Fewer people" ${S.people<=1?'disabled':''}>${ic('minus')}</button><span class="n" aria-live="polite" aria-label="${S.people} ${S.people>1?'people':'person'}">${S.people}</span><button data-a="ppl" data-v="1" aria-label="More people" ${S.people>=6?'disabled':''}>${ic('plus')}</button></div>
   <div class="ea">${S.people>1?`<b>${rH(per)}</b>each`:`<b>Just you</b>Add people to split`}</div>`;
 }
 const rateWord=['Tap a star','Poor','Fair','Good','Very good','Excellent'];
 function renderEnd(){
  if(cur==='end'&&$('#endStars')){
   $('#endStars').innerHTML=endStars(true)+`<span class="rate-l">${rateWord[S.rating]}</span>`;prevRating=S.rating;
   $$('#endTags .tag').forEach(b=>b.setAttribute('aria-pressed',S.tags.has(b.dataset.v)));
   const pOld=+($('#endSplit .n')||{}).textContent;$('#endSplit').innerHTML=splitH();if(pOld!==S.people&&!RM())$('#endSplit .n').classList.add('b');
   return;
  }
  prevRating=0;const t=tripTotals(),T=S.trip;
  const nt=S.rerouted?tileH('cab'):S.delay?`<span class="tile m-walk">${ic('clock')}</span>`:`<span class="tile m-auto">${ic('check')}</span>`;
  $('#endBody').innerHTML=`<h1 class="lt">You’ve arrived</h1><p class="lt-sub">${esc(T.from)} → ${esc(T.to)}</p>
   <div class="summ"><div class="tl2"><div class="hn num">${t.mins}<small>min</small></div><span>Total time</span></div><div class="tl2"><div class="hn num">${rH(t.cost)}</div><span>Total cost</span></div></div>
   <div style="margin-top:16px">${ribH(S.legs,'thick')}</div>
   <section class="card"><h3>Changes on this trip</h3><div class="chg">${nt}<p>${tripNote()}</p></div></section>
   <section class="card"><h3 id="rateL">How was this route?</h3><div class="stars" id="endStars" role="group" aria-labelledby="rateL">${endStars(false)}<span class="rate-l">${rateWord[S.rating]}</span></div>
    <div class="tags" id="endTags">${FEEDBACK_TAGS.map(g=>`<button class="tag" data-a="tag" data-v="${g}" aria-pressed="${S.tags.has(g)}">${ic('check')}${g}</button>`).join('')}</div></section>
   <section class="card"><h3>Split the fare</h3><div class="split" id="endSplit">${splitH()}</div></section>
   <button class="btn b-ghost wide" data-a="download">${ic('down')}Download route</button>`;
  $('#endBody').scrollTop=0;
 }

 /* ---------- RECENT ---------- */
 function renderRecent(){
  $('#recBody').innerHTML=HIST.length?`<div class="group">${HIST.map(recRow).join('')}</div>`:
  `<div class="emptyst"><svg viewBox="0 0 220 150" fill="none" stroke="var(--ink)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="178" cy="28" r="13" fill="var(--sun)"/>
    <path d="M22 44h150M40 44v58M154 44v58M30 44l10-10h114l10 10"/>
    <rect x="80" y="54" width="44" height="16" rx="8"/><circle cx="90" cy="62" r="2.2" fill="var(--ink)"/><path d="M96 62h8"/><rect x="108" y="58.5" width="10" height="7" rx="3.5"/>
    <path d="M58 92h36M62 92v10M90 92v10M58 86h36"/>
    <path d="M14 102h192M14 110h192"/>
    <path d="M14 124h192M14 134h192M30 120v18M58 120v18M86 120v18M114 120v18M142 120v18M170 120v18M198 120v18"/>
   </svg><h3>No trips yet</h3><p>No trips yet. Finish a journey and it shows up here.</p><button class="btn b-sun b-sm" data-a="nav" data-v="home">Plan a trip</button></div>`;
 }

 /* ---------- render dispatcher ---------- */
 function render(id,o={}){
  ({home:renderHome,results:renderResults,details:renderDetails,live:renderLive,end:renderEnd,recent:renderRecent}[id]||(()=>{}))(o);
 }

 function themeIcon(){
  const k={auto:'auto-t',dark:'moon',light:'sun'}[S.theme],lab={auto:'Theme: follows your phone',dark:'Theme: dark',light:'Theme: light'}[S.theme];
  $$('.thm').forEach(b=>{b.innerHTML=ic(k);b.setAttribute('aria-label',lab+'. Tap to change');});
  const dark=S.theme==='dark'||(S.theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  $$('meta[name=theme-color]').forEach(m=>m.content=dark?'#0F0E0C':'#FAF7F2');
 }
 function fit(){
  const w=$('#devwrap');if(innerWidth<=520){w.style.setProperty('--s',1);return;}
  w.style.setProperty('--s',Math.min(1,(innerHeight-40)/876).toFixed(4));
 }
 function clock(){const d=new Date();$('#clock').textContent=`${d.getHours()%12||12}:${String(d.getMinutes()).padStart(2,'0')}`;}

 return {go,render,sheet,closeSheet,toast,fields,setFields,remember,
  _:{back,edgeSwipe,headers,ptr,sheetDrag,banner,themeIcon,fit,clock,buzz,renderHome,segH,get cur(){return cur},get sh(){return sh},mountMap}};
})();
