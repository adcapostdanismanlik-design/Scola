/* Scola ağaçkakanı: kendi çizdiğimiz katmanlı SVG (baş, arma, göz, kanat, kuyruk, gövde, ayaklar ayrı oynar).
   Hareketler süstür; XP ya da doğrulama anlamı taşımaz. Hareket azaltma açıkken sabit durur. */
(function(root){
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const sm=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const FIELDS=['head','hx','hy','crest','wing','tail','lean','hop','sq'];
const add=(o,p)=>{for(const k in p)o[k]=(o[k]||0)+p[k]};
/* Hareketler: süre (sn) ve geçen süreye göre sapma değerleri. Baş açısı + değeri öne/aşağı (saat yönü). */
const ACTIONS={
  peck:{dur:2.3,f(e){const o={},H=.62,n=Math.floor(e/H);if(n>=3){const x=clamp((e-3*H)/.4);o.head=.03*Math.sin(x*14)*(1-x);return o}
    const x=(e%H)/H,ant=sm(0,.3,x)-sm(.3,.38,x),str=sm(.3,.42,x)-sm(.55,.9,x),vib=Math.sin(x*70)*sm(.42,.5,x)*(1-sm(.5,.75,x));
    o.head=-.12*ant+.42*str+.02*vib;o.hx=.025*str;o.hy=.05*str-.012*ant;o.lean=-.02*ant+.045*str;o.sq=-.012*str;o.crest=-.12*str+.06*ant;o.tail=-.04*str;o.wing=.05*str;return o}},
  flap:{dur:1.3,f(e){const env=sm(0,.12,e)*(1-sm(1.05,1.3,e)),w=Math.abs(Math.sin(e*Math.PI*3.6));return {wing:.6*w*env,hop:.02*w*env,tail:-.1*env,head:-.06*env,crest:.12*Math.sin(e*38)*env,sq:.012*w*env}}},
  hop:{dur:.9,f(e){const squat=sm(0,.15,e)-sm(.15,.22,e),air=e>.15&&e<.55?Math.sin(Math.PI*(e-.15)/.4):0,land=sm(.55,.6,e)-sm(.6,.85,e);return {sq:-.035*squat+.025*air-.04*land,hop:.09*air,wing:.3*air,head:-.06*air+.05*land,crest:.15*land-.1*air,tail:.1*air}}},
  tilt:{dur:1.7,f(e){const env=sm(0,.3,e)*(1-sm(1.25,1.7,e));return {head:-.14*env,hx:-.012*env,lean:-.012*env,crest:.1*Math.sin(e*7)*env}}},
  look:{dur:2.2,f(e){return {head:-.08*(sm(0,.3,e)-sm(.55,.85,e))+.07*(sm(.85,1.15,e)-sm(1.5,2,e)),crest:.06*Math.sin(e*5)}}},
  cheer:{dur:1.9,f(e){const o={};add(o,ACTIONS.hop.f(e));add(o,ACTIONS.hop.f(e-.75));add(o,ACTIONS.flap.f(e*.8));o.head=(o.head||0)-.08*sm(0,.3,e)*(1-sm(1.5,1.9,e));return o}}
};
const D='#23202f',RED='#d8322f',CREAM='#f6e8c8',BODY='#3b3c4b',WING='#2c2d3a';
const ART=`<g class="r-lean"><g class="r-hop">
<g class="r-tail"><path d="M168 392C124 428 62 468 16 502C72 508 136 484 176 442Z" fill="#2a2b37"/><path d="M180 410C154 450 116 486 88 510C134 508 180 474 204 428Z" fill="#1f202a"/><path d="M60 480L110 452M104 492L146 462" fill="none" stroke="#454759" stroke-width="2.5"/></g>
<g class="r-legs" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${D}" stroke-width="12"><path d="M208 436L216 470M216 470L172 478M216 470L252 484M216 470L240 496"/><path d="M238 436L252 466M252 466L206 480M252 466L292 474M252 466L272 494"/></g><g stroke="#a5724c" stroke-width="6.5"><path d="M208 436L216 470M216 470L172 478M216 470L252 484M216 470L240 496"/><path d="M238 436L252 466M252 466L206 480M252 466L292 474M252 466L272 494"/></g><g stroke="${D}" stroke-width="3.5"><path d="M172 478l-6 6M252 484l6 5M240 496l-3 7M206 480l-6 6M292 474l6 6M272 494l-3 7"/></g></g>
<g class="r-body"><path d="M150 172C140 190 128 215 112 270C98 320 96 380 120 425C150 465 215 462 250 430C285 395 290 330 282 270C276 220 272 180 258 140Z" fill="${BODY}" stroke="${D}" stroke-width="3"/><path d="M204 176C203 200 214 250 204 332C198 382 204 424 222 452C268 440 292 400 285 330C281 262 286 210 262 150C252 128 228 118 204 128Z" fill="${CREAM}"/><path d="M232 190C226 250 240 300 230 360M252 200C250 250 262 300 254 350" fill="none" stroke="#e5d0a4" stroke-width="2.4" stroke-linecap="round"/><path d="M204 128C196 182 214 250 204 332C198 382 204 424 222 452" fill="none" stroke="${D}" stroke-width="3" stroke-linecap="round"/><path d="M285 330C281 262 286 210 262 150" fill="none" stroke="#c9ae7d" stroke-width="2.5" stroke-linecap="round"/></g>
<g class="r-wing"><path d="M178 205C140 225 110 275 85 340C60 400 35 450 10 494C75 472 140 422 175 362C210 306 218 250 205 215Z" fill="${WING}" stroke="${D}" stroke-width="3"/><path d="M150 232C122 262 100 300 84 340" fill="none" stroke="#5a5c70" stroke-width="4" stroke-linecap="round"/><path d="M70 330C90 354 108 348 118 338C132 360 152 354 160 342C174 360 192 352 198 340L196 352C190 372 170 374 160 360C150 376 128 374 120 358C108 370 86 368 74 348Z" fill="${CREAM}" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/><path d="M50 410L96 372M86 424L130 384M120 430L158 396" fill="none" stroke="#454759" stroke-width="2.5" stroke-linecap="round"/></g>
<g class="r-head"><path d="M146 138C146 166 144 190 140 208L268 208C264 190 262 166 260 138Z" fill="${BODY}"/><path d="M146 138C146 166 144 190 140 208" fill="none" stroke="${D}" stroke-width="3" stroke-linecap="round"/><path d="M206 132C205 160 204 190 204 210L268 210C264 190 262 166 258 140Z" fill="${CREAM}"/><g transform="translate(-30 -25.5) scale(1.15)"><path d="M150 120C146 70 176 38 226 40C264 42 270 80 260 114C250 140 216 152 190 150C166 148 152 140 150 120Z" fill="${BODY}" stroke="${D}" stroke-width="3"/><path d="M166 102C170 70 206 54 240 62C264 70 266 92 254 110C240 128 216 126 200 118C182 112 164 110 166 102Z" fill="#fff"/><path d="M178 82L206 84" stroke="${D}" stroke-width="3" stroke-linecap="round"/>
<g class="r-eye"><circle cx="228" cy="84" r="15" fill="#fff" stroke="${RED}" stroke-width="5"/><circle class="r-pupil" cx="230" cy="85" r="8.5" fill="#15141c"/><circle class="r-pupil" cx="233.5" cy="81" r="3" fill="#fff"/><g class="r-lid" style="display:none"><ellipse cx="228" cy="84" rx="17.5" ry="17.5" fill="#fff"/><path d="M211 84Q228 92 245 84" fill="none" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/></g></g>
<path d="M254 62C300 52 346 52 394 60C350 70 300 84 258 102C246 94 244 76 254 62Z" fill="#474957" stroke="${D}" stroke-width="3" stroke-linejoin="round"/><path d="M264 62C300 57 342 56 380 60" fill="none" stroke="#757889" stroke-width="2.6" stroke-linecap="round"/><path d="M260 98C300 86 346 72 390 62" fill="none" stroke="${D}" stroke-width="2.6"/><ellipse cx="274" cy="70" rx="3.2" ry="2" fill="${D}"/><path d="M243 70l10-4-4 11z" fill="${CREAM}"/>
<g class="r-crest"><path d="M262 70C262 50 238 40 208 40L172 4L164 42L120 -8L118 46L76 -4L84 56L38 14L68 78L24 56L100 96C130 100 150 100 172 88C200 68 235 64 262 70Z" fill="${RED}" stroke="${D}" stroke-width="3" stroke-linejoin="round"/><path d="M196 46L176 14M150 48L128 8M110 52L88 6M96 70L60 34" fill="none" stroke="#a81f26" stroke-width="3" stroke-linecap="round"/></g></g></g></g></g>`;
const VIEW={full:'0 -48 400 563',head:'14 -42 386 221'};
const PIV={head:[192,176],crest:[205,85],wing:[180,215],tail:[168,396],feet:[215,500],eye:[228,68]};
const rigs=[];let cursor=null;
const R=n=>(n*57.2958).toFixed(2);
function art(kind,extra){return `<div class="mascot ${kind==='full'?'':'mascot-head'} ${extra||''}"><svg viewBox="${VIEW[kind]||VIEW.full}" role="img" aria-label="Scola ağaçkakanı" focusable="false">${ART}</svg></div>`}
const SX=400,SY=515;
function makeRig(box,head){const s=box.querySelector('svg'),q=c=>s.querySelector('.'+c);
  return {box,head,s,g:{lean:q('r-lean'),hop:q('r-hop'),tail:q('r-tail'),body:q('r-body'),wing:q('r-wing'),head:q('r-head'),crest:q('r-crest'),lid:q('r-lid'),pupils:s.querySelectorAll('.r-pupil'),legs:q('r-legs')},acts:[],blink:{next:performance.now()/1e3+2,t0:-9,dbl:false},look:0,cx:0,
    play(name,now){if(this.acts.some(a=>a.name===name&&now-a.t0<.2))return;this.acts=this.acts.filter(a=>a.name!==name);this.acts.push({name,t0:now,def:ACTIONS[name]})}}}
function apply(r,o,bl,pd){const g=r.g,P=PIV;
  g.lean.setAttribute('transform',`translate(${P.feet[0]} ${P.feet[1]}) rotate(${R(o.lean||0)}) scale(${(1-(o.sq||0)*.6).toFixed(4)} ${(1+(o.sq||0)).toFixed(4)}) translate(${-P.feet[0]} ${-P.feet[1]})`);
  g.hop.setAttribute('transform',`translate(0 ${(-(o.hop||0)*SY).toFixed(2)})`);
  g.tail.setAttribute('transform',`rotate(${R(o.tail||0)} ${P.tail[0]} ${P.tail[1]})`);
  g.wing.setAttribute('transform',`rotate(${R(o.wing||0)} ${P.wing[0]} ${P.wing[1]})`);
  g.head.setAttribute('transform',`translate(${((o.hx||0)*SX).toFixed(2)} ${((o.hy||0)*SY).toFixed(2)}) rotate(${R(o.head||0)} ${P.head[0]} ${P.head[1]})`);
  g.crest.setAttribute('transform',`rotate(${R(o.crest||0)} ${P.crest[0]} ${P.crest[1]})`);
  const k=Math.max(.001,bl);g.lid.setAttribute('transform',`translate(0 ${P.eye[1]}) scale(1 ${k.toFixed(3)}) translate(0 ${-P.eye[1]})`);g.lid.style.display=bl>.02?'':'none';
  g.pupils.forEach(p=>p.setAttribute('transform',`translate(${pd[0].toFixed(2)} ${pd[1].toFixed(2)})`))}
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;const t=now/1e3;
  for(const r of rigs){if(!r.box.isConnected)continue;const bb=r.box.getBoundingClientRect();if(bb.bottom<0||bb.top>innerHeight||!bb.width)continue;
    const o={};o.sq=Math.sin(t*1.7)*.006;o.head=Math.sin(t*.7)*.02+Math.sin(t*1.9+1)*.008;o.crest=Math.sin(t*2.3)*.04;o.tail=Math.sin(t*.9)*.02;o.wing=Math.sin(t*1.7+.5)*.015;
    let pd=[0,0];
    if(cursor){const cxm=bb.left+bb.width*(r.head?.55:.57),cym=bb.top+bb.height*(r.head?.38:.16),dx=cursor.x-cxm,dy=cursor.y-cym,d=Math.hypot(dx,dy)||1,m=Math.min(4.5,d/45);pd=[dx/d*m,dy/d*m];
      const tg=clamp((cursor.y-(bb.top+bb.height*.2))/innerHeight,-1,1)*.06,tx=clamp((cursor.x-(bb.left+bb.width*.6))/innerWidth,-1,1)*.01;r.look+=(tg-r.look)*.06;r.cx+=(tx-r.cx)*.06}
    o.head+=r.look;o.hx=r.cx;
    r.acts=r.acts.filter(a=>t-a.t0<a.def.dur);for(const a of r.acts)add(o,a.def.f(t-a.t0));
    const B=r.blink;if(t>B.next){B.t0=t;B.next=t+2.5+Math.random()*3.5;B.dbl=Math.random()<.2}
    let bl=0;const e=t-B.t0;if(e<.16)bl=Math.sin(e/.16*Math.PI);else if(B.dbl&&e>.26&&e<.42)bl=Math.sin((e-.26)/.16*Math.PI);
    apply(r,o,bl,pd)}}
const calm=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function all(mood){const now=performance.now()/1e3;rigs.forEach(r=>{if(r.box.isConnected)r.play(mood,now)})}
function scan(scope){(scope||document).querySelectorAll('[data-mascot]:not([data-m-ready])').forEach(h=>{const kind=h.dataset.mascot==='full'?'full':'head';h.dataset.mReady='1';h.innerHTML=art(kind);const box=h.firstElementChild;
  for(let i=rigs.length-1;i>=0;i--)if(!rigs[i].box.isConnected)rigs.splice(i,1);
  const r=makeRig(box,kind!=='full');rigs.push(r);
  if(calm())return;
  h.addEventListener('pointerenter',()=>r.play(kind==='full'?'tilt':'peck',performance.now()/1e3));
  if(kind==='full')h.addEventListener('click',()=>r.play('peck',performance.now()/1e3))})}
let idleT;function idle(){clearTimeout(idleT);idleT=setTimeout(()=>{const vis=rigs.filter(r=>r.box.isConnected&&r.box.getBoundingClientRect().height&&r.box.getBoundingClientRect().top<innerHeight);if(vis.length&&!document.hidden&&!calm()){const r=vis[Math.floor(Math.random()*vis.length)],pool=r.head?['look','tilt','peck']:['peck','tilt','look','flap','hop','peck'];r.play(pool[Math.floor(Math.random()*pool.length)],performance.now()/1e3)}idle()},3500+Math.random()*3000)}
root.Mascot={art,scan,play:all,cheer:()=>all('cheer'),peck:()=>all('peck'),hop:()=>all('hop'),flap:()=>all('flap')};
document.addEventListener('pointermove',e=>{cursor={x:e.clientX,y:e.clientY}},{passive:true});
function boot(){scan();if(!calm())requestAnimationFrame(frame);idle()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
