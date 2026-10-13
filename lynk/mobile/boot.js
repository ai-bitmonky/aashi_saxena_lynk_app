/* ============ LYNK mobile: UI actions + boot (after engine) ============ */
(()=>{
 const U=UI._;
 const engKeep=A.keep,engNext=A.next, engSug=A.sug, engSwap=A.swap, engTheme=A.theme, engFind=A.find;
 Object.assign(A,{
  nav:d=>{U.buzz();const t=document.querySelectorAll(`.tab[data-v="${d.v}"]`);t.forEach(b=>{b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');});UI.go(d.v);},
  back:()=>U.back(),
  remember:(d,b)=>{const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);U.buzz();if(on)ls.set('lynk_avoid',[...S.avoid]);},
  sug:(d,b)=>{engSug(d);U.buzz();['#from','#to'].forEach(s=>{const e=document.querySelector(s);e.animate&&e.animate([{opacity:.2,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.05,.7,.1,1)'});});},
  swap:(d,b)=>{engSwap(d);b.classList.toggle('spin');U.buzz();},
  mode:d=>{S.avoid.has(d.v)?S.avoid.delete(d.v):S.avoid.add(d.v);U.buzz();UI.render('home');},
  find:()=>{document.activeElement&&document.activeElement.blur&&document.activeElement.blur();engFind();},
  tab:d=>{if(d.v===S.tab)return;U.buzz();S.tab=d.v;UI.render('results',{resort:true});},
  all:()=>{S.showAll=!S.showAll;UI.render('results');},
  next:()=>{U.buzz();engNext();},
  keep:()=>{engKeep();UI.render('live');},
  theme:()=>{engTheme();U.themeIcon();UI.toast({auto:'Theme follows your phone',dark:'Dark theme on',light:'Light theme on'}[S.theme]);},
  ppl:d=>{S.people=clamp(S.people+(+d.v),1,6);U.buzz();UI.render('end');},
  star:d=>{S.rating=+d.v;U.buzz();UI.render('end');}
 });
 /* re-route: banner drops first, then sheet rises */
 const sheetRaw=UI.sheet;
 UI.sheet=(kind,data)=>{
  if(kind==='reroute'){U.banner(data);setTimeout(()=>sheetRaw(kind,data),matchMedia('(prefers-reduced-motion: reduce)').matches?0:520);}
  else sheetRaw(kind,data);
 };

 /* keyboard */
 document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches('#from')){e.preventDefault();document.querySelector('#to').focus();}
  else if(e.key==='Enter'&&e.target.matches('#to')){e.preventDefault();A.find();}
  if(e.target.closest('#seg')&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){
   const i=TABS.findIndex(t=>t[0]===S.tab),j=(i+(e.key==='ArrowRight'?1:2))%3;A.tab({v:TABS[j][0]});document.querySelector('#tab-'+TABS[j][0]).focus();}
  if(e.key==='Escape'&&!U.sh.open)U.back();
  if((e.key===' '||e.key==='Enter')&&e.target.matches('.rc[data-a]')){e.preventDefault();e.target.click();}
 });
 document.getElementById('remRow').addEventListener('click',e=>{if(!e.target.closest('.sw'))document.getElementById('remember').click();});
 /* card press: pointer focus tabindex */
 new MutationObserver(()=>document.querySelectorAll('.rc[data-a]:not([tabindex])').forEach(c=>c.tabIndex=0)).observe(document.getElementById('resCards'),{childList:true});

 U.edgeSwipe();U.headers();U.ptr();U.sheetDrag();
 U.fit();addEventListener('resize',U.fit);
 U.clock();setInterval(U.clock,15000);
 U.themeIcon();
 matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',U.themeIcon);
 UI.render('home');
})();
