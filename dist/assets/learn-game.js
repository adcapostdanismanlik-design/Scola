'use strict';
// Eğitimlerin oyunlaştırılması: yıldızlar, rozetler, beceri yolları, haftalık görevler, günün hızlı turu.
// Tasarım ilkeleri: ceza yok (seri kaybı ya da "can" yok), kişiler sıralanmaz (liderlik tablosu yok), kendi ilerlemeni görürsün.
// Her şey DEMO'dur: yalnız bu tarayıcıda saklanır ve Gelişim (Tohum/Fidan/Ağaç) sistemini etkilemez.
(()=>{
const L=()=>{const l=(state.learn=state.learn||{});for(const k of ['checks','stars','badges','days','daily','week','mods'])l[k]=l[k]||{};return l};
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const weekKey=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const w1=new Date(d.getFullYear(),0,4);return `${d.getFullYear()}-W${pad(1+Math.round(((d-w1)/864e5-3+(w1.getDay()+6)%7)/7))}`};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const mods=()=>coursesBase.filter(c=>c.modules);

const PATHS=[
 {id:'path-creative',icon:'🎨',name:'Yaratıcı Yol',courses:['color-palette','rhythm-basics','plain-writing','one-mechanic']},
 {id:'path-business',icon:'🛍️',name:'Girişimci Yol',courses:['first-week','plain-writing','small-profit']},
 {id:'path-mentor',icon:'🌱',name:'Yoldaşlık Yolu',courses:['first-week','culture-document','mentor-basics']}];
const done=id=>!!state.completions[id];
const BADGES=[
 {id:'first-output',icon:'📝',name:'İlk Çıktı',desc:'Bir eğitimin uygulama çıktısını tamamla.',test:()=>mods().some(c=>done(c.id))},
 {id:'three-areas',icon:'🧭',name:'Üç Alan Kaşifi',desc:'3 farklı alanda eğitim tamamla.',test:()=>new Set(mods().filter(c=>done(c.id)).map(c=>c.area)).size>=3},
 {id:'full-stars',icon:'🌟',name:'Tam Puan',desc:'Bir eğitimden 3 yıldız al.',test:()=>Object.values(L().stars).some(s=>s>=3)},
 {id:'all-demo',icon:'🏆',name:'Usta Eller',desc:'Bütün modüllü demo eğitimleri tamamla.',test:()=>mods().length>0&&mods().every(c=>done(c.id))},
 {id:'path-creative',icon:'🎨',name:'Yaratıcı Yol Tamam',desc:'Yaratıcı Yol\'un tüm eğitimlerini bitir.',test:()=>PATHS[0].courses.every(done)},
 {id:'path-business',icon:'🛍️',name:'Girişimci Yol Tamam',desc:'Girişimci Yol\'un tüm eğitimlerini bitir.',test:()=>PATHS[1].courses.every(done)},
 {id:'path-mentor',icon:'🌱',name:'Yoldaşlık Yolu Tamam',desc:'Yoldaşlık Yolu\'nun tüm eğitimlerini bitir.',test:()=>PATHS[2].courses.every(done)},
 {id:'color-found',icon:'🖌️',name:'Boya Ustası',desc:'Renk karıştırıcıda hedef rengi bul.',event:true},
 {id:'rhythm-play',icon:'🥁',name:'Ritim Avcısı',desc:'Ritim sekansöründe en az 4 vuruşluk kalıp çal.',event:true},
 {id:'break-even',icon:'🧮',name:'Hesap Kitap',desc:'Kâr hesaplayıcıda tam başa baş adedini bul.',event:true},
 {id:'source-sleuth',icon:'🔎',name:'Kaynak Dedektifi',desc:'Kaynak sınıflamasında 5/5 doğru yap.',event:true},
 {id:'jargon-hunter',icon:'✂️',name:'Sözcük Avcısı',desc:'Ağır sözcüklerin hepsini bul.',event:true},
 {id:'daily-5',icon:'⚡',name:'Düzenli Öğrenen',desc:'5 farklı günde hızlı tur oyna.',test:()=>Object.keys(L().daily).length>=5},
 {id:'quest-3',icon:'🎯',name:'Görev Avcısı',desc:'Bir haftanın 3 görevini de tamamla.',event:true}];

function unlock(id){
  const b=BADGES.find(x=>x.id===id),l=L();if(!b||l.badges[id])return false;
  l.badges[id]=today();save();
  if(typeof award==='function')award('badge-'+id,10);
  toast('🏅 Yeni rozet: '+b.icon+' '+b.name);if(typeof celebrate==='function')celebrate();
  return true;
}
const checkBadges=()=>{for(const b of BADGES)if(b.test&&!L().badges[b.id]&&b.test())unlock(b.id)};
const touchDay=()=>{L().days[today()]=true};
const wk=()=>{const l=L(),k=weekKey();if(!l.week[k])l.week[k]={modules:0,firstTry:0,completions:0,dailies:0,widgets:{}};for(const x of Object.keys(l.week))if(x!==k&&Object.keys(l.week).length>6)delete l.week[x];return l.week[k]};

/* ---------- Haftalık görevler ---------- */
const QUEST_POOL=[
 {id:'modules',text:'Bu hafta 3 modül bitir',goal:3,get:w=>w.modules},
 {id:'firsttry',text:'5 kendini yoklamayı ilk denemede doğru yap',goal:5,get:w=>w.firstTry},
 {id:'complete',text:'Bir eğitimin uygulama çıktısını tamamla',goal:1,get:w=>w.completions},
 {id:'daily',text:'Günün hızlı turunu 2 kez oyna',goal:2,get:w=>w.dailies},
 {id:'widgets',text:'2 farklı etkileşimli aracı dene',goal:2,get:w=>Object.keys(w.widgets).length}];
function quests(){const r=rng(hash(weekKey())),pool=[...QUEST_POOL],out=[];while(out.length<3){out.push(pool.splice(Math.floor(r()*pool.length),1)[0])}return out}
function checkQuests(){
  const w=wk(),key=weekKey(),qs=quests();let all=true;
  for(const q of qs){if(q.get(w)>=q.goal){if(typeof award==='function'&&award('q-'+key+'-'+q.id,15)){toast('🎯 Haftalık görev tamam: '+q.text)}}else all=false}
  if(all)unlock('quest-3');
}

/* ---------- Olaylar (courses.js çağırır) ---------- */
const keyOf=(id,mi,ci)=>`${id}:${mi}:${ci}`;
function onCheck(id,mi,ci,right){
  const l=L(),k=keyOf(id,mi,ci);touchDay();if(l.checks[k]===undefined){l.checks[k]=right?1:0;if(right){wk().firstTry++;if(typeof award==='function')award('cc-'+k,5)}}
  save();checkQuests();
}
function onStep(c,step){
  if(!c.modules||step<2)return;const l=L(),done0=step-2;// step s'e gelmek, modül s-1'i bitirmek demektir (indeks s-2)
  const key=c.id+':'+done0;if(!l.mods[key]){l.mods[key]=1;wk().modules++;touchDay();if(typeof award==='function')award('cm-'+key,10);save();checkQuests()}
}
function used(type){const w=wk();if(!w.widgets[type]){w.widgets[type]=1;touchDay();save();checkQuests()}}
function widget(badgeId){used(badgeId);unlock(badgeId)}
function starsFor(c,rubricAll,outLen){
  const l=L(),total=c.modules.reduce((t,m)=>t+(m.checks||[]).length,0);
  const firstTry=total===0||c.modules.every((m,mi)=>(m.checks||[]).every((_,ci)=>l.checks[keyOf(c.id,mi,ci)]===1));
  return 1+(firstTry?1:0)+(rubricAll&&outLen>=200?1:0);
}
function onComplete(id,rubric,outLen){
  const c=coursesBase.find(x=>x.id===id);if(!c||!c.modules)return;
  const l=L(),s=starsFor(c,rubric?.every?.(Boolean),outLen),prev=l.stars[id]||0;
  if(s>prev){l.stars[id]=s;if(prev>0)toast('⭐ Yıldızın yükseldi: '+'★'.repeat(s)+'☆'.repeat(3-s));if(s>=3&&typeof award==='function')award('cstar3-'+id,20)}
  wk().completions++;touchDay();save();checkBadges();checkQuests();
  for(const p of PATHS)if(p.courses.every(done)&&!l.badges[p.id]){/* rozet checkBadges ile verilir */}
}
function resetChecks(id){const l=L(),c=coursesBase.find(x=>x.id===id);if(!c)return;for(const k of Object.keys(l.checks))if(k.startsWith(id+':'))delete l.checks[k];save();toast('Kendini yoklamalar sıfırlandı: yıldız için yeniden dene.');if(typeof openCourse==='function')openCourse(id,0)}

/* ---------- Günün hızlı turu ---------- */
let run=null;
function pool(){const out=[];for(const c of mods())c.modules.forEach((m,mi)=>(m.checks||[]).forEach((ch,ci)=>out.push({c,mi,ci,ch})));return out}
function dailyQuestions(date){
  const r=rng(hash('daily-'+date)),p=pool(),qs=[];
  while(qs.length<5&&p.length){const it=p.splice(Math.floor(r()*p.length),1)[0],order=it.ch.options.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]]}qs.push({course:it.c.title,q:it.ch.q,explain:it.ch.explain,options:order.map(i=>it.ch.options[i]),answer:order.indexOf(it.ch.answer)})}
  return qs;
}
function dailyStart(){
  const date=today(),first=!L().daily[date];run={date,qs:dailyQuestions(date),i:0,correct:0,combo:0,best:0,first};dailyShow();
}
function dailyShow(){
  const r=run;if(!r)return;
  if(r.i>=r.qs.length)return dailyEnd();
  const q=r.qs[r.i];
  modal(`<div class="eyebrow">⚡ GÜNÜN HIZLI TURU · ${r.i+1}/${r.qs.length}</div><h2>${esc(q.q)}</h2><p class="rounded-note">${esc(q.course)} eğitiminden. ${r.first?'Bugünün ilk turu: demo XP kazanırsın.':'Bugün zaten oynadın: bu tur alıştırma, XP yok.'} Yanlış cevap ceza getirmez.</p><div class="lg-combo" aria-live="polite">${r.combo>=2?'🔥 Kombo ×'+r.combo:'&nbsp;'}</div><div class="ck-opts">${q.options.map((o,i)=>`<button class="btn light small" onclick="LearnGame.answer(${i})">${esc(o)}</button>`).join('')}</div><p class="ck-fb" id="lgFb" role="status"></p><div class="lg-dots">${r.qs.map((_,i)=>`<i class="${i<r.i?'done':i===r.i?'cur':''}"></i>`).join('')}</div>`);
}
function answer(i){
  const r=run;if(!r||r.locked)return;const q=r.qs[r.i],right=i===q.answer;r.locked=true;
  document.querySelectorAll('.ck-opts button').forEach((b,k)=>{b.disabled=true;if(k===q.answer)b.classList.add('ok');else if(k===i)b.classList.add('bad')});
  if(right){r.correct++;r.combo++;r.best=Math.max(r.best,r.combo)}else r.combo=0;
  const fb=document.getElementById('lgFb');if(fb)fb.textContent=(right?(r.combo>=2?'✓ Doğru! 🔥 Kombo ×'+r.combo+'. ':'✓ Doğru. '):'Tam değil. ')+q.explain;
  setTimeout(()=>{r.locked=false;r.i++;dailyShow()},right?900:1700);
}
function dailyEnd(){
  const r=run,l=L(),stars=r.correct>=5?3:r.correct>=3?2:1;
  if(r.first){l.daily[r.date]={correct:r.correct,best:r.best,stars};wk().dailies++;touchDay();if(typeof award==='function')award('daily-'+r.date,10+4*r.correct+(r.best>=3?5:0));save();checkBadges();checkQuests()}
  else{wk().dailies++;save();checkQuests()}
  modal(`<div class="eyebrow">⚡ TUR BİTTİ</div><h2>${'★'.repeat(stars)+'☆'.repeat(3-stars)} ${r.correct}/${r.qs.length} doğru</h2><p>${r.best>=3?`🔥 En iyi kombon ×${r.best}! `:''}${r.first?`Demo XP kazandın (+${10+4*r.correct+(r.best>=3?5:0)}).`:'Alıştırma turuydu.'} Yarın yeni sorular gelir; kaçırdığın gün bir şey kaybettirmez.</p><div class="modal-actions"><button class="btn purple" onclick="LearnGame.dailyStart()">Alıştırma turu ↻</button><button class="btn light" onclick="closeModal();renderPage('academy')">Kapat</button></div>`);
  if(r.correct===5&&typeof celebrate==='function')celebrate();run=null;
}

/* ---------- Pano (Akademi) ---------- */
const starTxt=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function stars(id){const n=(state.learn?.stars||{})[id];return n?`<span class="lg-stars" title="Ustalık yıldızları">${starTxt(n)}</span>`:''}
function dashboard(){
  if(!mods().length)return '';
  const l=L(),w=wk(),qs=quests(),totalStars=Object.values(l.stars).reduce((t,s)=>t+s,0),earned=Object.keys(l.badges).length;
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`});
  const activeDays=days.filter(d=>l.days[d]).length,dDone=!!l.daily[today()];
  const pathsHtml=PATHS.map(p=>{const cs=p.courses.map(id=>coursesBase.find(c=>c.id===id)).filter(Boolean),n=cs.filter(c=>done(c.id)).length;
    return `<div class="lg-path ${n===cs.length?'complete':''}"><div class="lg-path-h"><span>${p.icon}</span><strong>${esc(p.name)}</strong><small>${n}/${cs.length}${n===cs.length?' · tamam 🎉':''}</small></div><div class="lg-chain">${cs.map((c,i)=>`${i?'<i aria-hidden="true">›</i>':''}<button class="lg-node ${done(c.id)?'done':''}" onclick="openCourse('${esc(c.id)}')" title="${esc(c.title)}"><span>${done(c.id)?'✓':i+1}</span><small>${esc(c.title.length>26?c.title.slice(0,24)+'…':c.title)}</small>${stars(c.id)}</button>`).join('')}</div></div>`}).join('');
  return `<section class="panel lg-board" aria-label="Öğrenme panosu"><div class="lg-top"><div><div class="eyebrow">ÖĞRENME PANOSU · DEMO</div><h3>Yolun, yıldızların ve rozetlerin</h3></div><button class="btn lime" onclick="LearnGame.dailyStart()">⚡ Günün hızlı turu${dDone?' ✓':''}</button></div>
  <div class="lg-stats"><div><b>⭐ ${totalStars}</b><small>yıldız</small></div><div><b>🏅 ${earned}/${BADGES.length}</b><small>rozet</small></div><div><b>📅 ${activeDays}/7</b><small>bu hafta aktif gün</small></div><div class="lg-week">${days.map(d=>`<i class="${l.days[d]?'on':''}" title="${d}"></i>`).join('')}</div></div>
  <h4>🎯 Bu haftanın görevleri</h4><div class="lg-quests">${qs.map(q=>{const v=Math.min(q.get(w),q.goal);return `<div class="lg-quest ${v>=q.goal?'done':''}"><span>${v>=q.goal?'✓':'○'} ${esc(q.text)}</span><div class="progress-track"><span style="width:${v/q.goal*100}%"></span></div><small>${v}/${q.goal} · +15 XP</small></div>`}).join('')}</div>
  <h4>🗺️ Beceri yolları</h4><div class="lg-paths">${pathsHtml}</div>
  <details class="lg-badges"><summary>🏅 Rozetler (${earned}/${BADGES.length})</summary><div class="lg-bgrid">${BADGES.map(b=>`<div class="lg-badge ${l.badges[b.id]?'on':''}" title="${esc(b.desc)}"><span>${l.badges[b.id]?b.icon:'❔'}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div></details>
  <p class="rounded-note">Oyunlaştırma yalnız öğrenmeyi eğlenceli kılar: ceza, seri kaybı ya da liderlik tablosu yoktur. XP ve rozetler bu tarayıcıdaki demo ilerlemedir; Gelişim (Tohum/Fidan/Ağaç) aşamanı etkilemez.</p></section>`;
}
function courseGoalHtml(c){
  const l=L(),n=l.stars[c.id]||0;
  return `<div class="result lg-goal"><strong>Ustalık yıldızları</strong> <span class="lg-stars">${starTxt(n)}</span><br><small>★ eğitimi tamamla · ★★ tüm kendini yoklamaları ilk denemede doğru yap · ★★★ ölçütlerin hepsini işaretle ve en az 200 karakterlik ayrıntılı bir çıktı yaz. (+10 XP her modül, +5 XP ilk denemede doğru yoklama, 3 yıldızda +20 XP.)</small>${n&&n<3?`<br><button class="text-btn" onclick="LearnGame.resetChecks('${esc(c.id)}')">Yoklamaları sıfırla, yıldız için yeniden dene ↻</button>`:''}</div>`;
}
window.LearnGame={onCheck,onStep,onComplete,widget,used,dashboard,stars,courseGoalHtml,dailyStart,answer,resetChecks,BADGES,PATHS,
  _test:{dailyQuestions,quests,weekKey,starsFor,hash,checkBadges}};
})();
