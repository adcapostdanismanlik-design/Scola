'use strict';
// Gelişim yolum: Tohum → Fidan → Ağaç → Orman. Seviye oyundan (Meydan, damgalar) bağımsızdır ve yalnız sunucuda
// doğrulanmış katkılardan, zamandan ve mentörlük kayıtlarından hesaplanır. Bu dosya yalnız gösterir ve istek gönderir.
(()=>{
const G=window.SCOLA_GROWTH;
let data=null,forests=[],mentors=[],queue=null,saplings=[],loading=false;
const pctW=p=>Math.round(Math.max(0,Math.min(1,p))*100);
const bar=p=>`<div class="progress-track"><span style="width:${pctW(p)}%"></span></div>`;
const days=ms=>Math.max(0,Math.floor((Date.now()-ms)/864e5));
const isTree=()=>data?.stage==='agac';
const q=(s,r=document)=>r.querySelector(s);

function render(){
  return intro('Gelişim yolum.','Tohumdan ormana: yoldaşlık eden mentörlerle, oyundan bağımsız, doğrulanmış katkıyla büyü.')+
  '<div class="notice"><strong>Bu sistem oyundan bağımsızdır.</strong> Meydan\'daki damgalar, ziyaret süresi, takipçi ya da para harcama seviyeni değiştirmez. Seviye yalnız bağımsız incelemede kabul edilen katkılarından, zamandan ve mentörlük kayıtlarından oluşur. Eşikler pilot hipotezidir; gerçek veriyle ayarlanacaktır.</div><div id="gwBody"><div class="empty"><p>Yükleniyor…</p></div></div>';
}
function mount(){load()}

async function load(){
  if(loading)return;loading=true;
  try{
    if(!live.user){data=null;paintDemo();return}
    data=await api('GET','/api/me/growth');
    const [f,m]=await Promise.all([api('GET','/api/forests'),api('GET','/api/mentors')]);forests=f.forests;mentors=m.mentors;
    queue=null;saplings=[];
    if(isTree()){const [qq,ss]=await Promise.all([api('GET','/api/tree-applications/queue').catch(()=>null),api('GET','/api/saplings').catch(()=>({saplings:[]}))]);queue=qq;saplings=ss.saplings}
    await refreshLive();paint();
  }catch(e){const b=document.getElementById('gwBody');if(b)b.innerHTML=`<div class="notice">${esc(e.message||'Gelişim verisi yüklenemedi.')}</div>`}
  finally{loading=false}
}

/* ---------- Ortak parçalar ---------- */
function pathHtml(cur){
  const order=G.STAGES.map(s=>s.id),ci=order.indexOf(cur);
  return `<div class="gw-path" role="list">${G.STAGES.map((s,i)=>`<div class="gw-node ${i===ci?'cur':''} ${i<ci?'done':''}" role="listitem"><span>${s.emoji}</span><b>${s.name}</b><small>${i<ci?'tamam':i===ci?'şu an':''}</small></div>${i<G.STAGES.length-1?'<i aria-hidden="true">›</i>':''}`).join('')}<i aria-hidden="true">›</i><div class="gw-node forest" role="listitem"><span>${G.FOREST.emoji}</span><b>${G.FOREST.name}</b><small>topluluk</small></div></div>`;
}
function reqHtml(list){
  return `<div class="gw-reqs">${list.map(r=>`<div class="gw-req ${r.met?'met':''}"><div><strong>${r.met?'✓ ':''}${esc(r.label)}</strong><small>${esc(String(r.display))} / ${r.key==='rate'?Math.round(r.need*100)+'%':r.need}${r.gate?' · bu adım kayıtla doğrulanır':''}</small></div>${bar(r.pct)}</div>`).join('')}</div>`;
}
function routeHtml(){
  const sel=data?.route?.areas||[];
  const chips=G.ROUTE_AREAS.map(a=>`<label class="gw-chip"><input type="checkbox" name="gwArea" value="${a}" ${sel.includes(a)?'checked':''}><span>${esc(G.AREAS[a])}</span></label>`).join('');
  const prog=(data?.routeProgress||[]).map(r=>`<div class="gw-route"><strong>${esc(r.label)}</strong> <small>${r.done}/${r.total}</small>${bar(r.done/r.total)}<ul>${r.steps.map(s=>`<li class="${s.done?'done':''}">${s.done?'✓':'○'} ${esc(s.label)}</li>`).join('')}</ul></div>`).join('');
  return `${section('Başlangıç rotan','En fazla iki alan seç ve hedefini yaz. Kilometre taşları doğrulanmış katkılarından ölçülür; mentörün puan vermez, yol gösterir.')}<div class="panel"><form id="gwRouteForm"><div class="gw-chips">${chips}</div><label class="field" for="gwGoal">Hedefin</label><input class="input" id="gwGoal" maxlength="200" value="${esc(data?.route?.goal||'')}" placeholder="Örn. Resim yapıp bir sergi açmak"><p class="error" id="gwRouteErr" role="alert"></p><button class="btn purple small">Rotamı kaydet</button></form>${prog?`<div class="gw-routes">${prog}</div>`:''}</div>`;
}
function mentorshipCard(m){
  const other=m.role==='mentor'?m.mentee:m.mentor;
  const notes=m.notes.slice(-4).map(n=>`<div class="rounded-note"><strong>${n.by==='mentor'?'Mentör':'Öğrenci'}:</strong> ${esc(n.text)}</div>`).join('');
  const apr=m.apprentice&&m.apprentice.status!=='declined'?`<div class="rounded-note">🌱 Çırak: <strong>${esc(m.apprentice.name)}</strong> · ${m.apprentice.status==='invited'?'davet bekliyor':'etkin'+(m.apprentice.since?' · '+days(m.apprentice.since)+' gün':'')}</div>`:'';
  let actions='';
  if(m.status==='pending'&&m.role==='mentor')actions=`<button class="btn purple small" onclick="ScolaGrowthUI.respond('${esc(m.id)}',true)">Kabul et</button><button class="btn light small" onclick="ScolaGrowthUI.respond('${esc(m.id)}',false)">Reddet</button>`;
  if(m.status==='active'){
    actions=`<button class="btn light small" onclick="ScolaGrowthUI.note('${esc(m.id)}')">Not yaz</button><button class="btn light small" onclick="ScolaGrowthUI.end('${esc(m.id)}')">Mentörlüğü bitir</button>`;
    if(m.role==='mentor'&&(!m.apprentice||m.apprentice.status==='declined'))actions+=`<button class="btn light small" onclick="ScolaGrowthUI.inviteApprentice('${esc(m.id)}')">🌱 Çırak ekle</button>`;
  }
  if(m.role==='apprentice'&&m.apprentice?.status==='invited')actions=`<button class="btn purple small" onclick="ScolaGrowthUI.apprentice('${esc(m.id)}',true)">Çırak olmayı kabul et</button><button class="btn light small" onclick="ScolaGrowthUI.apprentice('${esc(m.id)}',false)">Reddet</button>`;
  const roleTxt={mentor:'Öğrencin',mentee:'Mentörün',apprentice:'Çırak olduğun mentörlük'}[m.role];
  return `<div class="review-box"><strong>${roleTxt}: ${esc(other.name)}</strong> <span class="badge ${m.status==='active'?'':'gray'}">${{pending:'Bekliyor',active:'Etkin',declined:'Reddedildi',ended:'Bitti'}[m.status]}</span>${m.message&&m.status==='pending'?`<br>${esc(m.message)}`:''}${apr}${notes}<div class="modal-actions">${actions}</div></div>`;
}
function mentorSection(){
  const mine=data.mentorships.filter(m=>['pending','active'].includes(m.status)||(m.role==='apprentice'&&m.apprentice?.status==='invited'));
  const asMentee=mine.filter(m=>m.role==='mentee'),others=mine.filter(m=>m.role!=='mentee');
  let html='';
  if(isTree()){
    const pend=others.filter(m=>m.role==='mentor'&&m.status==='pending'),act=others.filter(m=>m.role==='mentor'&&m.status==='active');
    html+=`${section('Mentörlüğün',`Etkin öğrenci: ${data.load}/${data.cap}. Üst sınır, mentörlerin tükenmemesi içindir.`)}${pend.length?`<h3>Bekleyen talepler</h3>${pend.map(mentorshipCard).join('')}`:''}${act.length?act.map(mentorshipCard).join(''):'<div class="empty"><p>Henüz etkin öğrencin yok. Tohumlar mentör dizininden sana talep gönderebilir.</p></div>'}`;
  }else{
    html+=section('Yoldaşın: mentörün','Mentör şart değildir; ama yolculuğu birlikte yürümek büyümeyi hızlandırır ve Ağaç\'a giden yolda çırak mentörlük gerekir.');
    if(asMentee.length)html+=asMentee.map(mentorshipCard).join('');
    else html+=`<div class="panel"><p>Henüz bir mentörün yok. Bir Ağaç seç ve ona kısa bir mesaj gönder.</p><div class="gw-mentors">${mentors.length?mentors.map(m=>`<div class="gw-mentor"><div><strong>${esc(m.name)}</strong> ${m.founding?'<span class="badge purple">Kurucu Ağaç</span>':'<span class="badge">🌳 Ağaç</span>'}<small>${m.areas.length?m.areas.map(a=>esc(a.label)).join(', '):'alan bilgisi yok'} · ${m.load}/${m.cap} öğrenci · ${m.mentored} kişiye yoldaş oldu</small></div><button class="btn light small" ${m.load>=m.cap?'disabled':''} onclick="ScolaGrowthUI.request('${esc(m.id)}','${esc(m.name)}')">${m.load>=m.cap?'Dolu':'Mentör iste'}</button></div>`).join(''):'<div class="empty"><p>Henüz mentör (Ağaç) yok. İlk Kurucu Ağaçlar yönetici tarafından atanır.</p></div>'}</div></div>`;
    const apprInv=others.filter(m=>m.role==='apprentice');if(apprInv.length)html+=`<h3>Çırak mentörlük</h3>${apprInv.map(mentorshipCard).join('')}`;
  }
  return html;
}
function applicationSection(){
  if(data.stage!=='fidan')return '';
  const a=data.application;
  let body='';
  if(a&&a.status==='open')body=`<div class="review-box"><strong>Adaylığın değerlendiriliyor.</strong> ${a.evals.length} değerlendirme geldi.${a.evals.map(e=>`<div class="rounded-note"><strong>${esc(e.label)} · ${e.pass?'Onay':'Gelişim önerisi'}:</strong> ${esc(e.feedback)}</div>`).join('')}</div>`;
  else if(data.canApplyTree)body=`<form id="gwApplyForm"><p>Önkoşulların tamam. Mentörler Birliği'ne neden hazır olduğunu anlat; iki bağımsız Ağaç rubrikle değerlendirecek.</p><label class="field" for="gwStatement">Adaylık metnin (en az 100 karakter)</label><textarea id="gwStatement" minlength="100" maxlength="1500" required></textarea><p class="error" id="gwApplyErr" role="alert"></p><button class="btn purple small">Mentörler Birliği'ne başvur ↗</button></form>`;
  else body=`<p>Ağaç olmak için yeterli yetkinlik, zaman ve çırak mentörlük gerekir. Aşağıdaki liste ilerlemeni gösterir.</p>${data.retryAt?`<p class="rounded-note">Tekrar başvuru: ${new Date(data.retryAt).toLocaleDateString('tr-TR')} sonrası.</p>`:''}${a&&a.status==='failed'?`<div class="review-box"><strong>Önceki adaylık sonuçlanmadı:</strong> ${a.evals.map(e=>esc(e.feedback)).join('<br>')}</div>`:''}`;
  return `${section('Mentörler Birliği: Ağaç adaylığı','Fidanlar yeterli bilginliğe ulaşınca Ağaç olur ve yeni tohumlara yoldaşlık eder.')}<div class="panel">${body}</div>`;
}
function queueSection(){
  if(!isTree()||!queue)return '';
  const items=queue.queue.map(a=>`<article class="panel" style="margin-bottom:14px"><div class="eyebrow">${esc(a.candidate)} · ${a.evaluated}/${queue.need} değerlendirme</div><div class="gw-mini">${a.stats.xp} XP · ${a.stats.accepted} kabul · ${a.stats.areas} alan · ${a.stats.tenureDays} gün · çırak mentörlük ${a.stats.apprenticeSeeds}</div><div class="read-note">${esc(a.statement)}</div>${a.contributions.length?`<small>Kabul edilen katkılar: ${a.contributions.map(esc).join(' · ')}</small>`:''}<div class="fund-check">${queue.rubric.map(k=>`<label><input type="checkbox" id="rb-${esc(a.id)}-${k}"><span>${{bilgi:'Alanında yeterli bilgi ve uygulama gösterdi',geriBildirim:'Yapıcı, saygılı ve faydalı geri bildirim veriyor',guvenilirlik:'Güvenilir ve tutarlı katkı geçmişi var',paylasim:'Bilgisini paylaşmaya ve başkasını yetiştirmeye istekli'}[k]}</span></label>`).join('')}</div><label class="field" for="fb-${esc(a.id)}">Geri bildirim (en az 40 karakter)</label><textarea id="fb-${esc(a.id)}" maxlength="1500"></textarea><div class="modal-actions"><button class="btn purple small" onclick="ScolaGrowthUI.evaluate('${esc(a.id)}')">Değerlendirmemi gönder</button><button class="text-btn" onclick="ScolaGrowthUI.conflict('${esc(a.id)}')">Çıkar çatışması beyan et</button></div></article>`).join('');
  return `${section('Ağaç adaylıklarını değerlendir',`Kör ve bağımsız: adayın adı gizli; kendi mentörlük bağın olan adaylar kuyruğa gelmez. Onay için ${queue.need} bağımsız "uygun" gerekir; dört ölçütün hepsi sağlanmalı.`)}${items||'<div class="empty"><p>Değerlendirmeni bekleyen aday yok.</p></div>'}`;
}
function forestMetrics(m){
  return `<div class="gw-fm"><div><b>${m.trees}</b><small>ağaç</small></div><div><b>${m.seeds}</b><small>tohum barınıyor</small></div><div><b>${m.saplingsGrown}</b><small>fidan oldu</small></div><div><b>${m.treesGrown}</b><small>ağaç oldu</small></div><div><b>${m.retention==null?'—':Math.round(m.retention*100)+'%'}</b><small>son 30 gün aktif</small></div><div><b>${m.loadMax}/${G.RULES.mentorCap}</b><small>en yüklü mentör</small></div></div>`;
}
function forestSection(){
  const tree=isTree();
  const mine=forests.filter(f=>f.me==='member').length;
  const cards=forests.map(f=>{
    const st=f.metrics.status,inv=f.me==='invited';
    return `<article class="panel gw-forest"><div class="eyebrow">${G.FOREST.emoji} ${esc(f.areaLabel)} · ${f.metrics.ageDays} gün</div><h3>${esc(f.name)} <span class="badge ${st.healthy?'':'gray'}">${esc(st.label)}</span></h3><p>${esc(f.mission)}</p>${forestMetrics(f.metrics)}<small>Ağaçlar: ${f.members.filter(m=>m.status==='member').map(m=>esc(m.name)).join(', ')}${f.members.some(m=>m.status==='invited')?' · davetli: '+f.members.filter(m=>m.status==='invited').map(m=>esc(m.name)).join(', '):''}</small><div class="modal-actions">${inv?`<button class="btn purple small" onclick="ScolaGrowthUI.forest('${esc(f.id)}','join')">Daveti kabul et</button>`:''}${f.me==='member'?`<button class="btn light small" onclick="ScolaGrowthUI.inviteTree('${esc(f.id)}')">Ağaç davet et</button><button class="btn light small" onclick="ScolaGrowthUI.forest('${esc(f.id)}','leave')">Ormandan ayrıl</button>`:''}</div></article>`}).join('');
  return `${section('Ormanlar','Orman, en az üç Ağacın kurduğu ve yeni nesilleri sürdürülebilir biçimde yetiştiren topluluktur. Metrikler topluluğu gösterir; kişileri sıralamaz ya da puanlamaz.',tree&&mine<G.RULES.maxForestsPerTree?`<button class="btn purple small" onclick="ScolaGrowthUI.newForest()">＋ Orman kur</button>`:'')}${cards||'<div class="empty"><p>Henüz orman yok. Üç Ağaç bir araya gelince ilk orman kurulabilir.</p></div>'}`;
}

/* ---------- Sayfa ---------- */
function paint(){
  const b=document.getElementById('gwBody');if(!b||!data)return;
  const m=data.meta;
  b.innerHTML=`<div class="panel gw-hero"><div class="gw-big">${m.emoji}</div><div><div class="eyebrow">ŞU ANKİ AŞAMAN${data.founding?' · KURUCU AĞAÇ':''}</div><h2>${m.name}</h2><p>${esc(m.tag)}</p></div></div>${pathHtml(data.stage)}
  ${data.stage==='agac'?`<div class="notice">🌳 Ağaçsın: yeni tohumlara yoldaşlık eder, Ağaç adaylıklarını değerlendirir ve ormanlar kurarsın. ${data.founding?'Kurucu Ağaç, ilk mentörleri oluşturmak için yöneticice atanır; zamanla yerini topluluğun yetiştirdiği Ağaçlar alır.':''}</div>`:`${section('Sıradaki adım: '+(data.next==='fidan'?'🌱 Fidan':'🌳 Ağaç'),'Kayıtla doğrulanan ilerlemen:')}<div class="panel">${bar(data.progress)}${reqHtml(data.requirements)}<p class="rounded-note">${data.stats.xp} doğrulanmış XP · ${data.stats.accepted} kabul edilen katkı · ${data.stats.areas} alan · hesap ${data.stats.tenureDays} günlük.</p></div>`}
  ${applicationSection()}${data.stage==='agac'?'':routeHtml()}${mentorSection()}${queueSection()}${forestSection()}`;
  bind();
}
function paintDemo(){
  const b=document.getElementById('gwBody');if(!b)return;
  const gd=typeof demoGrowth==='function'?demoGrowth():G.computeGrowth({xp:0,accepted:0,areas:0,decided:0,tenureDays:0});
  b.innerHTML=`<div class="panel gw-hero"><div class="gw-big">${gd.meta.emoji}</div><div><div class="eyebrow">DEMO GÖSTERİMİ</div><h2>${gd.meta.name}</h2><p>${esc(gd.meta.tag)}</p></div></div>${pathHtml(gd.stage)}
  <div class="notice"><strong>Giriş yapınca doğrulanmış aşamanı görürsün.</strong> Bu tarayıcıdaki demo ilerleme bağımsız doğrulama içermez ve gerçek seviye sayılmaz. ${live.available?'<button class="text-btn" onclick="openAccount(\'register\')">Hesap aç ↗</button>':'Gerçek hesap için sunucuyu başlat: <code>npm run dev</code>.'}</div>
  ${section('Aşamalar nasıl işler?','Eşikler pilot hipotezidir.')}<div class="gw-explain">${G.STAGES.map(s=>`<div class="panel"><div class="gw-big sm">${s.emoji}</div><h3>${s.name}</h3><p>${esc(s.tag)}</p></div>`).join('')}<div class="panel"><div class="gw-big sm">${G.FOREST.emoji}</div><h3>${G.FOREST.name}</h3><p>${esc(G.FOREST.tag)}</p></div></div>
  ${section('Sıradaki adım (demo)','Bu tarayıcıdaki demo ilerlemene göre:')}<div class="panel">${gd.requirements.length?reqHtml(gd.requirements.map(r=>({...r,display:r.fmt(r.have)}))):''}</div>`;
}

/* ---------- Etkileşimler ---------- */
async function act(method,url,body,ok){try{const r=await api(method,url,body);if(ok)toast(ok);await load();return r}catch(e){toast(e.message);return null}}
function bind(){
  const rf=q('#gwRouteForm');if(rf)rf.onsubmit=async e=>{e.preventDefault();const areas=[...document.querySelectorAll('input[name=gwArea]:checked')].map(x=>x.value);try{await api('POST','/api/me/route',{areas,goal:q('#gwGoal').value});toast('Rotan kaydedildi.');await load()}catch(err){q('#gwRouteErr').textContent=err.message}};
  const af=q('#gwApplyForm');if(af)af.onsubmit=async e=>{e.preventDefault();try{await api('POST','/api/tree-applications',{statement:q('#gwStatement').value});toast('Adaylığın değerlendiriciye gönderildi.');await load()}catch(err){q('#gwApplyErr').textContent=err.message}};
}
const API={render,mount,
  request(id,name){modal(`<div class="eyebrow">MENTÖR İSTE</div><h2>${esc(name)} yoldaşın olsun mu?</h2><p>Hedefini ve neden onu seçtiğini kısaca yaz. Mentör kabul ederse yolculuğunuz başlar. Aynı anda 3 bekleyen talebin olabilir.</p><form id="gwReq"><label class="field" for="gwMsg">Mesajın (en az 20 karakter)</label><textarea id="gwMsg" minlength="20" maxlength="500" required></textarea><p class="error" id="gwReqErr" role="alert"></p><button class="btn purple">Talebi gönder ↗</button></form>`);q('#gwReq').onsubmit=async e=>{e.preventDefault();try{await api('POST','/api/mentorships',{mentorId:id,message:q('#gwMsg').value});closeModal();toast('Talebin gönderildi.');await load()}catch(err){q('#gwReqErr').textContent=err.message}}},
  respond:(id,accept)=>act('POST',`/api/mentorships/${id}/respond`,{accept},accept?'Mentörlük başladı.':'Talep reddedildi.'),
  end(id){modal(`<div class="eyebrow">MENTÖRLÜĞÜ BİTİR</div><h2>Neden bitiriyorsun?</h2><form id="gwEnd"><textarea id="gwReason" minlength="5" maxlength="300" required></textarea><p class="error" id="gwEndErr" role="alert"></p><button class="btn purple">Bitir</button></form>`);q('#gwEnd').onsubmit=async e=>{e.preventDefault();try{await api('POST',`/api/mentorships/${id}/end`,{reason:q('#gwReason').value});closeModal();await load()}catch(err){q('#gwEndErr').textContent=err.message}}},
  note(id){modal(`<div class="eyebrow">NOT</div><h2>Gözlem, yönlendirme ya da yansıtma.</h2><p>Notlar puan vermez; yolculuğun izidir.</p><form id="gwNote"><textarea id="gwText" minlength="10" maxlength="600" required></textarea><p class="error" id="gwNoteErr" role="alert"></p><button class="btn purple">Kaydet</button></form>`);q('#gwNote').onsubmit=async e=>{e.preventDefault();try{await api('POST',`/api/mentorships/${id}/note`,{text:q('#gwText').value});closeModal();await load()}catch(err){q('#gwNoteErr').textContent=err.message}}},
  inviteApprentice(id){modal(`<div class="eyebrow">ÇIRAK MENTÖR</div><h2>Bir Fidan'ı çırak yap.</h2><p>Çırak, bu mentörlüğü izler ve öğrenir. En az 14 gün sürmeli ve öğrencin bu sürede gerçek bir katkı üretmeli; böylece çırak Ağaç adaylığına yaklaşır.</p>${saplings.length?saplings.map(s=>`<div class="gw-mentor"><div><strong>${esc(s.name)}</strong><small>${s.accepted} kabul · ${s.areas} alan · ${s.tenureDays} gün</small></div><button class="btn light small" data-sap="${esc(s.id)}">Davet et</button></div>`).join(''):'<div class="empty"><p>Şu an çırak olabilecek Fidan yok.</p></div>'}`);document.querySelectorAll('[data-sap]').forEach(b=>b.onclick=async()=>{try{await api('POST',`/api/mentorships/${id}/apprentice`,{userId:b.dataset.sap});closeModal();toast('Davet gönderildi.');await load()}catch(err){toast(err.message)}})},
  apprentice:(id,accept)=>act('POST',`/api/mentorships/${id}/apprentice/accept`,{accept},accept?'Çırak mentörlük başladı.':'Davet reddedildi.'),
  async evaluate(id){const rubric=Object.fromEntries(queue.rubric.map(k=>[k,!!document.getElementById(`rb-${id}-${k}`)?.checked]));try{const r=await api('POST',`/api/tree-applications/${id}/evaluate`,{rubric,feedback:document.getElementById('fb-'+id).value});toast(r.outcome==='passed'?'Aday Ağaç oldu 🌳':r.outcome==='failed'?'Aday bu turda onaylanmadı.':'Değerlendirmen kaydedildi.');await load()}catch(e){toast(e.message)}},
  async conflict(id){const reason=prompt('Çıkar çatışmasını kısaca yaz:','Aynı ekipteyiz');if(reason===null)return;try{await api('POST',`/api/tree-applications/${id}/conflict`,{reason});toast('Beyanın kaydedildi.');await load()}catch(e){toast(e.message)}},
  newForest(){modal(`<div class="eyebrow">ORMAN KUR</div><h2>Üç Ağaç, bir orman.</h2><p>Orman, yeni nesilleri sürdürülebilir biçimde yetiştirmek için kurulur. En az iki Ağaç daha davet etmen gerekir.</p><form id="gwForest"><label class="field" for="gwFn">Orman adı</label><input class="input" id="gwFn" minlength="3" maxlength="40" required><label class="field" for="gwFa">Ana alan</label><select id="gwFa">${Object.entries(G.AREAS).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select><label class="field" for="gwFm">Misyonun (en az 40 karakter)</label><textarea id="gwFm" minlength="40" maxlength="400" required></textarea><p class="error" id="gwFErr" role="alert"></p><button class="btn purple">Ormanı kur ↗</button></form>`);q('#gwForest').onsubmit=async e=>{e.preventDefault();try{await api('POST','/api/forests',{name:q('#gwFn').value,area:q('#gwFa').value,mission:q('#gwFm').value});closeModal();toast('Orman kuruldu. Şimdi Ağaç davet et.');await load()}catch(err){q('#gwFErr').textContent=err.message}}},
  inviteTree(fid){const opts=mentors.filter(m=>!forests.find(f=>f.id===fid)?.members.some(x=>x.id===m.id));modal(`<div class="eyebrow">AĞAÇ DAVET ET</div><h2>Ormana yeni bir Ağaç.</h2>${opts.length?opts.map(m=>`<div class="gw-mentor"><div><strong>${esc(m.name)}</strong><small>${m.areas.map(a=>esc(a.label)).join(', ')||'alan bilgisi yok'} · ${m.load}/${m.cap} öğrenci</small></div><button class="btn light small" data-t="${esc(m.id)}">Davet et</button></div>`).join(''):'<div class="empty"><p>Davet edilebilecek başka Ağaç yok.</p></div>'}`);document.querySelectorAll('[data-t]').forEach(b=>b.onclick=async()=>{try{await api('POST',`/api/forests/${fid}/invite`,{userId:b.dataset.t});closeModal();toast('Davet gönderildi.');await load()}catch(err){toast(err.message)}})},
  forest:(fid,what)=>act('POST',`/api/forests/${fid}/${what}`,{},what==='join'?'Ormana katıldın 🌲':'Ormandan ayrıldın.'),
  reload:load};
window.ScolaGrowthUI=API;
})();
