/* ============================================================
   LYNK map module v1.0 — stylised inline-SVG transit map (Delhi NCR).
   No dependencies, no external resources. Paste verbatim.
   window.LynkMap = {mount, routes, drawIn, progress, stop, pins, LEG_PATHS}
   Themes itself via CSS vars: --bg --surface --line --ink --ink-2 --ink-3 --sun
   Optional route colour overrides: --m-walk --m-metro --m-bus --m-auto --m-cab
   ============================================================ */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const LC={Y:'#FFC20E',B:'#0067B1',R:'#E2231A',A:'#F28C28'};
const DEF={walk:'#6F6A61',metro:'#2F6FE0',bus:'#E4572E',auto:'#2E9E5B',cab:'#6C4CE0'};
const mcol=m=>(typeof M!=='undefined'&&M&&M[m]&&M[m].c)||DEF[m]||DEF.walk;
const RM=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const ST=new WeakMap();let UID=0;
const r1=n=>Math.round(n*10)/10;
const EASE='cubic-bezier(.65,0,.35,1)';

/* Catmull-Rom spline through P[a..b]; outer neighbours set the end tangents,
   so a slice sits exactly on its parent line/road. */
function cr(P,a,b){a=a||0;b=b==null?P.length-1:b;
 let d='M'+r1(P[a][0])+','+r1(P[a][1]);
 for(let i=a;i<b;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;
  d+='C'+r1(p1[0]+(p2[0]-p0[0])/6)+','+r1(p1[1]+(p2[1]-p0[1])/6)+' '+r1(p2[0]-(p3[0]-p1[0])/6)+','+r1(p2[1]-(p3[1]-p1[1])/6)+' '+r1(p2[0])+','+r1(p2[1]);}
 return d;}
/* closed smooth blob (parks) */
function blob(cx,cy,rx,ry,s){const P=[];for(let i=0;i<8;i++){const a=i/8*6.283+s,j=1+.12*Math.sin(i*2.3+s*5);P.push([cx+Math.cos(a)*rx*j,cy+Math.sin(a)*ry*j]);}
 const Q=[P[7]].concat(P,[P[0],P[1]]);return cr(Q,1,9)+'Z';}
const S=(p,a,b)=>({p,a,b});              // slice of a parent polyline
const dOf=s=>Array.isArray(s)?cr(s):cr(s.p,s.a,s.b);
const ptsOf=s=>Array.isArray(s)?s:s.p.slice(s.a,s.b+1);

/* ---------------- corridor geometry (1000 x 700 space) ---------------- */
/* (a) Dwarka Sec 21 -> Connaught Place  (line/road ends run far off-canvas so any crop looks continuous) */
const dBL=[[120,430],[178,416],[235,402],[330,380],[440,352],[518,326],[605,306],[720,300],[805,312],[895,328],[1300,352]];
const dYL=[[660,-300],[698,80],[705,160],[712,232],[720,300],[727,365],[735,430],[745,520],[725,590],[690,640],[640,1000]];
const dAX=[[120,430],[150,520],[240,598],[365,622],[470,560],[560,440],[640,325],[712,232]];
const dR1=[[-300,540],[150,472],[245,446],[338,414],[440,392],[540,368],[630,346],[700,330],[748,304]];
const dR2=[[-300,440],[92,478],[150,512],[260,538],[380,552],[470,552],[590,500],[680,432],[740,352],[764,306]];
const dORR=[[270,-300],[310,130],[322,270],[330,380],[338,414],[352,480],[380,552],[420,1000]];
const dFROM=[92,478],dTO=[770,268];
/* (b) Jahangirpuri -> Majnu ka Tilla */
const jYL=[[490,-300],[512,40],[520,90],[527,150],[534,205],[541,255],[548,295],[558,335],[572,388],[595,450],[608,520],[618,600],[640,1000]];
const jRL=[[-300,525],[150,492],[300,474],[420,462],[505,456],[595,450],[700,446],[800,440],[910,432],[1300,412]];
const jGTK=[[420,-300],[466,50],[478,105],[492,182],[496,270],[490,360],[470,460],[410,1000]];
const jRR=[[-300,214],[200,206],[400,194],[492,182],[540,178],[600,186],[648,222],[664,280],[666,340],[660,420],[672,500],[700,610],[760,1000]];
const jORR=[[200,-300],[420,30],[490,55],[545,64],[600,96],[636,150],[648,222]];
const jMALL=[[-300,380],[220,366],[420,356],[520,348],[600,342],[640,330],[666,316]];
const jMN=[[300,276],[420,272],[541,270],[600,256],[640,264],[664,280]];
const jFROM=[490,55],jTO=[684,300];
/* labels: [text, x, y, dx, dy, anchor, major]  — (x,y) = the station, (dx,dy) = offset in screen px (scaled per view) */
const C={
 dwarka:{name:'Dwarka Sec 21 to Connaught Place',from:dFROM,to:dTO,
  river:[[1000,-300],[952,150],[934,320],[950,480],[1010,1000]],
  parks:[[600,618,58,34,.4,'Deer Park'],[842,505,46,30,1.1,'Lodhi Garden'],[612,200,40,26,2.2,''],[160,300,44,28,3,'']],
  roads:[dR1,dR2,dORR,[[764,246],[772,160],[800,-300]],[[794,276],[880,270],[1300,250]],[[764,306],[772,420],[800,560],[830,1000]]],
  minor:[2,3,4],ring:[764,276,30],
  lines:[{c:'A',p:dAX,st:[2,3,4]},{c:'B',p:dBL,st:[2,3,4,5,6,8,9]},{c:'Y',p:dYL,st:[1,2,6,7,8,9]}],
  ic:[[120,430],[720,300],[712,232]],
  paths:{walk1:[dFROM,[100,452],[120,430]],metro:S(dBL,0,7),walk2:[[720,300],[745,282],dTO],
   walkBus:[dFROM,[121,470],[150,472]],bus:S(dR1,1,8),walkBus2:[[748,304],[762,288],dTO],
   cab:S(dR2.concat([dTO]),1,10),busJ:[[150,472],[245,446],[338,414],[330,380]],metroJ:S(dBL,3,7),
   cabFromHere:[[440,352],[440,392],[540,368],[630,346],[700,330],[748,304],dTO]},
  reroads:[dR1.slice(1).concat([dTO]),dR2.slice(1).concat([dTO])],
  labels:[['Dwarka Sec 21',120,430,-9,-8,'end',1],['Dwarka Mor',235,402,0,-11,'middle',0],['Janakpuri West',330,380,-2,-11,'end',1],
   ['Rajouri Garden',440,352,0,-11,'middle',0],['Rajendra Place',518,326,0,-11,'middle',0],['Karol Bagh',605,306,0,-11,'middle',0],
   ['Rajiv Chowk',720,300,13,17,'start',1],['Connaught Place',794,270,6,4,'start',1],['New Delhi',712,232,-11,-3,'end',0],
   ['Mandi House',805,312,0,17,'middle',0],['Indraprastha',895,328,0,17,'middle',0],
   ['Chandni Chowk',698,80,10,3,'start',0],['Chawri Bazar',705,160,10,3,'start',0],['Central Secretariat',735,430,10,3,'start',0],
   ['INA',745,520,10,3,'start',0],['AIIMS',725,590,10,3,'start',0],['Hauz Khas',690,640,10,3,'start',0],
   ['IGI Airport T3',240,598,0,18,'middle',0],['Aerocity',365,622,0,18,'middle',0],['Dhaula Kuan',470,560,10,4,'start',0]],
  roadLabels:[['NH 48',470,592,-20],['OUTER RING RD',316,190,85]],
  water:['Yamuna',958,250,-82]},
 jahang:{name:'Jahangirpuri to Majnu ka Tilla',from:jFROM,to:jTO,align:'xMidYMin',
  river:[[830,-300],[772,90],[742,200],[736,300],[748,400],[742,500],[768,610],[830,1000]],
  parks:[[392,300,54,38,.7,'Kamla Nehru Ridge'],[880,250,52,64,1.9,''],[300,600,46,30,2.6,''],[640,40,40,24,1.3,'']],
  roads:[jRR,jGTK,jORR,jMALL,jMN,[[800,-300],[818,200],[812,420],[860,1000]]],
  minor:[4,5],
  lines:[{c:'R',p:jRL,st:[2,3,4,7,8]},{c:'Y',p:jYL,st:[1,2,3,4,5,6,7,8,10,11]}],
  ic:[[595,450]],
  paths:{walk1:[jFROM,[506,70],[520,90]],metro:S(jYL,2,7),walk2:[[558,335],[622,320],jTO],
   auto:[[558,335],[600,342],[640,330],[666,316],jTO],walkBus:[jFROM,[480,80],[478,105]],
   bus:[[478,105],[492,182],[540,178],[600,186],[648,222]],walkBus2:[[648,222],[674,262],jTO],
   cab:S(jORR.concat([[664,280],jTO]),2,8),cabFromHere:[[534,205],[540,178],[600,186],[648,222],[664,280],jTO]},
  reroads:[jMN.slice(2).concat([jTO]),jRR.slice(4,8).concat([jTO]),jMALL.slice(4).concat([jTO])],
  labels:[['Haiderpur Badli Mor',512,40,10,3,'start',0],['Jahangirpuri',520,90,11,4,'start',1],['Adarsh Nagar',527,150,10,3,'start',0],
   ['Azadpur',534,205,10,14,'start',0],['Model Town',541,255,-10,3,'end',0],['GTB Nagar',548,295,-10,3,'end',0],
   ['Vidhan Sabha',558,335,-11,4,'end',1],['Civil Lines',572,388,10,3,'start',0],['Kashmere Gate',595,450,12,17,'start',0],
   ['Tis Hazari',505,456,0,17,'middle',0],['Pul Bangash',420,462,0,17,'middle',0],['Shastri Nagar',300,474,0,17,'middle',0],
   ['Shastri Park',800,440,0,17,'middle',0],['Seelampur',910,432,0,17,'middle',0],
   ['Chandni Chowk',608,520,10,3,'start',0],['Chawri Bazar',618,600,10,3,'start',0],['Majnu ka Tilla',684,300,12,4,'start',1]],
  roadLabels:[['RING RD',300,201,-2],['GT KARNAL RD',494,316,-88],['OUTER RING RD',372,22,26],['MALL RD',300,363,-2]],
  water:['Yamuna',762,150,-75]}
};
/* leg -> path ids, matching TRIPS[corridor].routes[i].legs in count and order */
const LEG_PATHS={
 dwarka:{m:['walk1','metro','walk2'],b:['walkBus','bus','walkBus2'],c:['cab'],bm:['walkBus','busJ','metroJ','walk2'],cabFromHere:'cabFromHere'},
 jahang:{m:['walk1','metro','walk2'],ma:['walk1','metro','auto'],c:['cab'],b:['walkBus','bus','walkBus2'],cabFromHere:'cabFromHere'}
};

/* ---------------- helpers ---------------- */
function el(t,a,p){const e=document.createElementNS(NS,t);if(a)for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
const sig=legs=>(legs||[]).map(l=>l[0]+':'+l[1]).join('|');
function css(id,k,mob){const q='[data-lm="'+id+'"] ',n=v=>r1(v*k);
 return `${q}{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-user-select:none;user-select:none}
${q}.bg{fill:var(--bg,#FAF7F2)}
${q}.gr{fill:none;stroke:var(--line,#E6DFD3);stroke-width:${n(.75)};opacity:.5}
${q}.rvb{fill:none;stroke:color-mix(in srgb,#3D8CC4 34%,var(--bg,#FAF7F2));stroke-linecap:round;stroke-linejoin:round}
${q}.rv{fill:none;stroke:color-mix(in srgb,#5AA6D6 22%,var(--bg,#FAF7F2));stroke-linecap:round;stroke-linejoin:round}
${q}.pk{fill:color-mix(in srgb,#3FA66A 17%,var(--bg,#FAF7F2))}
${q}.rd path,${q}.rd circle{fill:none;stroke-linecap:round;stroke-linejoin:round}
${q}.rc{stroke:var(--line,#E6DFD3);stroke-width:${n(9)}}${q}.rf{stroke:var(--surface,#fff);stroke-width:${n(7)}}
${q}.rcm{stroke:var(--line,#E6DFD3);stroke-width:${n(5.5)}}${q}.rfm{stroke:var(--surface,#fff);stroke-width:${n(3.5)}}
${q}.mt path{fill:none;stroke-linecap:round;stroke-linejoin:round}
${q}.mc{stroke:var(--surface,#fff);stroke-width:${n(10)}}${q}.ml{stroke-width:${n(5)}}
${q}.st{fill:var(--surface,#fff);stroke-width:${n(2)}}
${q}.ic{fill:var(--surface,#fff);stroke:var(--ink,#0E0E0F);stroke-width:${n(1.6)}}
${q}.rt{transition:opacity .22s cubic-bezier(.2,0,0,1);cursor:pointer}
${q}.rt.dim{opacity:.35}${q}.rt.fade{opacity:.25}${q}.rt.hov{opacity:1}
${q}.leg path{fill:none;stroke-linecap:round;stroke-linejoin:round;transition:stroke-width .2s cubic-bezier(.2,0,0,1)}
${q}.leg .cs{stroke:var(--surface,#fff);stroke-width:${n(7.5)}}${q}.leg .ln{stroke-width:${n(4)}}
${q}.leg-metro .cs{stroke-width:${n(9)}}${q}.leg-metro .ln{stroke-width:${n(6)}}
${q}.leg-walk .ln{stroke:var(--ink-3,#8A857B);stroke-width:${n(3)};stroke-dasharray:0 ${n(6)}}
${q}.rt.hov .leg .cs{stroke-width:${n(11)}}${q}.rt.hov .leg .ln{stroke-width:${n(7)}}
${q}.rt.hov .leg-metro .cs{stroke-width:${n(12)}}${q}.rt.hov .leg-metro .ln{stroke-width:${n(8)}}
${q}.rt.hov .leg-walk .ln{stroke-width:${n(4)}}
${q}.veh{display:none}${q}.veh.on{display:inline}
${q}.lb{font-size:${n(9.5)}px;font-weight:600;fill:var(--ink,#0E0E0F);paint-order:stroke;stroke:var(--bg,#FAF7F2);stroke-width:${n(3)};stroke-linejoin:round;letter-spacing:.01em}
${q}.lb.mi{fill:var(--ink-2,#4A4740)}
${q}.lr{font-size:${n(6.5)}px;font-weight:600;fill:var(--ink-3,#8A857B);letter-spacing:.09em;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:${n(1.5)}}
${q}.lp{font-size:${n(8.5)}px;font-style:italic;font-weight:500;fill:color-mix(in srgb,#2E9E5B 60%,var(--ink,#0E0E0F))}
${q}.lw{font-size:${n(10)}px;font-style:italic;font-weight:500;letter-spacing:.25em;fill:color-mix(in srgb,#2B78B0 70%,var(--ink,#0E0E0F))}
${q}.hid{display:none}`;}

/* ---------------- mount ---------------- */
function mount(svg,o){o=o||{};stop(svg);
 const c=C[o.corridor]?o.corridor:'dwarka',D=C[c],mob=o.size==='mobile';
 const id='lm'+(++UID);
 const r=svg.getBoundingClientRect?svg.getBoundingClientRect():{width:0,height:0};
 const W=r.width||(mob?393:1000),H=r.height||(mob?300:700),A=o.aspect||(r.width&&r.height?W/H:mob?393/300:10/7);
 let vb=[0,0,1000,700],k=1;
 if(mob){
  /* fit corridor bbox (+ major labels, + padding) to the panel aspect; k = user units per screen px */
  let b0=[1e9,1e9,-1e9,-1e9];const add=(b,x,y)=>{b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);};
  for(const pid in D.paths)ptsOf(D.paths[pid]).forEach(p=>add(b0,p[0],p[1]));add(b0,D.from[0],D.from[1]);add(b0,D.to[0],D.to[1]);
  const pad=o.pad!=null?o.pad:60;
  const fit=b=>{let w=b[2]-b[0]+2*pad,h=b[3]-b[1]+2*pad,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;if(w/h<A)w=h*A;else h=w/A;return[cx-w/2,cy-h/2,w,h];};
  vb=fit(b0);
  for(let it=0;it<3;it++){k=vb[2]/W;const b=b0.slice();
   D.labels.forEach(L=>{if(!L[6])return;const fs=9.5*k,w=L[0].length*fs*.58,x=L[1]+L[3]*k,y=L[2]+L[4]*k,an=L[5];
    const lx=an==='end'?x-w:an==='middle'?x-w/2:x;add(b,lx-pad+14*k,y-fs);add(b,lx+w+pad-14*k,y+3*k);});
   vb=fit(b);}
  k=vb[2]/W;vb=vb.map(r1);
 }
 const n=v=>r1(v*k);
 svg.setAttribute('viewBox',vb.join(' '));
 svg.setAttribute('preserveAspectRatio',(mob?'xMidYMid':D.align||'xMidYMid')+' slice');
 svg.setAttribute('data-lm',id);svg.setAttribute('role','img');svg.setAttribute('aria-label','Map: '+D.name);
 let h='<title>'+D.name+'</title><desc>Stylised transit map with metro lines, main roads and the planned route.</desc>';
 h+='<style>'+css(id,k,mob)+'</style><defs><pattern id="'+id+'g" width="50" height="50" patternUnits="userSpaceOnUse"><path class="gr" d="M50 0H0V50"/></pattern>'+
  '<filter id="'+id+'s" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="'+n(1.2)+'" stdDeviation="'+n(1.6)+'" flood-color="#0E0E0F" flood-opacity=".32"/></filter></defs>';
 h+='<g class="ground"><rect class="bg" x="-600" y="-600" width="2200" height="1900"/><rect x="-600" y="-600" width="2200" height="1900" fill="url(#'+id+'g)"/></g>';
 const rd=cr(D.river);h+='<g class="river"><path class="rvb" d="'+rd+'" stroke-width="74"/><path class="rv" d="'+rd+'" stroke-width="70"/></g>';
 h+='<g class="parks">'+D.parks.map(p=>'<path class="pk" d="'+blob(p[0],p[1],p[2],p[3],p[4])+'"/>').join('')+'</g>';
 let rc='',rf='';D.roads.forEach((p,i)=>{const m=D.minor.indexOf(i)>=0,d=cr(p);rc+='<path class="'+(m?'rcm':'rc')+'" d="'+d+'"/>';rf+='<path class="'+(m?'rfm':'rf')+'" d="'+d+'"/>';});
 if(D.ring){const g=D.ring;rc+='<circle class="rc" cx="'+g[0]+'" cy="'+g[1]+'" r="'+g[2]+'"/>';rf+='<circle class="rf" cx="'+g[0]+'" cy="'+g[1]+'" r="'+g[2]+'"/><circle class="pk" cx="'+g[0]+'" cy="'+g[1]+'" r="'+(g[2]-n(6))+'"/>';}
 h+='<g class="rd">'+rc+rf+'<!--RL--></g>';
 h+='<g class="mt">'+D.lines.map(L=>'<path class="mc" d="'+cr(L.p)+'"/>').join('')+D.lines.map(L=>'<path class="ml" stroke="'+LC[L.c]+'" d="'+cr(L.p)+'"/>').join('')+'</g>';
 h+='<g class="sts">'+D.lines.map(L=>L.st.map(i=>'<circle class="st" stroke="'+LC[L.c]+'" cx="'+L.p[i][0]+'" cy="'+L.p[i][1]+'" r="'+n(3.5)+'"/>').join('')).join('')+
  D.ic.map(p=>'<rect class="ic" x="'+r1(p[0]-n(7))+'" y="'+r1(p[1]-n(4))+'" width="'+n(14)+'" height="'+n(8)+'" rx="'+n(4)+'"/>').join('')+'</g>';
 h+='<g class="routes"></g><g class="vehs"><g class="veh"><circle r="'+n(7)+'" stroke="#fff" stroke-width="'+n(2)+'" filter="url(#'+id+'s)"/><path d="M'+n(-2.2)+','+n(-3)+'L'+n(1.8)+',0L'+n(-2.2)+','+n(3)+'" fill="none" stroke="#fff" stroke-width="'+n(1.7)+'" stroke-linecap="round" stroke-linejoin="round"/></g></g><g class="pins"></g>';
 let lb='';
 D.parks.forEach(p=>{if(p[5]&&!mob)lb+='<text class="lp" x="'+p[0]+'" y="'+(p[1]+3)+'" text-anchor="middle">'+p[5]+'</text>';});
 if(D.water)lb+='<text class="lw" data-major="0" text-anchor="middle" transform="translate('+D.water[1]+' '+D.water[2]+') rotate('+D.water[3]+')">'+D.water[0]+'</text>';
 let rl='';if(!mob||k<1.3)D.roadLabels.forEach(L=>{rl+='<text class="lr" text-anchor="middle" dy="'+n(2.3)+'" transform="translate('+L[1]+' '+L[2]+') rotate('+L[3]+')">'+L[0]+'</text>';});
 const sorted=D.labels.slice().sort((a,b)=>b[6]-a[6]);
 sorted.forEach(L=>{lb+='<text class="lb'+(L[6]?'':' mi')+'" data-major="'+L[6]+'" x="'+r1(L[1]+L[3]*k)+'" y="'+r1(L[2]+L[4]*k)+'" text-anchor="'+L[5]+'">'+L[0]+'</text>';});
 h=h.replace('<!--RL-->',rl);h+='<g class="labels">'+lb+'</g>';
 svg.innerHTML=h;
 const s={c,D,k,id,mob,vb,gR:svg.querySelector('.routes'),veh:svg.querySelector('.veh'),gP:svg.querySelector('.pins'),routes:{},key:'',active:null,hover:null,raf:0,prog:null,anims:[]};
 ST.set(svg,s);
 declutter(svg);
 return s;}

/* hide minor labels that collide with a kept label (majors always kept) */
function declutter(svg){const kept=[];
 const T=[...svg.querySelectorAll('.labels .lb')].concat([...svg.querySelectorAll('.labels .lw')]);
 T.forEach(t=>{const bb=t.getBoundingClientRect();if(!bb.width)return;
  const b={x:bb.left-2,y:bb.top-1,w:bb.width+4,h:bb.height+2};
  const hit=kept.some(q=>b.x<q.x+q.w&&q.x<b.x+b.w&&b.y<q.y+q.h&&q.y<b.y+b.h);
  if(hit&&t.getAttribute('data-major')!=='1')t.classList.add('hid');else kept.push(b);});}
/* ---------------- routes ---------------- */
function legIds(c,rid,legs){const base=(LEG_PATHS[c]&&LEG_PATHS[c][rid])||[];
 return legs.map((l,i)=>/^cab from here/i.test(l[1]||'')?'@cab':base[i]||null);}
function rerouteD(s,prevPath){let P=s.D.to;
 if(prevPath){try{const L=prevPath.getTotalLength(),q=prevPath.getPointAtLength(L*.5);P=[q.x,q.y];}catch(e){}}
 let best=null,bd=1e9;s.D.reroads.forEach(rd=>rd.forEach((p,j)=>{if(j===rd.length-1)return;const d=Math.hypot(p[0]-P[0],p[1]-P[1]);if(d<bd){bd=d;best=rd.slice(j);}}));
 return cr([P].concat(best||[s.D.to]));}
function routes(svg,list,opt){const s=ST.get(svg);if(!s)return;opt=opt||{};list=list||[];
 s.active=opt.active!=null?opt.active:null;s.hover=opt.hover!=null?opt.hover:null;
 const key=list.map(r=>r.id+'~'+sig(r.legs)+'~'+(r.color||'')).join('#');
 if(key!==s.key){s.key=key;cancelAnims(s);s.gR.textContent='';s.routes={};
  list.forEach(r=>{const rg=el('g',{class:'rt','data-id':r.id},s.gR);const ids=legIds(s.c,r.id,r.legs);let prev=null;
   r.legs.forEach((l,i)=>{const m=l[0],pid=ids[i];let d;
    if(pid==='@cab')d=rerouteD(s,prev);else d=s.D.paths[pid]?dOf(s.D.paths[pid]):null;
    if(!d)return;
    const lg=el('g',{class:'leg leg-'+m,'data-i':i},rg);
    if(m!=='walk')el('path',{class:'cs',d},lg);
    const ln=el('path',{class:'ln',d},lg);
    if(m!=='walk')ln.style.stroke=(r.color||'var(--m-'+m+','+mcol(m)+')');
    prev=ln;});
   rg.addEventListener('pointerenter',()=>svg.dispatchEvent(new CustomEvent('lynkmap:hover',{detail:{id:r.id}})));
   rg.addEventListener('pointerleave',()=>svg.dispatchEvent(new CustomEvent('lynkmap:hover',{detail:{id:null}})));
   rg.addEventListener('click',()=>svg.dispatchEvent(new CustomEvent('lynkmap:select',{detail:{id:r.id}})));
   s.routes[r.id]={g:rg,legs:r.legs,sig:sig(r.legs)};});}
 /* state classes + z-order: hovered on top, then active */
 const ids=Object.keys(s.routes);
 ids.forEach(i=>{const g=s.routes[i].g;g.classList.toggle('on',i===s.active);g.classList.toggle('hov',i===s.hover);
  g.classList.toggle('dim',s.active!=null&&i!==s.active&&s.hover==null);g.classList.toggle('fade',s.hover!=null&&i!==s.hover);});
 if(s.active!=null&&s.routes[s.active])s.gR.appendChild(s.routes[s.active].g);
 if(s.hover!=null&&s.routes[s.hover])s.gR.appendChild(s.routes[s.hover].g);
 if(s.prog&&!s.prog.path.isConnected)stop(svg);}
function findRoute(s,legs){if(typeof legs==='string')return s.routes[legs];
 const g=sig(legs);for(const i in s.routes)if(s.routes[i].sig===g)return s.routes[i];
 return s.routes[s.active]||s.routes[Object.keys(s.routes)[0]];}
function cancelAnims(s){s.anims.forEach(a=>{try{a.cancel();}catch(e){}});s.anims=[];
 s.gR.querySelectorAll('[mask]').forEach(e=>e.removeAttribute('mask'));const m=s.gR.ownerSVGElement&&s.gR.ownerSVGElement.querySelectorAll('mask.dm');if(m)m.forEach(x=>x.remove());}

/* ---------------- draw-in ---------------- */
function drawIn(svg,legs){const s=ST.get(svg);if(!s)return Promise.resolve();const R=findRoute(s,legs);if(!R)return Promise.resolve();
 cancelAnims(s);const gs=[...R.g.querySelectorAll('.leg')];if(!gs.length)return Promise.resolve();
 if(RM()||!R.g.animate){const a=R.g.animate?R.g.animate([{opacity:0},{opacity:1}],{duration:150,easing:'linear'}):null;if(a)s.anims.push(a);return a?a.finished.catch(()=>{}):Promise.resolve();}
 const Ls=gs.map(g=>{try{return g.querySelector('.ln').getTotalLength();}catch(e){return 50;}}),tot=Ls.reduce((a,b)=>a+b,0)||1;
 const GAP=120,T=Math.max(300,900-GAP*(gs.length-1));let t=0;const defs=svg.querySelector('defs'),ps=[];
 gs.forEach((g,i)=>{const L=Ls[i]+2,dur=Math.max(90,T*Ls[i]/tot),mid=s.id+'m'+i;
  const mk=el('mask',{id:mid,class:'dm',maskUnits:'userSpaceOnUse',x:-600,y:-600,width:2200,height:1900},defs);
  const mp=el('path',{d:g.querySelector('.ln').getAttribute('d'),fill:'none',stroke:'#fff','stroke-width':r1(24*s.k),'stroke-linecap':'butt','stroke-linejoin':'round'},mk);
  mp.style.strokeDasharray=L+' '+(L+10);mp.style.strokeDashoffset=L;g.setAttribute('mask','url(#'+mid+')');
  const a=mp.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:dur,delay:t,easing:EASE,fill:'both'});
  s.anims.push(a);ps.push(a.finished.then(()=>{g.removeAttribute('mask');mk.remove();}).catch(()=>{}));t+=dur+GAP;});
 return Promise.all(ps);}

/* ---------------- vehicle ---------------- */
function place(s,p,t){let L;try{L=p.getTotalLength();}catch(e){return;}if(!L)return;
 const d=Math.max(0,Math.min(L,t*L)),a=p.getPointAtLength(d),e=1.5,
  b=d+e<=L?p.getPointAtLength(d+e):p.getPointAtLength(Math.max(0,d-e)),ang=Math.atan2(d+e<=L?b.y-a.y:a.y-b.y,d+e<=L?b.x-a.x:a.x-b.x)*57.2958;
 s.veh.setAttribute('transform','translate('+r1(a.x)+' '+r1(a.y)+') rotate('+r1(ang)+')');}
function tick(svg){const s=ST.get(svg);if(!s||s.raf)return;
 const f=now=>{s.raf=0;const P=s.prog;if(!P||!P.path.isConnected)return;let keep=false,t;
  if(P.loop){const per=P.dur+650,e=(now-P.t0)%per;t=Math.min(1,e/P.dur);keep=true;}
  else{const e=Math.min(1,(now-P.t0)/380);t=P.from+(P.to-P.from)*(1-Math.pow(1-e,3));keep=e<1;}
  P.cur=t;place(s,P.path,t);if(keep)s.raf=requestAnimationFrame(f);};
 s.raf=requestAnimationFrame(f);}
/* progress(svg, legs|routeId, stepIndex, t01?) — t01 number: glide to that point; omitted: loop along the leg */
function progress(svg,legs,i,t01){const s=ST.get(svg);if(!s)return;const R=findRoute(s,legs);if(!R)return;
 const g=R.g.querySelector('.leg[data-i="'+(i|0)+'"]');if(!g){s.veh.classList.remove('on');return;}
 const path=g.querySelector('.ln'),m=(g.getAttribute('class').match(/leg-(\w+)/)||[])[1]||'walk';
 s.veh.querySelector('circle').style.fill=m==='walk'?'var(--m-walk,'+mcol('walk')+')':'var(--m-'+m+','+mcol(m)+')';
 s.veh.classList.add('on');
 const same=s.prog&&s.prog.path===path,cur=same?s.prog.cur||0:0,len=(()=>{try{return path.getTotalLength();}catch(e){return 200;}})();
 if(s.raf){cancelAnimationFrame(s.raf);s.raf=0;}
 if(typeof t01==='number'){const to=Math.max(0,Math.min(1,t01));
  if(RM()){s.prog={path,cur:to};place(s,path,to);return;}
  s.prog={path,loop:false,from:same?cur:to,to,t0:performance.now(),cur};}
 else{if(RM()){s.prog={path,cur:.5};place(s,path,.5);return;}
  s.prog={path,loop:true,dur:Math.max(1600,Math.min(5200,len*9)),t0:performance.now(),cur:0};}
 place(s,path,s.prog.from!=null?s.prog.from:0);tick(svg);}
function stop(svg,o){const s=ST.get(svg);if(!s)return;if(s.raf)cancelAnimationFrame(s.raf);s.raf=0;s.prog=null;
 if(o&&o.hide)s.veh.classList.remove('on');}

/* ---------------- pins ---------------- */
function pins(svg,o){const s=ST.get(svg);if(!s)return;o=o||{};const k=s.k,n=v=>r1(v*k),rm=RM();s.gP.textContent='';
 const at=(v,d)=>Array.isArray(v)?v:d;
 const pulse=(g,col,delay)=>{if(rm)return;const c=el('circle',{r:n(8),fill:col,opacity:0},g);
  [['r',n(8)+';'+n(24)],['opacity','.45;0']].forEach(a=>el('animate',{attributeName:a[0],values:a[1],dur:'1.8s',begin:delay,repeatCount:'indefinite',calcMode:'spline',keyTimes:'0;1',keySplines:'.2 0 .2 1'},c));};
 if(o.from!==false){const p=at(o.from,s.D.from),g=el('g',{class:'pin pin-from',transform:'translate('+p[0]+' '+p[1]+')'},s.gP);
  el('title',{},g).textContent=typeof o.from==='string'?'Start: '+o.from:'Start';
  pulse(g,'var(--ink,#0E0E0F)','0s');el('circle',{r:n(6),fill:'var(--ink,#0E0E0F)',stroke:'var(--surface,#fff)','stroke-width':n(2.5),filter:'url(#'+s.id+'s)'},g);}
 if(o.to!==false){const p=at(o.to,s.D.to),g=el('g',{class:'pin pin-to',transform:'translate('+p[0]+' '+p[1]+')'},s.gP);
  el('title',{},g).textContent=typeof o.to==='string'?'Destination: '+o.to:'Destination';
  pulse(g,'var(--sun,#FFCF20)','.9s');
  const t=el('g',{transform:'scale('+r1(k)+')'},g);
  el('ellipse',{cx:0,cy:0,rx:3.2,ry:1.3,fill:'#0E0E0F',opacity:.22},t);
  el('path',{d:'M0,0C-1.8,-5.2-8,-9.4-8,-15.5A8,8 0 1 1 8,-15.5C8,-9.4 1.8,-5.2 0,0Z',fill:'var(--sun,#FFCF20)',stroke:'var(--ink,#0E0E0F)','stroke-width':1.6,'stroke-linejoin':'round',filter:'url(#'+s.id+'s)'},t);
  el('circle',{cx:0,cy:-15.5,r:2.8,fill:'var(--ink,#0E0E0F)'},t);}}

window.LynkMap={mount,routes,drawIn,progress,stop,pins,LEG_PATHS};
})();
