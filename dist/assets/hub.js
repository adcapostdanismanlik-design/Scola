'use strict';
// Scola Meydanı istemcisi: ağ, HUD, giriş ve görselleştirici seçimi (3B Three.js ya da basit 2B canvas).
// Konum / kapı / bulmaca / damga kararlarını sunucu verir; burası yalnız niyet gönderir ve çizer.
(()=>{
const COLORS=['#c5a5e9','#d7eca9','#efb28e','#a5c9ef','#f2d58a','#e9a5c9','#9fdcc4','#c8b8f0'];
const FACES=['😀','😎','🤓','🥳','🦊','🐱','🐼','🦉','🤖','👾'];
const calm=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let clockOff=0,started=false,es=null,raf=0,root=null,cv=null,ctx=null,stage=null,S=null,info=null,dpr=1,R=null,mode='3d',view={k:1,x:0,y:0,w:0,h:0};
const mute=new Set(),keys=new Set();let lastDir='',lastT=0,promptT=0,curPrompt=null,statusTimer=0,ro=null,listening=false;
const h=id=>document.getElementById(id);
const av=(()=>{try{const a=JSON.parse(localStorage.getItem('scola-avatar'));if(a&&a.c>=0&&a.c<8&&a.e>=0&&a.e<10)return a}catch{}const a={c:Math.floor(Math.random()*8),e:Math.floor(Math.random()*10)};try{localStorage.setItem('scola-avatar',JSON.stringify(a))}catch{}return a})();
const rr=(c,x,y,w,hh,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+hh,r);c.arcTo(x+w,y+hh,x,y+hh,r);c.arcTo(x,y+hh,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
const post=(u,b)=>api('POST',u,{tok:S?.tok,...b}).catch(()=>({}));
const savedMode=()=>{try{return localStorage.getItem('scola-hub-mode')||'3d'}catch{return '3d'}};

/* ---------- Bağlantı ---------- */
function status(msg,sticky=false){const s=h('hubStatus');if(!s)return;s.textContent=msg||'';s.hidden=!msg;clearTimeout(statusTimer);if(msg&&!sticky)statusTimer=setTimeout(()=>{if(s)s.hidden=true},3500)}
function connect(room='meydan'){
  if(es)es.close();status('Bağlanıyor…',true);
  es=new EventSource(`/api/hub/stream?room=${room}&c=${av.c}&e=${av.e}`);
  es.onopen=()=>status('');
  es.onerror=()=>status('Bağlantı koptu, yeniden deneniyor…',true);
  const on=(n,f)=>es.addEventListener(n,e=>{try{f(JSON.parse(e.data))}catch(err){console.error(err)}});
  on('init',d=>{
    const players=new Map();for(const p of d.players)players.set(p.id,mk(p));
    S={id:d.id,tok:d.tok,map:d.map,state:d.state,stamps:d.stamps,players};const me=players.get(d.id);if(me)snapCam(me);
    clockOff=d.clock-Date.now();if(R){R.setClock(clockOff);R.setMap(S.map,S.state)}
    curPrompt=null;const pb=h('hubPrompt');if(pb)pb.hidden=true;status('');renderHud();sendDir(true);
  });
  on('join',d=>{if(!S)return;S.players.set(d.id,mk(d));renderHud()});
  on('leave',d=>{if(!S)return;S.players.delete(d.id);renderHud()});
  on('snap',list=>{if(!S)return;for(const [id,x,y,f,mv,hd] of list){const p=S.players.get(id);if(p){p.tx=x;p.ty=y;p.f=f;p.mv=!!mv;if(hd!==undefined&&mv)p.h=hd}}});
  on('say',d=>{const p=S?.players.get(d.id);if(!p||mute.has(d.id)||!info)return;p.say={t:d.k==='e'?info.emotes[d.i]:info.phrases[d.i],e:d.k==='e',until:performance.now()+4200};if(d.k==='e')p.emo={i:d.i,until:performance.now()+2200}});
  on('state',d=>{if(S){S.state=d;if(R)R.setState(d);renderHud()}});
  on('hit',d=>{if(R)R.hit(d.pad,d.ok)});
  on('prof',d=>{const p=S?.players.get(d.id);if(p){p.st=d.st;renderHud()}});
  on('stamp',d=>{toast(`Yeni damga: ${d.icon} ${d.label}`);if(typeof celebrate==='function')celebrate();const me=self();R?.burst?.((me?.x||0)/40,(me?.y||0)/40,'#d7eca9',24,1)});
  on('toast',d=>toast(d.msg));
  on('win',d=>{if(typeof celebrate==='function')celebrate();const def=S?.stamps[d.stamp];showFact(d.title||'Tamamlandı!',`Birlikte çalışarak başardınız. ${d.crew.length} kaşif ${def?def.icon+' '+def.label:'bir'} damgası kazandı. Oda ${d.resetIn} saniye sonra yeniden kurulur.`)});
  on('kicked',d=>{es.close();status(d.reason==='afk'?'Uzun süre hareketsiz kaldığın için bağlantı kapandı.':'Meydan başka bir sekmede açıldı.',true);const s=h('hubStatus');if(s){const b=document.createElement('button');b.className='text-btn';b.textContent=' Yeniden bağlan ↻';b.onclick=()=>connect();s.appendChild(b)}});
  on('full',()=>{es.close();status('Meydan şu an dolu. Biraz sonra tekrar dene.',true)});
}
const mk=p=>({id:p.id,n:p.n,c:p.c,e:p.e,st:p.st||[],g:p.g,x:p.pos?p.pos[1]:0,y:p.pos?p.pos[2]:0,tx:p.pos?p.pos[1]:0,ty:p.pos?p.pos[2]:0,f:1,h:p.pos?(p.pos[5]||0):0,mv:false,say:null,emo:null});
const self=()=>S?.players.get(S.id);
function snapCam(me){view.x=me.x-view.w/2;view.y=me.y-view.h/2}

/* ---------- Giriş ---------- */
const open=()=>h('modal')?.open;
function sendDir(force=false){
  if(!S)return;const ix=(keys.has('r')?1:0)-(keys.has('l')?1:0),iy=(keys.has('d')?1:0)-(keys.has('u')?1:0);
  const [dx,dy]=R?R.dirToWorld(ix,iy):[ix,iy],k=dx.toFixed(2)+','+dy.toFixed(2);
  if(k===lastDir&&!force)return;if(force&&!ix&&!iy&&lastDir==='0.00,0.00')return;lastDir=k;post('/api/hub/input',{dx,dy});
}
const keyMap={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d'};
function onKey(down){return e=>{
  if(!started||open())return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
  const d=keyMap[e.code];if(d){e.preventDefault();down?keys.add(d):keys.delete(d);sendDir();return}
  if(down&&e.code==='KeyE'&&curPrompt){e.preventDefault();doInteract(curPrompt)}
}}
function bindOnce(){
  if(listening)return;listening=true;
  addEventListener('keydown',onKey(true));addEventListener('keyup',onKey(false));
  addEventListener('blur',()=>{keys.clear();sendDir()});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();sendDir()}});
}
function tap(pt){
  if(!S||!pt)return;
  if(pt.player&&pt.player!==S.id){const who=S.players.get(pt.player);if(who){openCard(who);return}}
  if(pt.x==null)return;
  const it=S.map.interact.find(i=>Math.hypot(i.x-pt.x,i.y-pt.y)<Math.max(34,i.r*.6));
  post('/api/hub/input',{tx:it?it.x:pt.x,ty:it?it.y:pt.y});
}
function bindStage(){
  cv.addEventListener('pointerdown',e=>{
    if(!S||e.button>0)return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/view.k+view.x,y=(e.clientY-r.top)/view.k+view.y;
    const who=[...S.players.values()].reverse().find(p=>p.id!==S.id&&Math.hypot(p.x-x,p.y-y)<24);tap({x,y,player:who?.id});
  });
  const joy=h('hubJoy'),knob=joy.firstElementChild;let id=null;
  const set=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const L=Math.hypot(dx,dy),M=r.width/2-14;if(L>M){dx=dx/L*M;dy=dy/L*M}knob.style.transform=`translate(${dx}px,${dy}px)`;
    const n=Math.hypot(dx,dy)/M;keys.delete('l');keys.delete('r');keys.delete('u');keys.delete('d');if(n>.25){const ax=dx/M,ay=dy/M;if(ax>.3)keys.add('r');if(ax<-.3)keys.add('l');if(ay>.3)keys.add('d');if(ay<-.3)keys.add('u')}sendDir()};
  joy.addEventListener('pointerdown',e=>{id=e.pointerId;joy.setPointerCapture(id);set(e);e.preventDefault()});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===id)set(e)});
  const end=e=>{if(e.pointerId!==id)return;id=null;knob.style.transform='';keys.clear();sendDir()};joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);
  h('hubPrompt').onclick=()=>{if(curPrompt)doInteract(curPrompt)};
  h('hubSide').onclick=()=>{const p=h('hubSidePanel');p.hidden=!p.hidden;renderSide()};
  h('hubChatToggle').onclick=()=>{const p=h('hubPhrases');p.hidden=!p.hidden;h('hubChatToggle').setAttribute('aria-expanded',String(!p.hidden))};
  const ab=h('hubAvatarBtn');if(ab)ab.onclick=openAvatar;
  h('hubJournal').onclick=openJournal;h('hubMode').onclick=()=>{mode=R?'basic':'3d';try{localStorage.setItem('scola-hub-mode',mode)}catch{}setRenderer()};
}

/* ---------- Etkileşim ---------- */
async function doInteract(it){
  const r=await post('/api/hub/interact',{id:it.id});
  if(!r.ok){if(r.msg)toast(r.msg);return}
  if(r.act==='mission'&&typeof openMission==='function')openMission(r.arg);
  else if(r.act==='board')navigate(r.arg);
  else if(r.act==='clue')showFact(it.label,r.fact);
  else if(r.act==='npc')showFact('🤖 '+r.name,r.text);
  else if(r.msg)toast(r.msg);
}
function showFact(title,text){const f=h('hubFact');if(!f)return;f.innerHTML=`<strong>${esc(title)}</strong><p>${esc(text)}</p><button class="text-btn" aria-label="Kapat">Tamam ✓</button>`;f.hidden=false;f.querySelector('button').onclick=()=>{f.hidden=true};clearTimeout(showFact.t);showFact.t=setTimeout(()=>{f.hidden=true},12000)}

/* ---------- HUD ---------- */
function renderHud(){
  if(!S||!root)return;h('hubRoom').textContent=S.map.title;h('hubCount').textContent=S.players.size+' kişi burada';
  const q=h('hubQuest'),st=S.state,k=S.map.key,solo=S.players.size<2;
  if(k==='meydan')q.innerHTML='<b>Hedefler</b> 🦋 Yanındaki 3 kişiye "Merhaba" de · 🧭 Kaşif Kapısı: Gizemli Ada · 🖌️ Renk Atölyesi · 🥁 Ritim Sahnesi<br><small>Bu odalar tek başına çözülmez: ekip kur! 🤖 Pusula\'ya sor. Binalardaki 🎨🏺🎵🎮🛍️ gerçek görevleri dene.</small>';
  else if(k==='ada'){const n=st.clues.filter(Boolean).length;q.innerHTML=`<b>Gizemli Ada</b> ${st.gate?'🔓 Kapı açık':'🔒 Kapı kapalı'} · plakalar ${st.plates.map(p=>p?'●':'○').join(' ')} · ipuçları ${n}/3${st.done?' · ✅ tamamlandı':''}<br><small>${st.gate?'Üç ipucunu bul, sonra 🧰 sandığı aç.':(solo?'Yalnızsın: kapıyı iki kişi aynı anda iki ✦ plakasına basarak açar. Meydan\'a dönüp biriyle tanış!':'İki kişi aynı anda iki ✦ plakasına bassın (1,5 sn).')}</small>`}
  else if(k==='atolye')q.innerHTML=`<b>Renk Atölyesi</b> hedef: <span class="hub-chip" style="background:${st.css}">${esc(st.target)}</span> · ${Math.min(st.round,3)}/3${st.done?' · ✅ tamamlandı':''}<br><small>${st.hint?'İpucu: '+esc(st.hint):'Pedlere basıp renkleri karıştırın: hedef rengi hangi iki renk verir? (tam olarak iki ped, 1,5 sn)'} ${solo?'<br>Yalnızsın: iki ped aynı anda basılmalı, arkadaş bul!':''}</small>`;
  else if(k==='ritim')q.innerHTML=`<b>Ritim Sahnesi</b> kalıp ${Math.min(st.round+1,3)}/3: ${st.seq.map((n,i)=>`<span class="hub-chip ${i<st.pos?'ok':''}">${n+1}</span>`).join(' ')}${st.done?' · ✅ tamamlandı':''}<br><small>Davullara bu sırayla basın, ama art arda aynı kişi çalamaz! ${solo?'Yalnızsın: bir arkadaşla dönüşümlü çalın.':''}</small>`;
  q.hidden=false;renderSide();
}
function renderSide(){
  const p=h('hubSidePanel');if(!S||!p||p.hidden)return;
  p.innerHTML=`<h3>Yerler</h3>${S.map.interact.map(i=>`<button class="hub-row" data-go="${esc(i.id)}"><span>${i.emoji}</span>${esc(i.label)}<small>yürü ›</small></button>`).join('')}${(S.map.pads||[]).map((pl,k)=>`<button class="hub-row" data-pad="${k}"><span style="background:${pl.c}">✦</span>${esc(pl.label)}<small>yürü ›</small></button>`).join('')}<h3>Burada (${S.players.size})</h3>${[...S.players.values()].map(q=>`<div class="hub-row person"><span style="background:${COLORS[q.c]}">${FACES[q.e]}</span><button class="text-btn" data-p="${esc(q.id)}">${esc(q.n)}${q.id===S.id?' (sen)':''}</button><small>${q.st.map(s=>S.stamps[s]?.icon||'').join('')}</small>${q.id!==S.id?`<button class="text-btn" data-to="${esc(q.id)}">yanına git</button>`:''}</div>`).join('')}`;
  p.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const it=S.map.interact.find(i=>i.id===b.dataset.go);post('/api/hub/input',{tx:it.x,ty:it.y})});
  p.querySelectorAll('[data-pad]').forEach(b=>b.onclick=()=>{const pl=S.map.pads[Number(b.dataset.pad)];post('/api/hub/input',{tx:pl.x,ty:pl.y})});
  p.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const q=S.players.get(b.dataset.p);if(q)openCard(q)});
  p.querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>{const q=S.players.get(b.dataset.to);if(q)post('/api/hub/input',{tx:q.x+30,ty:q.y})});
}
function buildDock(){
  h('hubEmotes').innerHTML=info.emotes.map((e,i)=>`<button class="hub-emote" data-e="${i}" aria-label="Emoji: ${e}">${e}</button>`).join('');
  h('hubPhrases').innerHTML=info.phrases.map((t,i)=>`<button class="hub-phrase" data-p="${i}">${esc(t)}</button>`).join('');
  h('hubEmotes').querySelectorAll('button').forEach(b=>b.onclick=()=>post('/api/hub/say',{k:'e',i:Number(b.dataset.e)}));
  h('hubPhrases').querySelectorAll('button').forEach(b=>b.onclick=()=>post('/api/hub/say',{k:'p',i:Number(b.dataset.p)}));
}

/* ---------- Kartlar ---------- */
function openCard(p){
  const stamps=p.st.length?p.st.map(s=>`${S.stamps[s]?.icon||''} ${esc(S.stamps[s]?.label||s)}`).join(' · '):'Henüz damga yok';
  modal(`<div class="eyebrow">OYUNCU</div><h2><span class="hub-badge" style="background:${COLORS[p.c]}">${FACES[p.e]}</span> ${esc(p.n)}</h2><p>${stamps}</p><p class="rounded-note">${p.g?'Misafir oyuncu.':'Kayıtlı Scola üyesi.'} Sohbet yalnız hazır cümlelerle olur; kimseyle özel mesajlaşma yoktur.</p>${p.id===S.id?'':`<div class="modal-actions"><button class="btn light" id="hubMuteBtn">${mute.has(p.id)?'Sessizden çıkar':'Sessize al'}</button><button class="btn light" id="hubReportBtn">Bildir</button></div>`}`);
  const m=h('hubMuteBtn');if(m)m.onclick=()=>{mute.has(p.id)?mute.delete(p.id):mute.add(p.id);closeModal();toast(mute.has(p.id)?p.n+' sessize alındı.':'Sessizden çıkarıldı.')};
  const r=h('hubReportBtn');if(r)r.onclick=()=>{modal(`<div class="eyebrow">BİLDİR</div><h2>${esc(p.n)} için bildirim</h2><p>Bildirimlerini yöneticiler inceler. Yanlış bildirim yapma.</p><div class="hub-reasons">${info.reportReasons.map((t,i)=>`<button class="btn light" data-r="${i}">${esc(t)}</button>`).join('')}</div>`);h('modalContent').querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{const x=await post('/api/hub/report',{target:p.id,reason:Number(b.dataset.r)});closeModal();toast(x.ok?'Bildirimin alındı, teşekkürler.':(x.msg||'Bildirim gönderilemedi.'))})};
}
function openJournal(){
  if(!S)return;const mine=self()?.st||[],all=Object.entries(S.stamps);
  modal(`<div class="eyebrow">KEŞİF DEFTERİ</div><h2>${mine.length}/${all.length} damga</h2><p>Damgalar bir etkinliğin izidir; XP vermez ve kimseye üstünlük sağlamaz.</p><div class="journal">${all.map(([id,d])=>`<div class="journal-row ${mine.includes(id)?'got':''}"><span>${mine.includes(id)?d.icon:'❔'}</span><div><strong>${esc(d.label)}</strong><small>${esc(d.hint)}</small></div><b>${mine.includes(id)?'✓':''}</b></div>`).join('')}</div><p class="rounded-note">${self()?.g?'Misafir damgaları sayfa yenilenince kaybolur; kalıcı olması için hesap aç.':'Damgaların hesabında kalıcı olarak saklanır.'}</p>`);
}
function openAvatar(){
  let c=av.c,e=av.e;
  const paint=()=>{h('avPrev').style.background=COLORS[c];h('avPrev').textContent=FACES[e];h('avColors').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('sel',i===c));h('avFaces').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('sel',i===e))};
  modal(`<div class="eyebrow">KARAKTERİM</div><h2>Kendi görünümünü seç.</h2><div class="av-prev" id="avPrev"></div><div class="av-row" id="avColors">${COLORS.map((x,i)=>`<button style="background:${x}" aria-label="Renk ${i+1}"></button>`).join('')}</div><div class="av-row" id="avFaces">${FACES.map((x,i)=>`<button aria-label="Yüz ${i+1}">${x}</button>`).join('')}</div><button class="btn purple" id="avSave">Kaydet ↗</button><p class="rounded-note">Adın, hesabındaki görünen adındır; misafirlere rastgele bir ad verilir.</p>`);
  h('avColors').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{c=i;paint()});h('avFaces').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{e=i;paint()});paint();
  h('avSave').onclick=()=>{av.c=c;av.e=e;try{localStorage.setItem('scola-avatar',JSON.stringify(av))}catch{}closeModal();connect(S?.map.key||'meydan')};
}

/* ---------- Basit 2B görselleştirici (yedek) ---------- */
function resize(){
  if(!stage)return;const r=stage.getBoundingClientRect();
  if(R)R.resize(r.width,r.height);
  if(cv){dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr))}
  view.k=Math.max(.6,Math.min(1.25,r.width/720));view.w=r.width/view.k;view.h=r.height/view.k;
}
function frame(t){
  raf=requestAnimationFrame(frame);if(!S)return;const dt=Math.min(.1,(t-lastT)/1000||.016);lastT=t;
  const sm=1-Math.pow(.0001,dt);for(const p of S.players.values()){p.x+=(p.tx-p.x)*sm;p.y+=(p.ty-p.y)*sm}
  if(R)R.render(S,t/1000,dt,mute);else if(ctx)draw2d(t,sm);
  if(t-promptT>120){promptT=t;updatePrompt(self())}
}
function draw2d(t,sm){
  const me=self(),m=S.map;
  if(me){const cx=me.x-view.w/2,cy=me.y-view.h/2;const tx=view.w>=m.w?(m.w-view.w)/2:Math.max(0,Math.min(m.w-view.w,cx)),ty=view.h>=m.h?(m.h-view.h)/2:Math.max(0,Math.min(m.h-view.h,cy));view.x+=(tx-view.x)*Math.min(1,sm*1.4);view.y+=(ty-view.y)*Math.min(1,sm*1.4)}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=m.key==='ada'?'#8ecfe3':'#9cc79a';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr*view.k,0,0,dpr*view.k,-view.x*dpr*view.k,-view.y*dpr*view.k);
  drawWorld(t,m);drawPlayers(t);
}
function drawWorld(t,m){
  const c=ctx;
  if(m.key==='meydan'){
    for(let gy=0;gy<m.h;gy+=64)for(let gx=0;gx<m.w;gx+=64){c.fillStyle=((gx+gy)/64)%2?'#cfe6b5':'#c6e0ab';c.fillRect(gx,gy,64,64)}
    c.fillStyle='#eadfc8';c.beginPath();c.arc(640,400,230,0,7);c.fill();c.fillRect(80,372,1120,56);c.fillRect(610,150,60,500);
    for(const i of m.interact){c.beginPath();c.arc(i.x,i.y,22,0,7);c.fill()}
  }else if(m.key==='ada'){
    c.fillStyle='#f3e4b8';rr(c,0,0,m.w,m.h,60);c.fill();c.save();rr(c,0,0,m.w,m.h,60);c.clip();c.fillStyle='#e9d9a8';c.fillRect(660,0,m.w-660,m.h);c.restore();c.fillStyle='#d9f0a8';rr(c,700,40,m.w-740,m.h-80,40);c.fill();
  }else{c.fillStyle=m.key==='atolye'?'#d9b88a':'#2b2140';c.fillRect(0,0,m.w,m.h)}
  for(const o of m.obstacles)drawObstacle(o);
  const st=S.state;
  (m.pads||[]).forEach((pd,i)=>{const on=st.pads?.[i];c.fillStyle=on?'#d7eca9':pd.c;c.beginPath();c.arc(pd.x,pd.y,30,0,7);c.fill();c.strokeStyle=on?'#8aa857':'#00000044';c.lineWidth=4;c.stroke();c.fillStyle='#fff';c.font='700 12px Manrope,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(m.key==='ritim'?String(i+1):'✦',pd.x,pd.y+1)});
  if(m.gate&&!st.gate){const g=m.gate;c.fillStyle='#7a6a8c';c.fillRect(g.x,g.y,g.w,g.h);c.font='22px sans-serif';c.fillStyle='#fff';c.textAlign='center';c.fillText('🔒',g.x+g.w/2,g.y+g.h/2)}
  else if(m.gate){const g=m.gate;c.strokeStyle='#8aa857';c.setLineDash([6,6]);c.lineWidth=3;c.strokeRect(g.x,g.y,g.w,g.h);c.setLineDash([])}
  const me=self();c.textAlign='center';c.textBaseline='middle';
  for(const i of m.interact){
    const near=me&&Math.hypot(me.x-i.x,me.y-i.y)<i.r+20,clue=i.act==='clue'&&st.clues?.[i.arg],pulse=calm?0:Math.sin(t/300+i.x)*3;
    c.globalAlpha=clue?.45:1;c.strokeStyle=near?'#7a4fd0':'#ffffffcc';c.lineWidth=near?4:3;c.beginPath();c.arc(i.x,i.y,26+pulse,0,7);c.stroke();c.fillStyle='#ffffffdd';c.beginPath();c.arc(i.x,i.y,22,0,7);c.fill();
    c.font='24px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.fillStyle='#000';c.fillText(i.act==='chest'&&st.done?'🎁':i.emoji,i.x,i.y+1);c.globalAlpha=1;
    if(near||i.act!=='mission'){c.font='700 11px Manrope,sans-serif';const w=c.measureText(i.label).width+14;c.fillStyle='#40354ecc';rr(c,i.x-w/2,i.y+30,w,18,9);c.fill();c.fillStyle='#fff';c.fillText(i.label,i.x,i.y+39)}
  }
}
function drawObstacle(o){
  const c=ctx;
  if(o.k==='building'){c.fillStyle='#0000001a';rr(c,o.x+4,o.y+6,o.w,o.h,12);c.fill();c.fillStyle=o.color;rr(c,o.x,o.y,o.w,o.h,12);c.fill();c.fillStyle='#00000024';rr(c,o.x,o.y,o.w,o.h*.34,12);c.fill();
    c.fillStyle='#40354e';c.font='800 14px Manrope,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(o.label,o.x+o.w/2,o.y+o.h*.62)}
  else if(o.k==='tree'){c.fillStyle='#8a6a4a';c.fillRect(o.x+14,o.y+18,8,18);c.fillStyle='#6fb06a';c.beginPath();c.arc(o.x+18,o.y+14,19,0,7);c.fill()}
  else if(o.k==='rock'||o.k==='bucket'){c.fillStyle=o.c||'#a6a0b0';rr(c,o.x,o.y+6,o.w,o.h-6,14);c.fill()}
  else if(o.k==='fountain'){const cx=o.x+o.w/2,cy=o.y+o.h/2;c.fillStyle='#cfc6d8';c.beginPath();c.arc(cx,cy,34,0,7);c.fill();c.fillStyle='#8fd0ee';c.beginPath();c.arc(cx,cy,26,0,7);c.fill()}
  else if(o.k==='board'||o.k==='easel'){c.fillStyle='#d9b88a';rr(c,o.x,o.y,o.w,o.h,6);c.fill()}
  else if(o.k==='pillar'||o.k==='speaker'){c.fillStyle=o.k==='speaker'?'#2a2a36':'#cfc6d8';rr(c,o.x,o.y,o.w,o.h,6);c.fill()}
  else if(o.k==='wall'){c.fillStyle='#7a6a8c';c.fillRect(o.x,o.y,o.w,o.h)}
}
function wrap(c,text,max){const words=text.split(' '),lines=[];let cur='';for(const w of words){const n=cur?cur+' '+w:w;if(c.measureText(n).width>max&&cur){lines.push(cur);cur=w}else cur=n}lines.push(cur);return lines}
function drawPlayers(t){
  const c=ctx,list=[...S.players.values()].sort((a,b)=>a.y-b.y);
  for(const p of list){
    const bob=!calm&&p.mv?Math.sin(t/90)*2.5:0,me=p.id===S.id,ghost=mute.has(p.id);
    c.globalAlpha=ghost?.35:1;
    c.fillStyle='#0000002a';c.beginPath();c.ellipse(p.x,p.y+15,15,6,0,0,7);c.fill();
    c.fillStyle=COLORS[p.c];c.beginPath();c.arc(p.x,p.y-2+bob,16,0,7);c.fill();c.lineWidth=me?4:2.5;c.strokeStyle=me?'#40354e':'#ffffffcc';c.stroke();
    c.font='19px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(FACES[p.e],p.x,p.y-1+bob);
    c.font='700 11px Manrope,sans-serif';const label=p.n+(p.st.length?' '+p.st.map(s=>S.stamps[s]?.icon||'').join(''):''),w=c.measureText(label).width+14;
    c.fillStyle=me?'#d7eca9':'#ffffffe6';rr(c,p.x-w/2,p.y-42+bob,w,17,8);c.fill();c.fillStyle='#40354e';c.fillText(label,p.x,p.y-33+bob);
    if(p.say&&!ghost){if(t>p.say.until)p.say=null;else{
      if(p.say.e){c.font='30px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.fillText(p.say.t,p.x,p.y-64+bob)}
      else{c.font='600 12px Manrope,sans-serif';const lines=wrap(c,p.say.t,150),bw=Math.min(170,Math.max(...lines.map(l=>c.measureText(l).width))+18),bh=lines.length*15+10,bx=p.x-bw/2,by=p.y-48-bh+bob;c.fillStyle='#fff';c.strokeStyle='#d8c9ea';c.lineWidth=2;rr(c,bx,by,bw,bh,10);c.fill();c.stroke();c.fillStyle='#40354e';lines.forEach((l,i)=>c.fillText(l,p.x,by+13+i*15))}}}
    c.globalAlpha=1;
  }
}
function updatePrompt(me){
  const b=h('hubPrompt');if(!b||!me)return;
  const it=S.map.interact.filter(i=>Math.hypot(me.x-i.x,me.y-i.y)<i.r+20).sort((a,b)=>Math.hypot(me.x-a.x,me.y-a.y)-Math.hypot(me.x-b.x,me.y-b.y))[0]||null;
  if(it?.id!==curPrompt?.id){curPrompt=it;if(it){b.innerHTML=`<kbd>E</kbd> ${it.emoji} ${esc(it.label)}`;b.hidden=false}else b.hidden=true}
}

/* ---------- Görselleştirici seçimi ve yaşam döngüsü ---------- */
async function setRenderer(){
  const btn=h('hubMode');if(R){R.dispose();R=null}
  if(mode==='3d'&&window.ScolaHub3D){
    status('3B dünya yükleniyor…',true);
    try{R=await window.ScolaHub3D.create(stage,{onTap:tap,onCamera:()=>sendDir(true)})}catch(e){console.error(e);R=null}
    if(!R){mode='basic';status('3B bu cihazda açılamadı; basit görünüme geçildi.')}else status('');
  }
  cv.hidden=!!R;if(!R)ctx=cv.getContext('2d');
  if(btn)btn.textContent=R?'Basit görünüm':'3B görünüm';
  resize();if(S&&R){R.setClock(clockOff);R.setMap(S.map,S.state)}
}
async function start(){
  root=h('hubRoot');if(!root||started)return;started=true;cv=h('hubCanvas');stage=h('hubStage');
  mode=savedMode();bindOnce();bindStage();ro=new ResizeObserver(resize);ro.observe(stage);
  try{info=await api('GET','/api/hub/info')}catch{status('Sunucuya ulaşılamadı.',true);return}
  buildDock();await setRenderer();if(!started)return;connect('meydan');lastT=performance.now();raf=requestAnimationFrame(frame);
}
function stop(){started=false;if(es)es.close();es=null;cancelAnimationFrame(raf);ro?.disconnect();if(R){R.dispose();R=null}S=null;keys.clear();curPrompt=null;root=null}
const main=document.getElementById('main');
const sync=()=>{const r=h('hubRoot');if(r&&!started)start();else if(!r&&started)stop()};
if(main)new MutationObserver(sync).observe(main,{childList:true});
setInterval(sync,1500);sync();
addEventListener('pagehide',()=>{if(es)es.close()});
window.__hub={get r3d(){return R},get renderer(){return R?'3d':'2d'},get state(){return S},get mode(){return mode}};
})();
