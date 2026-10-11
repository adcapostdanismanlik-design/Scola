'use strict';
// Scola canlı arayüz katmanı: yalnızca süs ve geri bildirim ekler, hak / XP / para kararı vermez.
// scola.js'ten sonra yüklenir; prefers-reduced-motion açıkken hareket üreten her şey kapalıdır.
(()=>{
const mq=q=>typeof matchMedia==='function'&&matchMedia(q).matches;
const calm=mq('(prefers-reduced-motion: reduce)'),fine=mq('(hover:hover) and (pointer:fine)');
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rand=(a,b)=>a+Math.random()*(b-a);
const COLORS=['#c5a5e9','#d7eca9','#efb28e','#a5c9ef','#f2d58a'];

/* ---------- Kıvılcım patlaması ---------- */
function burst(x,y,n=7){if(calm)return;for(let i=0;i<n;i++){const s=document.createElement('span');s.className='spark';s.textContent=i%3?'✦':'●';s.style.cssText=`left:${x}px;top:${y}px;color:${COLORS[i%COLORS.length]};font-size:${rand(9,16)}px`;document.body.appendChild(s);const a=rand(0,Math.PI*2),d=rand(28,70);s.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d-14}px)) scale(1.1) rotate(${rand(-90,90)}deg)`,opacity:0}],{duration:rand(520,820),easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>s.remove()}}
document.addEventListener('click',e=>{const t=e.target.closest?.('.btn.purple,.btn.lime,.hero-art,.path-item,.progress-card,.logo');if(t)burst(e.clientX,e.clientY,t.classList.contains('btn')?5:8)});

/* ---------- İşaretçi paralaksı ve kart eğimi ---------- */
let raf=0,px=0,py=0;
document.addEventListener('pointermove',e=>{
  if(calm||e.pointerType==='touch')return;px=e.clientX/innerWidth*2-1;py=e.clientY/innerHeight*2-1;
  if(!raf)raf=requestAnimationFrame(()=>{raf=0;const r=document.documentElement.style;r.setProperty('--px',px.toFixed(3));r.setProperty('--py',py.toFixed(3));eyes(e.clientX,e.clientY)});
  if(fine){const c=e.target.closest?.('.mission-card,.course-card');if(c){const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;c.style.transform=`perspective(800px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg) translateY(-3px)`}}
});
document.addEventListener('pointerout',e=>{const c=e.target.closest?.('.mission-card,.course-card');if(c&&!c.contains(e.relatedTarget))c.style.transform=''});

/* ---------- Yol arkadaşı: gözler imleci izler, ipucu balonu ---------- */
function eyes(cx,cy){const b=document.getElementById('helperButton');if(!b)return;const r=b.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2),d=Math.hypot(dx,dy)||1,k=Math.min(3,d/60);const ex=dx/d*k,ey=dy/d*k;$$('ellipse',b).forEach(el=>el.style.transform=`translate(${ex.toFixed(2)}px,${ey.toFixed(2)}px)`)}
const tips={home:['Bir alan çarkı çevirelim mi? 🎡','wheel'],missions:['İlgi alanına göre sekmeleri dene!',null],academy:['Bildiğin küçük bir şeyi öğretmek bile değerli.',null],projects:['Küçük bir fikirle başla, adım adım büyüt.',null],community:['Birinin ilgisini seç, ortak iş çıkabilir.',null],funding:['Destek, kanıtla büyür. Önce küçük bir deneme!',null],survey:['Cevapların topluluk nabzına eklenir!',null],review:['Faydalı geri bildirim, en iyi hediyedir.',null],hub:['Ada\'nın kapısını tek başına açamazsın: biriyle tanış!',null],market:['Ürünün güvenle satılır: ücret emanette bekler.',null],growth:['Gelişim oyundan bağımsızdır: katkı, zaman ve mentörlük sayılır.',null]};
const shown=new Set();let bubbleTimer=0;
function bubble(pageName){if(calm||shown.has(pageName)||!tips[pageName])return;shown.add(pageName);const helper=document.querySelector('.helper');if(!helper||!document.getElementById('helperPanel').hidden)return;let b=document.getElementById('helperBubble');if(!b){b=document.createElement('button');b.id='helperBubble';b.className='helper-bubble';b.setAttribute('aria-hidden','true');b.tabIndex=-1;helper.appendChild(b)}const [text,act]=tips[pageName];b.textContent=text;b.onclick=()=>{b.classList.remove('show');if(act==='wheel')openWheel()};clearTimeout(bubbleTimer);setTimeout(()=>b.classList.add('show'),900);bubbleTimer=setTimeout(()=>b.classList.remove('show'),7500);const btn=document.getElementById('helperButton');btn?.animate?.([{transform:'rotate(-5deg)'},{transform:'rotate(-5deg) translateY(-12px)'},{transform:'rotate(-5deg)'}],{duration:600,delay:700,easing:'ease-out'})}
document.addEventListener('click',e=>{if(e.target.closest?.('#helperButton'))document.getElementById('helperBubble')?.classList.remove('show')});

/* ---------- Dönen kelime ---------- */
const words=['üreticisin.','kaşifsin.','tasarımcısın.','girişimcisin.','hikâye anlatıcısısın.'];let wi=0;
setInterval(()=>{if(calm||document.hidden)return;const em=document.querySelector('.hero h2 em');if(!em)return;wi=(wi+1)%words.length;em.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],{duration:220}).onfinish=()=>{em.textContent=words[wi];em.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:260})}},3200);

/* ---------- Sayaç animasyonu ---------- */
function countUp(el,to,suffix=''){const from=Number(el.dataset.v||0);el.dataset.v=to;if(calm||from===to){el.textContent=to+suffix;return}const t0=performance.now();(function step(t){const k=Math.min(1,(t-t0)/700),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*e)+suffix;if(k<1)requestAnimationFrame(step)})(t0)}

/* ---------- Canlı nabız paneli (ana sayfa) ---------- */
const evIcon={task:'₺',paid:'✓',submit:'↑',accept:'★'};let seen=new Set(),first=true;
function pulsePanel(){
  if(page!=='home'||!live.available||document.getElementById('livePanel'))return;
  const anchor=document.querySelector('.hero-layout');if(!anchor)return;
  const p=document.createElement('section');p.id='livePanel';p.className='live-panel';p.setAttribute('aria-label','Scola şu an');
  p.innerHTML=`<div class="live-head"><span class="pulse-signal"></span><strong>Şu an Scola'da</strong><small>canlı · 8 sn'de bir güncellenir</small></div><div class="live-stats">${[['hubOnline','Meydanda'],['users','Üye'],['openTasks','Açık görev'],['heldTL','Test emanetinde','₺'],['accepted','Kabul edilen katkı'],['surveys','Anket yanıtı']].map(([k,l,s])=>`<div class="live-stat"><b data-k="${k}" data-s="${s||''}">0${s||''}</b><span>${l}</span></div>`).join('')}</div><ul class="live-feed" id="liveFeed" aria-live="off"></ul>`;
  anchor.parentNode.insertBefore(p,anchor);first=true;seen=new Set();tick();
}
async function tick(){
  const panel=document.getElementById('livePanel');if(!panel||document.hidden||!live.available)return;
  let d;try{d=await api('GET','/api/pulse')}catch{return}
  $$('.live-stat b',panel).forEach(b=>countUp(b,Math.round(d[b.dataset.k]||0),b.dataset.s));
  const feed=document.getElementById('liveFeed');if(!feed)return;
  const fresh=d.events.filter(e=>!seen.has(e.at+e.text));
  if(!d.events.length&&first){feed.innerHTML='<li class="live-empty">Henüz hareket yok. İlk görevi sen aç, ilk teslimi sen yap! <button class="text-btn" onclick="navigate(\'missions\')">Görevlere git ↗</button></li>'}
  else{if(feed.querySelector('.live-empty'))feed.innerHTML='';fresh.slice().reverse().forEach(e=>{seen.add(e.at+e.text);const li=document.createElement('li');li.className='live-ev ev-'+e.kind+(first?'':' fresh');li.innerHTML=`<i aria-hidden="true">${evIcon[e.kind]||'•'}</i><span>${esc(e.text)}</span><small>${new Date(e.at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</small>`;feed.prepend(li)});while(feed.children.length>6)feed.lastChild.remove()}
  first=false;
}
setInterval(tick,8000);

/* ---------- XP geri bildirimi ---------- */
function floatXp(n){if(!(n>0))return;const el=document.createElement('div');el.className='xp-float';el.textContent='+'+n+' XP';document.body.appendChild(el);if(calm){setTimeout(()=>el.remove(),1600);return}el.animate([{transform:'translate(-50%,10px) scale(.7)',opacity:0},{transform:'translate(-50%,-10px) scale(1.15)',opacity:1,offset:.25},{transform:'translate(-50%,-70px) scale(1)',opacity:0}],{duration:1500,easing:'ease-out'}).onfinish=()=>el.remove()}
const _refresh=refreshLive;refreshLive=async function(){const prev=live.user?.id,xp0=live.xp,st0=live.stage;await _refresh();if(live.user&&live.user.id===prev){if(live.xp>xp0)floatXp(live.xp-xp0);if(st0&&live.stage&&live.stage!==st0){celebrate();toast('Yeni aşama: '+live.stageEmoji+' '+live.stageName+' 🎉')}}};
const _award=award;award=function(key,points){const ok=_award(key,points);if(ok)floatXp(points);return ok};

/* ---------- Alan çarkı ---------- */
const wheelAreas=[
 {k:'art',l:'Sanat',e:'🎨',m:'art-reading',t:'Bir eseri kelimelere dök.'},
 {k:'culture',l:'Kültür',e:'🏺',m:'culture-story',t:'Yöresel bir hikâyeyi belgele.'},
 {k:'music',l:'Müzik',e:'🎵',m:'music-listen',t:'Bir parçayı dinleyip çözümle.'},
 {k:'game',l:'Oyun',e:'🎮',m:'game-idea',t:'Bir oyun mekaniği tasarla.'},
 {k:'trade',l:'Ticaret',e:'🛍️',m:'trade-pitch',t:'Küçük bir ürünün satış planını yaz.'},
 {k:'tech',l:'Teknoloji',e:'💻',m:'test-cart',t:'Bir sepet akışını stres testine sok.'},
 {k:'craft',l:'El işi',e:'🧵',a:'openIdea()',t:'Elinle yapacağın bir ürün fikrini tanımla.'},
 {k:'content',l:'İçerik',e:'🎬',m:'copy',t:'Karışık bir metni anlaşılır yap.'}];
const wheelColors=['#c5a5e9','#d7eca9','#efb28e','#a5c9ef','#f2d58a','#e9a5c9','#9fdcc4','#c8b8f0'];
const polar=(a,r)=>{const t=(a-90)*Math.PI/180;return [150+r*Math.cos(t),150+r*Math.sin(t)]};
function wheelSvg(){return `<svg viewBox="0 0 300 300" class="wheel-svg" id="wheelSvg" role="img" aria-label="Alan çarkı: ${wheelAreas.map(a=>a.l).join(', ')}"><g id="wheelRot">${wheelAreas.map((a,i)=>{const [x0,y0]=polar(i*45,142),[x1,y1]=polar((i+1)*45,142);const mid=i*45+22.5;return `<path d="M150 150L${x0.toFixed(1)} ${y0.toFixed(1)}A142 142 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z" fill="${wheelColors[i]}" stroke="#fff" stroke-width="2"/><g transform="rotate(${mid} 150 150)"><text x="150" y="52" text-anchor="middle" font-size="20">${a.e}</text><text x="150" y="76" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4d">${a.l}</text></g>`}).join('')}<circle cx="150" cy="150" r="22" fill="#40354e"/><text x="150" y="156" text-anchor="middle" font-size="16" fill="#e1faad">✦</text></g></svg>`}
let spinning=false,wheelDeg=0;
window.openWheel=function(){spinning=false;modal(`<div class="eyebrow">KEŞİF ÇARKI</div><h2>Bugün hangi alana dokunalım?</h2><p>Çarkı çevir, çıkan alanda küçük bir görev dene. İstediğin kadar çevirebilirsin.</p><div class="wheel-wrap"><div class="wheel-pointer" aria-hidden="true">▼</div>${wheelSvg()}</div><div class="modal-actions" style="justify-content:center"><button class="btn purple" id="spinBtn" onclick="spinWheel()">Çarkı çevir 🎡</button></div><div id="wheelResult" role="status" aria-live="polite"></div>`)};
window.spinWheel=function(){
  if(spinning)return;spinning=true;const btn=document.getElementById('spinBtn'),rot=document.getElementById('wheelRot'),out=document.getElementById('wheelResult');btn.disabled=true;out.innerHTML='';
  const i=Math.floor(Math.random()*wheelAreas.length),target=Math.ceil(wheelDeg/360)*360+360*5-(i*45+22.5)+rand(-14,14);wheelDeg=target;
  const done=()=>{spinning=false;btn.disabled=false;btn.textContent='Tekrar çevir 🎡';const a=wheelAreas[i];out.innerHTML=`<div class="result wheel-result"><strong>${a.e} ${a.l}</strong><br>${a.t}<div class="modal-actions" style="margin-top:12px"><button class="btn lime small" onclick="${a.m?`openMission('${a.m}')`:a.a}">Bu görevi dene ↗</button></div></div>`;celebrate()};
  if(calm){rot.style.transform=`rotate(${target}deg)`;done();return}
  rot.style.transition='transform 4.2s cubic-bezier(.12,.7,.1,1)';rot.style.transformOrigin='150px 150px';requestAnimationFrame(()=>{rot.style.transform=`rotate(${target}deg)`});
  rot.addEventListener('transitionend',done,{once:true});
};

/* ---------- Sayfa değişince süsleri bağla ---------- */
function decorate(){
  $$('.mission-grid>*,.course-grid>*,.card-grid>*,.community-grid>*,.path-strip>*,.fund-grid>*').forEach((el,i)=>{if(!el.style.getPropertyValue('--i'))el.style.setProperty('--i',i%12)});
  if(page==='home'){const b=document.querySelector('.page-intro .btn');if(b&&!document.getElementById('wheelBtn')){const w=document.createElement('button');w.id='wheelBtn';w.className='btn lime';w.textContent='🎡 Alan çarkı';w.onclick=openWheel;const hb=document.createElement('button');hb.id='hubBtn';hb.className='btn purple';hb.textContent='🏙 Meydan\'a gir';hb.onclick=()=>navigate('hub');b.parentNode.insertBefore(hb,b);b.parentNode.insertBefore(w,b);b.parentNode.classList.add('has-wheel')}}
  const hp=document.getElementById('helperPanel');if(hp&&!document.getElementById('helperWheel')){const w=document.createElement('button');w.id='helperWheel';w.textContent='🎡 Alan çarkını çevir';w.onclick=()=>{hideHelper();openWheel()};hp.appendChild(w)}
  pulsePanel();bubble(page);
}
const main=document.getElementById('main');if(main)new MutationObserver(()=>{clearTimeout(decorate.t);decorate.t=setTimeout(decorate,30)}).observe(main,{childList:true});
// Sunucu açıldığında (initLive sonrası) paneli yeniden dene
setInterval(()=>{if(page==='home'&&live.available&&!document.getElementById('livePanel'))decorate()},1500);
decorate();
})();
