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
const D='#23202f',RED='url(#mgRed)',CREAM='url(#mgCream)',BODY='url(#mgBody)',WING='url(#mgWing)',BEAK='url(#mgBeak)';
const ART=`<defs><linearGradient id="mgRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4a3f"/><stop offset="1" stop-color="#b3222b"/></linearGradient><linearGradient id="mgCream" gradientUnits="userSpaceOnUse" x1="196" y1="0" x2="280" y2="0"><stop offset="0" stop-color="#fcf3dc"/><stop offset=".7" stop-color="#f3e2bb"/><stop offset="1" stop-color="#e2c995"/></linearGradient><linearGradient id="mgBody" gradientUnits="userSpaceOnUse" x1="130" y1="100" x2="280" y2="380"><stop offset="0" stop-color="#4d4e60"/><stop offset="1" stop-color="#2f303c"/></linearGradient><linearGradient id="mgWing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d3e50"/><stop offset="1" stop-color="#1f2029"/></linearGradient><linearGradient id="mgBeak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6d7e"/><stop offset="1" stop-color="#353744"/></linearGradient></defs><g class="r-lean"><g class="r-hop">
<g class="r-tail"><path d="M150 378C128 420 90 470 52 506C108 502 160 462 192 402Z" fill="url(#mgWing)" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/><path d="M172 386C162 432 142 472 126 510C166 492 204 444 216 394Z" fill="#1c1d26" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/></g>
<g class="r-legs" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${D}" stroke-width="12"><path d="M200 372L206 446M206 446L158 466M206 446L252 458M206 446L236 486"/><path d="M232 372L240 442M240 442L196 468M240 442L288 452M240 442L268 484"/></g><g stroke="#a5724c" stroke-width="6.5"><path d="M200 372L206 446M206 446L158 466M206 446L252 458M206 446L236 486"/><path d="M232 372L240 442M240 442L196 468M240 442L288 452M240 442L268 484"/></g><g stroke="${D}" stroke-width="3.5"><path d="M158 466l-7 6M252 458l7 5M236 486l-4 8M196 468l-7 6M288 452l7 5M268 484l-4 8"/></g></g>
<g class="r-body"><path d="M150 128C148 170 164 195 160 215C140 260 150 330 186 376C200 392 232 386 246 368C266 342 278 300 276 262C274 222 264 186 254 150Z" fill="${BODY}" stroke="${D}" stroke-width="3"/><path d="M252 130C256 150 262 175 276 232C282 272 270 312 244 348C232 366 216 374 200 368C192 340 196 300 196 252C196 222 202 190 206 162C212 142 232 130 252 130Z" fill="${CREAM}"/><path d="M226 190C222 240 232 290 224 340M248 196C248 240 256 280 246 322" fill="none" stroke="#e5d0a4" stroke-width="2.4" stroke-linecap="round"/><path d="M276 232C282 272 270 312 244 348C232 366 216 374 200 368" fill="none" stroke="#cdb182" stroke-width="3" stroke-linecap="round"/></g>
<g class="r-head"><path d="M140 120C142 170 164 195 160 224L264 224C262 190 258 160 252 130Z" fill="${BODY}"/><path d="M140 120C142 170 164 195 160 224" fill="none" stroke="${D}" stroke-width="3" stroke-linecap="round"/><path d="M214 128C206 160 198 190 198 224L270 224C268 190 262 160 254 130Z" fill="${CREAM}"/>
<path d="M130 92C128 52 160 28 214 30C262 32 276 70 266 104C258 128 230 142 196 142C160 140 132 126 130 92Z" fill="${BODY}" stroke="${D}" stroke-width="3"/><path d="M150 108C150 74 186 56 232 62C262 68 268 92 256 112C244 130 216 136 196 128C170 122 150 120 150 108Z" fill="#fff"/><path d="M168 80L204 83" stroke="${D}" stroke-width="3" stroke-linecap="round"/>
<g class="r-eye"><circle cx="226" cy="82" r="16" fill="#fff" stroke="${RED}" stroke-width="5"/><circle class="r-pupil" cx="228" cy="83" r="9" fill="#15141c"/><circle class="r-pupil" cx="231.5" cy="78.5" r="3.2" fill="#fff"/><g class="r-lid" style="display:none"><ellipse cx="226" cy="82" rx="18.5" ry="18.5" fill="#fff"/><path d="M207 82Q226 91 245 82" fill="none" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/></g></g>
<path d="M256 62C300 54 346 54 386 60C346 72 300 90 262 110C248 100 246 78 256 62Z" fill="${BEAK}" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/><path d="M266 62C300 57 342 57 378 60" fill="none" stroke="#757889" stroke-width="2.6" stroke-linecap="round"/><path d="M262 104C302 90 346 74 382 62" fill="none" stroke="${D}" stroke-width="2.6"/><ellipse cx="276" cy="70" rx="3.2" ry="2" fill="${D}"/><path d="M244 72l11-5-4 12z" fill="${CREAM}"/>
<g class="r-crest"><path d="M266 56C262 44 244 38 214 38L180 6L170 42L124 -6L120 48L74 -2L82 60L30 20L66 84L22 64L104 104C134 108 152 98 176 80C202 58 238 46 266 56Z" fill="${RED}" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/><path d="M200 46L182 14M154 48L130 8M112 54L90 6M100 74L56 40M170 60L120 30M140 70L80 40M190 60L150 30" fill="none" stroke="#a81f26" stroke-width="3" stroke-linecap="round"/></g></g><g class="r-wing"><path d="M186 205C150 226 120 272 96 332C72 392 40 452 14 500C46 496 78 480 104 462C140 440 172 408 190 372C208 334 212 262 200 222Z" fill="${WING}" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/><path d="M168 232C140 262 116 300 98 344" fill="none" stroke="#5a5c70" stroke-width="4" stroke-linecap="round"/><path d="M84 316C100 338 118 334 128 324C142 346 160 340 168 328C182 346 198 338 204 326L202 340C196 360 178 362 168 348C158 364 138 362 130 346C118 358 98 356 88 336Z" fill="${CREAM}" stroke="${D}" stroke-width="2.4" stroke-linejoin="round"/><path d="M52 440L98 394M88 452L134 408M126 446L166 404M70 410L112 372M104 382L140 346M132 352L160 322M120 300L150 270" fill="none" stroke="#454759" stroke-width="2.5" stroke-linecap="round"/></g>
</g></g>`;
const VIEW={full:'0 -14 400 528',head:'14 -14 386 220'};
const PIV={head:[200,150],crest:[190,80],wing:[190,215],tail:[160,390],feet:[230,492],eye:[226,64]};
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
