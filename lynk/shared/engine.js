/* ============================================================
   LYNK shared engine v1.0 — data, scoring, state, trip logic.
   Both LYNK_mobile and LYNK_desktop paste this block verbatim.
   The UI layer must define a global `UI` object with:
     UI.go(screenId)                 // navigate
     UI.render(screenId)             // (re)render that screen
     UI.sheet(kind, data)            // open sheet: 'why' | 'reroute' | 'exit'
     UI.closeSheet()
     UI.toast(text)
     UI.fields()  -> {from, to}      // read the two inputs
     UI.setFields(from, to)
     UI.remember() -> boolean        // "Remember my modes" switch state
   Engine never touches the DOM except through UI.*
   ============================================================ */
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/* ---- modes: name, main colour, tint, dark colour, weather-tolerance (wx), mode comfort (m) ---- */
const M={
 walk:{n:'Walk',c:'#6F6A61',tint:'#ECE8E0',dark:'#A49E93',wx:80,m:60},
 metro:{n:'Metro',c:'#2F6FE0',tint:'#BEE2FE',dark:'#6AA6FF',wx:95,m:90},
 bus:{n:'Bus',c:'#E4572E',tint:'#FCDCCF',dark:'#FF8A66',wx:65,m:45},
 auto:{n:'Auto',c:'#2E9E5B',tint:'#D3F0DD',dark:'#5FD07F',wx:50,m:60},
 cab:{n:'Cab',c:'#6C4CE0',tint:'#E4DDFB',dark:'#A08BFF',wx:80,m:82}
};
const ACTION={metro:'Buy ticket',bus:'Track bus',auto:'Book auto',cab:'Book cab',walk:'Open in maps'};
const PARTNER={metro:'DMRC ticketing via ONDC',bus:'DTC live tracking',auto:'an ONDC auto partner',cab:'a ride-hail partner',walk:'your maps app'};
const TABS=[['cheap','Cheapest'],['fast','Fastest'],['conv','Convenient']];
const TAB_NAME={cheap:'cheapest',fast:'fastest',conv:'most convenient'};
const BEST_LABEL={cheap:'Best on cost',fast:'Best on time',conv:'Best for comfort'};
const FEEDBACK_TAGS=['Timings were off','Fare was different','Last mile was unclear'];

/* ---- sample data (illustrative, two pilot corridors). legs: [mode, title, minutes, rupees] ---- */
const TRIPS={
 dwarka:{from:'Dwarka Sec 21',to:'Connaught Place',cab:{mins:46,cost:420},routes:[
  {id:'m',name:'Metro direct',wait:4,rt:85,hist:90,traffic:96,area:90,seat:40,acc:70,legs:[['walk','Walk to Dwarka Sec 21 metro',4,0],['metro','Blue Line to Rajiv Chowk',38,60],['walk','Walk to Connaught Place',5,0]]},
  {id:'b',name:'Bus direct',wait:12,rt:55,hist:55,traffic:40,area:70,seat:45,acc:45,legs:[['walk','Walk to the bus stop',6,0],['bus','Bus towards Connaught Place',66,25],['walk','Walk to your stop',3,0]]},
  {id:'c',name:'Cab',wait:5,rt:70,hist:60,traffic:35,area:70,seat:95,acc:85,legs:[['cab','Cab from Dwarka Sec 21 to Connaught Place',46,420]]},
  {id:'bm',name:'Bus + Metro',wait:9,rt:68,hist:70,traffic:65,area:75,seat:45,acc:55,legs:[['walk','Walk to the bus stop',4,0],['bus','Bus to Janakpuri West',14,10],['metro','Blue Line to Rajiv Chowk',30,45],['walk','Walk to Connaught Place',5,0]]}
 ]},
 jahang:{from:'Jahangirpuri',to:'Majnu ka Tilla',cab:{mins:38,cost:340},routes:[
  {id:'m',name:'Metro + walk',wait:5,rt:85,hist:88,traffic:95,area:75,seat:45,acc:60,legs:[['walk','Walk to Jahangirpuri metro',4,0],['metro','Yellow Line to Vidhan Sabha',22,40],['walk','Walk to Majnu ka Tilla',12,0]]},
  {id:'ma',name:'Metro + auto',wait:8,rt:80,hist:80,traffic:80,area:70,seat:50,acc:65,legs:[['walk','Walk to Jahangirpuri metro',4,0],['metro','Yellow Line to Vidhan Sabha',22,40],['auto','Auto to Majnu ka Tilla',5,40]]},
  {id:'c',name:'Cab',wait:5,rt:70,hist:60,traffic:40,area:70,seat:95,acc:85,legs:[['cab','Cab from Jahangirpuri to Majnu ka Tilla',38,340]]},
  {id:'b',name:'Bus',wait:14,rt:55,hist:55,traffic:40,area:65,seat:40,acc:45,legs:[['walk','Walk to the bus stop',5,0],['bus','Bus towards Majnu ka Tilla',55,15],['walk','Walk to your stop',8,0]]}
 ]}
};

/* ---- scoring (weights from the research; do not change) ---- */
function lin(x,p){ if(x<=p[0][0])return p[0][1]; for(let i=1;i<p.length;i++){ if(x<=p[i][0]){const[a,b]=[p[i-1],p[i]];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);} } return p[p.length-1][1]; }
function calc(r,legs=r.legs){
  const mins=sum(legs,l=>l[2]), cost=sum(legs,l=>l[3]);
  const transit=legs.filter(l=>l[0]!=='walk'), transfers=Math.max(0,transit.length-1);
  const walkM=sum(legs.filter(l=>l[0]==='walk'),l=>l[2])*80;
  const wx=sum(legs,l=>M[l[0]].wx*l[2])/mins;
  const xfer=Math.max(10,100-28*transfers-(walkM>600?10:0));
  const rel=[['Live status accuracy',r.rt,30],['Past punctuality',r.hist,20],['Traffic',r.traffic,20],['Transfer risk',xfer,15],['Weather',wx,10],['Area risk',r.area,5]];
  const tS=[100,70,35,10][Math.min(3,transfers)];
  const wS=lin(walkM,[[0,100],[300,100],[600,75],[1000,40],[1600,10]]);
  const waS=lin(r.wait,[[0,100],[5,100],[15,65],[30,20]]);
  const mm=sum(transit,l=>l[2]); const mS=mm?sum(transit,l=>M[l[0]].m*l[2])/mm:60;
  const con=[['Number of transfers',tS,30],['Walking distance',wS,20],['Waiting time',waS,20],['Seat comfort',r.seat,10],['Mode comfort',mS,10],['Accessibility',r.acc,10]];
  const score=a=>Math.round(sum(a,x=>x[1]*x[2])/100);
  const tr=r.traffic>=85?'Low':r.traffic>=65?'Medium':'High';
  return {mins,cost,transfers,walkM,rel,con,R:score(rel),C:score(con),traffic:tr};
}
/* deterministic 7-day on-time series for the sparkline, derived from past punctuality */
function sparkData(r){ const out=[]; for(let i=0;i<7;i++){ const n=Math.sin(i*2.1+r.hist)*7+Math.cos(i*0.7)*4; out.push(clamp(Math.round(r.hist+n),30,100)); } return out; }
const col=v=>v>=80?'#1E9E62':v>=60?'#D99A00':'#D9483B';
const fmtT=m=>new Date(Date.now()+m*60000).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
const INR=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
const rupee=n=>n?INR.format(n):'Free';

/* ---- persistent state ---- */
const ls={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const S={trip:null,tripKey:null,tab:'cheap',avoid:new Set(ls.get('lynk_avoid',[])),showAll:false,route:null,legs:[],step:0,rerouted:false,saved:0,delay:0,delayMode:'',rating:0,tags:new Set(),people:1,addedCost:0,pend:null,view:'',theme:ls.get('lynk_theme','auto'),hover:null};
let HIST=ls.get('lynk_hist',[
  {from:'Dwarka Sec 21',to:'Connaught Place',mins:43,cost:60,modes:'Walk · Metro · Walk',when:'Yesterday'},
  {from:'Jahangirpuri',to:'Majnu ka Tilla',mins:31,cost:80,modes:'Walk · Metro · Auto',when:'Mon'}
]);

/* ---- pure logic ---- */
function matchTrip(f,t){
  const s=(f+' '+t).toLowerCase();
  if(/dwarka/.test(s)&&/(connaught|rajiv|\bcp\b)/.test(s))return 'dwarka';
  if(/jahangir/.test(s)&&/majnu/.test(s))return 'jahang';
  return null;
}
function hidden(r,x){ const bad=r.legs.find(l=>l[0]!=='walk'&&S.avoid.has(l[0])); if(bad)return M[bad[0]].n; if(S.avoid.has('walk')&&x.walkM>600)return 'Long walks'; return null; }
/* ranked results for the current trip/tab: {ok:[{r,x}], out:[{r,x}]} */
function ranked(){
  const all=S.trip.routes.map(r=>({r,x:calc(r)}));
  const key={cheap:(a,b)=>a.x.cost-b.x.cost||a.x.mins-b.x.mins,fast:(a,b)=>a.x.mins-b.x.mins,conv:(a,b)=>b.x.C-a.x.C}[S.tab];
  return {ok:all.filter(o=>!hidden(o.r,o.x)).sort(key),out:all.filter(o=>hidden(o.r,o.x))};
}
function avoidNames(){ return [...S.avoid].map(m=>m==='walk'?'long walks':M[m].n.toLowerCase()); }
function rerouteOffer(){
  const l=S.legs[S.step]; if(S.step!==1||S.rerouted||S.delay||S.legs.length<3||!['metro','bus'].includes(l[0]))return null;
  const rem=sum(S.legs.slice(S.step),q=>q[2]), d=l[0]==='metro'?6:9, nm=Math.max(10,Math.round(rem*.7)), nc=Math.round(S.trip.cab.cost*.75/10)*10;
  const old=sum(S.legs.slice(S.step),q=>q[3]);
  return S.pend={d,nm,nc,rem,mode:l[0],extra:nc-old,oldTotal:rem+d};
}
function tripTotals(){ return {mins:sum(S.legs,l=>l[2])+S.delay,cost:sum(S.legs,l=>l[3])}; }
function tripNote(){
  if(S.rerouted)return `You switched to a cab at step 2. It saved about ${S.saved} min and added ₹${S.addedCost}.`;
  if(S.delay)return `You kept the original route. The ${S.delayMode} ran ${S.delay} min late.`;
  return 'No changes. You followed the suggested route.';
}
function routeText(){
  const T=S.trip,L=S.legs.length?S.legs:S.route.legs;
  return `LYNK route: ${T.from} to ${T.to}\n`+L.map((l,i)=>`${i+1}. ${l[1]} (${M[l[0]].n}, ${l[2]} min, ${rupee(l[3])})`).join('\n')+`\n\nTotal: ${sum(L,l=>l[2])} min, ${rupee(sum(L,l=>l[3]))}\nSample data, not live.`;
}
function download(){
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([routeText()],{type:'text/plain'}));a.download='lynk-route.txt';a.click();UI.toast('Route saved as a text file');}catch(e){UI.toast('Download is not available here');}
}

/* ---- actions: every [data-a] button maps here; UI adds its own on top via Object.assign(A,{...}) ---- */
const A={
 go:d=>UI.go(d.v),
 sug:d=>{const t=TRIPS[d.v];UI.setFields(t.from,t.to);},
 swap:()=>{const f=UI.fields();UI.setFields(f.to,f.from);},
 mode:d=>{S.avoid.has(d.v)?S.avoid.delete(d.v):S.avoid.add(d.v);UI.render('home');},
 find:()=>{
   const f=UI.fields(), k=matchTrip(f.from,f.to);
   if(!k){UI.toast('This pilot only covers two corridors so far. Tap one of the suggestions.');UI.render('home',{nomatch:true});return;}
   S.tripKey=k;S.trip=TRIPS[k];S.tab='cheap';S.showAll=false;
   if(UI.remember())ls.set('lynk_avoid',[...S.avoid]);
   UI.render('results');UI.go('results');
 },
 tab:d=>{S.tab=d.v;UI.render('results',{resort:true});},
 all:()=>{S.showAll=!S.showAll;UI.render('results');},
 why:d=>UI.sheet('why',{r:S.trip.routes.find(q=>q.id===d.v)}),
 closeSheet:()=>UI.closeSheet(),
 pick:d=>{S.route=S.trip.routes.find(r=>r.id===d.v);S.legs=S.route.legs.map(l=>[...l]);S.step=0;UI.render('details');UI.go('details');},
 book:d=>UI.toast(`In the full app this opens ${PARTNER[d.v]}.`),
 download,
 start:()=>{Object.assign(S,{step:0,rerouted:false,delay:0,saved:0,addedCost:0,rating:0,tags:new Set(),people:1,pend:null});S.legs=S.route.legs.map(l=>[...l]);UI.render('live');UI.go('live');},
 next:()=>{ if(S.step<S.legs.length-1){S.step++;UI.render('live');const o=rerouteOffer();if(o)UI.sheet('reroute',o);} else {UI.render('end');UI.go('end');} },
 keep:()=>{S.delay=S.pend.d;S.delayMode=M[S.pend.mode].n.toLowerCase();UI.closeSheet();UI.toast('Okay, keeping your route.');},
 reroute:()=>{const p=S.pend;S.legs=S.legs.slice(0,S.step).concat([['cab','Cab from here to '+S.trip.to,p.nm,p.nc]]);S.rerouted=true;S.saved=p.rem+p.d-p.nm;S.addedCost=p.extra;UI.closeSheet();UI.render('live');},
 exit:()=>UI.sheet('exit',{}),
 exitYes:()=>{UI.closeSheet();UI.go('home');},
 star:d=>{S.rating=+d.v;UI.render('end');},
 tag:d=>{S.tags.has(d.v)?S.tags.delete(d.v):S.tags.add(d.v);UI.render('end');},
 ppl:d=>{S.people=clamp(S.people+(+d.v),1,6);UI.render('end');},
 finish:()=>{
   const t=tripTotals();
   HIST.unshift({from:S.trip.from,to:S.trip.to,mins:t.mins,cost:t.cost,modes:S.legs.map(l=>M[l[0]].n).join(' · '),when:'Today'});HIST=HIST.slice(0,8);ls.set('lynk_hist',HIST);
   UI.toast('Thanks, your feedback helps fix route accuracy.');UI.render('recent');UI.go('recent');
 },
 reuse:d=>{const h=HIST[+d.v];UI.go('home');UI.setFields(h.from,h.to);},
 theme:()=>{S.theme={auto:'dark',dark:'light',light:'auto'}[S.theme];ls.set('lynk_theme',S.theme);document.documentElement.dataset.theme=S.theme;}
};
document.documentElement.dataset.theme=S.theme;
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a]){e.preventDefault();A[b.dataset.a](b.dataset,b);}});
