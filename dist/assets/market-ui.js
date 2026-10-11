'use strict';
// Scola Pazar arayüzü (TEST MODU: gerçek para yok). Kararları sunucu verir; burası gösterir ve istek gönderir.
(()=>{
let info=null,listings=[],mine=null,filters={q:'',cat:'',area:'',sort:'oneri'},loading=false,tab='buying';
const q=(s,r=document)=>r.querySelector(s);
const cover=(l,cls='')=>`<div class="mk-cover ${cls}" style="background:${esc(info.colors[l.cover.c])}" aria-hidden="true">${info.emojis[l.cover.e]}</div>`;
const stars=r=>r.count?`★ ${r.avg} <small>(${r.count})</small>`:'<small>Henüz yorum yok</small>';
const topTag=r=>{const e=Object.entries(r.tags||{}).sort((a,b)=>b[1]-a[1])[0];return e?`<span class="badge gray">${esc(e[0])}</span>`:''};
const statusLabel={pending:['Değerlendirmede','gray'],active:['Yayında',''],rejected:['Kaldırıldı / reddedildi','orange'],paused:['Duraklatıldı','gray'],soldout:['Tükendi','orange']};
const orderLabel={paid:'Emanette · teslim bekleniyor',delivered:'Teslim edildi · onay bekleniyor',completed:'Tamamlandı',disputed:'Uyuşmazlık incelemede',refunded:'İade edildi',cancelled:'İptal'};
const testBanner=()=>`<div class="notice"><strong>TEST MODU: gerçek para yok.</strong> Ücret satın alınca emanete alınır; teslim ve onaydan sonra satıcıya <strong>%${info.commissionPct} komisyon düşülerek</strong> serbest bırakılır. İlanlar yayına girmeden bağımsız bir değerlendiriciden geçer. Adres, telefon ya da sosyal medya bilgisi paylaşma. Gerçek satış için lisanslı ödeme sağlayıcısı ve 18 yaş altı için veli onayı gerekir.</div>`;

function render(){
  const head=intro('Scola Pazar.','Gençlerin yaptığı ürünleri keşfet ya da kendi ürününü satışa çıkar. Ödeme emanetle korunur.',live.available?`<div class="modal-actions" style="margin:0"><button class="btn purple" onclick="ScolaMarketUI.sell()">＋ Ürünümü sat</button><button class="btn light" onclick="ScolaMarketUI.mine()">Siparişlerim & satışlarım</button></div>`:'');
  if(!live.available)return head+`<div class="notice"><strong>Pazar canlı bir sunucu ister.</strong> <code>npm run dev</code> ile başlatıp http://127.0.0.1:5175 adresinden aç.</div><div class="mission-grid">${[['🧶','Pastel bilek bandı seti','Fiziksel',100],['🎨','Pixel-art sticker paketi','Dijital',40],['🕯️','El yapımı mum','Fiziksel',70]].map(([e,t,c,p])=>`<article class="mission-card"><div class="mk-cover" style="background:#f0e3fb">${e}</div><span class="badge gray">ÖRNEK · ${c}</span><h3>${t}</h3><div class="mission-meta"><span>${p} ₺</span><span>emanetle korunur</span></div></article>`).join('')}</div>`;
  return head+'<div id="mkBody"><div class="empty"><p>Yükleniyor…</p></div></div>';
}
async function mount(){
  if(!live.available||loading)return;loading=true;
  try{if(!info)info=await api('GET','/api/market/info');await refresh()}catch(e){const b=q('#mkBody');if(b)b.innerHTML=`<div class="notice">${esc(e.message)}</div>`}finally{loading=false}
}
async function refresh(){
  const p=new URLSearchParams();for(const k of ['q','cat','area','sort'])if(filters[k])p.set(k,filters[k]);
  listings=(await api('GET','/api/market/listings?'+p)).listings;if(live.user)mine=await api('GET','/api/me/market').catch(()=>null);paint();
}
function card(l){
  return `<article class="mission-card mk-card ${l.status==='soldout'?'soldout':''}"><button class="mk-hit" onclick="ScolaMarketUI.open('${esc(l.id)}')" aria-label="${esc(l.title)} ürününü aç"></button>${cover(l)}<div class="mk-badges"><span class="badge ${l.category==='dijital'?'purple':''}">${esc(l.categoryLabel)}</span>${l.newSeller?'<span class="badge orange">Yeni üretici</span>':''}${l.status==='soldout'?'<span class="badge gray">Tükendi</span>':''}</div><h3>${esc(l.title)}</h3><div class="mk-price">${l.price} ₺</div><div class="mission-meta"><span>${esc(l.seller.name)}</span><span>${stars(l.rating)}</span></div>${topTag(l.rating)}</article>`;
}
function paint(){
  const b=q('#mkBody');if(!b)return;
  b.innerHTML=`${testBanner()}<div class="mk-controls"><input class="input" id="mkQ" type="search" placeholder="Ürün ara…" value="${esc(filters.q)}" aria-label="Ürün ara"></div>
  ${filters.sort==='oneri'?'<p class="rounded-note">Önerilen sıralama: %40 kalite, %25 konu uyumu, %20 yeni üretici keşfi, %15 güncellik. Para, takipçi ya da satış sayısı sıralamayı etkilemez.</p>':''}
  ${mine&&(mine.earned||mine.held)?`<div class="result"><strong>Test cüzdanın:</strong> kazanç ${mine.earned} ₺ · emanette ${mine.held} ₺</div>`:''}
  <div class="mission-grid">${listings.length?listings.map(card).join(''):'<div class="empty" style="grid-column:1/-1"><h3>Burada ürün yok.</h3><p>Aramayı değiştir ya da ilk ürünü sen satışa çıkar.</p></div>'}</div>`;
  let t=0;q('#mkQ').oninput=e=>{clearTimeout(t);t=setTimeout(()=>{filters.q=e.target.value.trim();refresh()},300)};
    
}

/* ---------- İlan sayfası ---------- */
async function openListing(id){
  let l;try{l=(await api('GET','/api/market/listings/'+encodeURIComponent(id))).listing}catch(e){return toast(e.message)}
  const own=l.own,fiz=l.category==='fiziksel',buyable=l.status==='active'&&!own;
  modal(`<div class="eyebrow">${esc(l.categoryLabel)} · ${esc(l.areaLabel)}</div><div class="mk-detail">${cover(l,'big')}<div><h2>${esc(l.title)}</h2><div class="mk-price big">${l.price} ₺</div><p>${esc(l.desc).replace(/\n/g,'<br>')}</p><div class="mission-meta"><span>Satıcı: <strong>${esc(l.seller.name)}</strong></span><span>${l.seller.sales} tamamlanan satış</span><span>${stars(l.rating)}</span></div>${topTag(l.rating)}${fiz?`<p class="rounded-note">Stok: ${l.stock}</p>`:''}</div></div>
  ${l.newSeller?'<div class="notice">🌱 Yeni üretici: ürününü keşfetmeye ilk gelenlerden olabilirsin.</div>':''}
  <div class="result"><strong>Nasıl çalışır?</strong><br>1. Satın alınca ücret <b>test emanetine</b> alınır.<br>2. Satıcı ürünü teslim eder ${fiz?'(okulda ya da yüz yüze; adres paylaşma)':'(bağlantı ya da dosya notuyla)'}.<br>3. Sen onaylayınca satıcıya ödenir; 3 gün içinde yanıt vermezsen otomatik serbest kalır. Sorun olursa 3 gün içinde uyuşmazlık açabilirsin.</div>
  ${own?`<p>Bu senin ilanın · ${statusLabel[l.status]?.[0]||l.status}. ${l.moderation?.length?'Değerlendirici notu: '+esc(l.moderation.at(-1).feedback):''}</p>`:''}
  ${buyable?`<form id="mkBuy"><div class="mk-buy">${fiz?`<label>Adet <input class="input" type="number" id="mkQty" min="1" max="${Math.min(info.limits.maxQty,l.stock)}" value="1"></label>`:''}<div class="mk-total">Toplam: <b id="mkTotal">${l.price} ₺</b></div></div><label class="fund-check"><label><input type="checkbox" id="mkConfirm"><span>Ücretin test emanetine alınacağını anladım. Gerçek para harcanmaz.</span></label></label><p class="error" id="mkErr" role="alert"></p><div class="modal-actions"><button class="btn purple">${live.user?'Satın al (test emaneti) ↗':'Giriş yap ve satın al'}</button><button type="button" class="btn light" id="mkReport">İlanı bildir</button></div></form>`:l.status==='soldout'?'<div class="empty"><p>Bu ürün şu an tükendi.</p></div>':''}`,true);
  const f=q('#mkBuy');
  if(f){const qty=q('#mkQty');if(qty)qty.oninput=()=>{q('#mkTotal').textContent=(l.price*(Number(qty.value)||1))+' ₺'};
    q('#mkReport').onclick=()=>reportListing(l.id);
    f.onsubmit=async e=>{e.preventDefault();if(!live.user){openAccount('register');return}try{const r=await api('POST',`/api/market/listings/${encodeURIComponent(l.id)}/buy`,{qty:qty?Number(qty.value):1,confirm:q('#mkConfirm').checked});closeModal();await refresh();toast('Sipariş verildi. Ücret test emanetinde; satıcının teslimini bekle.');mineModal('buying')}catch(err){q('#mkErr').textContent=err.message}}}
}
function reportListing(id){
  if(!live.user)return openAccount('register');
  modal(`<div class="eyebrow">İLANI BİLDİR</div><h2>Neden bildiriyorsun?</h2><div class="hub-reasons">${info.reportReasons.map((t,i)=>`<button class="btn light" data-r="${i}">${esc(t)}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{try{await api('POST',`/api/market/listings/${encodeURIComponent(id)}/report`,{reason:Number(b.dataset.r)});closeModal();toast('Bildirimin alındı, teşekkürler.')}catch(e){toast(e.message)}});
}

/* ---------- Satış sihirbazı ---------- */
function sell(){
  if(!live.user)return openAccount('register');
  const projects=(typeof state!=='undefined'&&state.projects)||[];let em=0,col=0;
  modal(`<div class="eyebrow">ÜRÜNÜMÜ SAT · TEST MODU</div><h2>İlanını hazırla.</h2><div class="notice">İlanın yayına girmeden bağımsız bir değerlendiriciden geçer. Yasaklı ürünler, dış iletişim bilgileri (telefon, e-posta, sosyal medya) ve abartılı iddialar kabul edilmez. Fiyat ${info.limits.minPrice}–${info.limits.maxPrice} ₺.</div>
  <form id="mkSell">${projects.length?`<label class="field" for="mkFrom">Üretim alanımdan al (isteğe bağlı)</label><select id="mkFrom"><option value="">Seç…</option>${projects.map((p,i)=>`<option value="${i}">${esc(p.title)}</option>`).join('')}</select>`:''}
  <label class="field" for="mkTitle">Ürün adı</label><input class="input" id="mkTitle" required minlength="4" maxlength="60">
  <label class="field" for="mkDesc">Açıklama (en az 30 karakter; ne, nasıl, nelerle yapıldı, teslim nasıl)</label><textarea id="mkDescIn" required minlength="30" maxlength="800"></textarea>
  <div class="form-grid"><div><label class="field" for="mkCat">Kategori</label><select id="mkCat">${Object.entries(info.categories).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></div><div><label class="field" for="mkAreaIn">Alan</label><select id="mkAreaIn">${Object.entries(info.areas).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></div><div><label class="field" for="mkPrice">Fiyat (₺)</label><input class="input" id="mkPrice" type="number" min="${info.limits.minPrice}" max="${info.limits.maxPrice}" step="1" required value="50"></div><div id="mkStockBox"><label class="field" for="mkStock">Stok</label><input class="input" id="mkStock" type="number" min="1" max="${info.limits.maxStock}" value="3"></div></div>
  <div class="field">Kapak</div><div class="av-row" id="mkEm">${info.emojis.map((e,i)=>`<button type="button" data-e="${i}" aria-label="Simge ${i+1}">${e}</button>`).join('')}</div><div class="av-row" id="mkCol">${info.colors.map((c,i)=>`<button type="button" data-c="${i}" style="background:${c}" aria-label="Renk ${i+1}"></button>`).join('')}</div>
  <div class="result" id="mkPreview"></div><p class="rounded-note">Komisyon: satış tamamlanınca <b>%${info.commissionPct}</b> düşülür. Örn. 100 ₺ → sana ${(100-info.commissionPct)} ₺.</p><p class="error" id="mkSellErr" role="alert"></p><button class="btn purple">Değerlendirmeye gönder ↗</button></form>`,true);
  const prev=()=>{const price=Number(q('#mkPrice').value)||0,net=(price*(100-info.commissionPct)/100).toFixed(2);q('#mkPreview').innerHTML=`${cover({cover:{e:em,c:col}},'small')} <strong>${esc(q('#mkTitle').value||'Ürün adı')}</strong> · ${price} ₺ · satıştan sana <b>${net} ₺</b>`;q('#mkStockBox').hidden=q('#mkCat').value!=='fiziksel';document.querySelectorAll('#mkEm button').forEach((b,i)=>b.classList.toggle('sel',i===em));document.querySelectorAll('#mkCol button').forEach((b,i)=>b.classList.toggle('sel',i===col))};
  document.querySelectorAll('#mkEm button').forEach((b,i)=>b.onclick=()=>{em=i;prev()});document.querySelectorAll('#mkCol button').forEach((b,i)=>b.onclick=()=>{col=i;prev()});
  ['#mkTitle','#mkPrice','#mkCat'].forEach(s=>q(s).oninput=q(s).onchange=prev);
  const from=q('#mkFrom');if(from)from.onchange=()=>{const p=projects[Number(from.value)];if(p){q('#mkTitle').value=(p.title||'').slice(0,60);q('#mkDescIn').value=(p.desc||p.need||'').slice(0,800);prev()}};
  prev();
  q('#mkSell').onsubmit=async e=>{e.preventDefault();try{await api('POST','/api/market/listings',{title:q('#mkTitle').value,desc:q('#mkDescIn').value,category:q('#mkCat').value,area:q('#mkAreaIn').value,price:Number(q('#mkPrice').value),stock:Number(q('#mkStock').value),cover:{e:em,c:col}});closeModal();await refresh();toast('İlanın değerlendirmeye gönderildi.');mineModal('listings')}catch(err){q('#mkSellErr').textContent=err.message}};
}

/* ---------- Siparişlerim & satışlarım ---------- */
async function mineModal(t){
  if(!live.user)return openAccount('register');if(t)tab=t;
  try{mine=await api('GET','/api/me/market')}catch(e){return toast(e.message)}
  const orderCard=o=>{
    const buyer=o.role==='buyer';let act='';
    if(buyer){
      if(o.status==='paid')act=`<button class="btn light small" onclick="ScolaMarketUI.act('${esc(o.id)}','cancel')">İptal et (iade)</button><button class="text-btn" onclick="ScolaMarketUI.dispute('${esc(o.id)}')">Teslim edilmedi?</button>`;
      if(o.status==='delivered')act=`<button class="btn purple small" onclick="ScolaMarketUI.act('${esc(o.id)}','confirm')">Teslim aldım, öde ✓</button><button class="btn light small" onclick="ScolaMarketUI.dispute('${esc(o.id)}')">Sorun var</button>`;
      if(o.canReview)act=`<button class="btn purple small" onclick="ScolaMarketUI.review('${esc(o.id)}')">Yorum yap ★</button>`;
    }else{
      if(o.status==='paid')act=`<button class="btn purple small" onclick="ScolaMarketUI.deliver('${esc(o.id)}','${esc(o.category)}')">Teslim ettim</button><button class="btn light small" onclick="ScolaMarketUI.act('${esc(o.id)}','cancel')">İptal et (iade)</button>`;
    }
    return `<div class="review-box mk-order">${cover({cover:o.cover||{e:0,c:0}},'small')}<div><strong>${esc(o.title)}</strong> × ${o.qty} · ${o.price} ₺ <span class="badge ${o.status==='completed'?'':'gray'}">${orderLabel[o.status]||esc(o.status)}</span><br><small>${buyer?'Satıcı':'Alıcı'}: ${esc(o.counterpart.name)}${!buyer&&o.net!=null?` · komisyon ${o.commission} ₺ · sana ${o.net} ₺`:''}</small>${o.deliveryNote?`<br><small>Teslim notu: ${esc(o.deliveryNote)}</small>`:''}${o.autoReleaseAt&&buyer?`<br><small>Yanıt vermezsen ${new Date(o.autoReleaseAt).toLocaleDateString('tr-TR')} tarihinde otomatik serbest kalır.</small>`:''}${o.dispute?`<br><small>Uyuşmazlık: ${esc(o.dispute.reason)}${o.dispute.resolution?' → '+esc(o.dispute.resolution):''}</small>`:''}${o.review?`<br><small>★ ${o.review.rating} ${o.review.tags.map(esc).join(', ')}</small>`:''}<div class="modal-actions">${act}</div></div></div>`;
  };
  const lc=l=>`<div class="review-box mk-order">${cover(l,'small')}<div><strong>${esc(l.title)}</strong> · ${l.price} ₺ <span class="badge ${(statusLabel[l.status]||[,'gray'])[1]}">${(statusLabel[l.status]||[l.status])[0]}</span>${l.category==='fiziksel'?` · stok ${l.stock}`:''}<br><small>${stars(l.rating)}</small>${l.moderation?.length&&l.status==='rejected'?`<br><small>Gerekçe: ${esc(l.moderation.at(-1).feedback)}</small>`:''}<div class="modal-actions">${['active','soldout'].includes(l.status)?`<button class="btn light small" onclick="ScolaMarketUI.pause('${esc(l.id)}',true)">Duraklat</button>`:''}${l.status==='paused'?`<button class="btn light small" onclick="ScolaMarketUI.pause('${esc(l.id)}',false)">Yayına al</button>`:''}${l.category==='fiziksel'&&['active','soldout','paused'].includes(l.status)?`<button class="btn light small" onclick="ScolaMarketUI.stock('${esc(l.id)}',${l.stock})">Stok güncelle</button>`:''}</div></div></div>`;
  const lists={buying:mine.buying.map(orderCard).join('')||'<div class="empty"><p>Henüz sipariş vermedin.</p></div>',selling:mine.selling.map(orderCard).join('')||'<div class="empty"><p>Henüz satışın yok.</p></div>',listings:mine.listings.map(lc).join('')||'<div class="empty"><p>Henüz ilanın yok. "Ürünümü sat" ile başla.</p></div>'};
  modal(`<div class="eyebrow">PAZAR · TEST MODU</div><h2>Siparişlerim & satışlarım</h2><div class="result"><strong>Test cüzdanı:</strong> kazanç ${mine.earned} ₺ · emanette ${mine.held} ₺</div><div class="tabs">${[['buying','Aldıklarım'],['selling','Satışlarım'],['listings','İlanlarım']].map(([k,v])=>`<button class="tab ${tab===k?'active':''}" onclick="ScolaMarketUI.mine('${k}')">${v}</button>`).join('')}</div>${lists[tab]}`,true);
}
async function act(id,what){try{const r=await api('POST',`/api/market/orders/${encodeURIComponent(id)}/${what}`,{});toast(what==='confirm'?`Ödeme serbest bırakıldı (test): satıcıya ${r.payout.net} ₺, komisyon ${r.payout.commission} ₺.`:'Sipariş iptal edildi, ücret iade edildi (test).');await refresh();mineModal()}catch(e){toast(e.message)}}
function deliver(id,cat){
  modal(`<div class="eyebrow">TESLİM</div><h2>Ürünü nasıl teslim ettin?</h2><p>${cat==='dijital'?'Bağlantı ya da dosyanın nerede olduğunu yaz.':'Okulda / yüz yüze teslim bilgisini yaz. Adres, telefon ya da sosyal medya paylaşma.'}</p><form id="mkDel"><textarea id="mkNote" minlength="5" maxlength="300" required></textarea><p class="error" id="mkDelErr" role="alert"></p><button class="btn purple">Teslim notunu gönder</button></form>`);
  q('#mkDel').onsubmit=async e=>{e.preventDefault();try{await api('POST',`/api/market/orders/${encodeURIComponent(id)}/deliver`,{note:q('#mkNote').value});toast('Teslim notu gönderildi. Alıcı onaylayınca ödeme serbest kalır.');await refresh();mineModal('selling')}catch(err){q('#mkDelErr').textContent=err.message}};
}
function dispute(id){
  modal(`<div class="eyebrow">UYUŞMAZLIK</div><h2>Ne oldu?</h2><p>Bir yönetici inceleyip iade ya da serbest bırakma kararı verir. Ücret o zamana kadar emanette bekler.</p><div class="hub-reasons">${info.disputeReasons.map((t,i)=>`<button class="btn light" data-r="${i}">${esc(t)}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{try{await api('POST',`/api/market/orders/${encodeURIComponent(id)}/dispute`,{reason:Number(b.dataset.r)});toast('Uyuşmazlığın açıldı.');await refresh();mineModal('buying')}catch(e){toast(e.message);mineModal()}});
}
function review(id){
  let rt=0;const tags=new Set();
  modal(`<div class="eyebrow">YORUM</div><h2>Nasıldı?</h2><p>Serbest metin yerine hazır etiketler kullanılır; böylece herkes için güvenli kalır.</p><div class="rating" id="mkStars">${[1,2,3,4,5].map(v=>`<button data-v="${v}" aria-label="${v} yıldız">★</button>`).join('')}</div><div class="gw-chips">${info.tags.map(t=>`<label class="gw-chip"><input type="checkbox" value="${esc(t)}"><span>${esc(t)}</span></label>`).join('')}</div><p class="error" id="mkRvErr" role="alert"></p><button class="btn purple" id="mkRvGo">Gönder</button>`);
  document.querySelectorAll('#mkStars button').forEach(b=>b.onclick=()=>{rt=Number(b.dataset.v);document.querySelectorAll('#mkStars button').forEach((x,i)=>x.classList.toggle('selected',i<rt))});
  document.querySelectorAll('.gw-chips input').forEach(c=>c.onchange=()=>{if(c.checked&&tags.size>=3){c.checked=false;return}c.checked?tags.add(c.value):tags.delete(c.value)});
  q('#mkRvGo').onclick=async()=>{try{await api('POST',`/api/market/orders/${encodeURIComponent(id)}/review`,{rating:rt,tags:[...tags]});toast('Teşekkürler!');await refresh();mineModal('buying')}catch(e){q('#mkRvErr').textContent=e.message}};
}

/* ---------- Değerlendirici kuyruğu ve yönetici paneli (Bağımsız inceleme sayfası) ---------- */
async function mountReview(){
  const main=document.getElementById('main');if(!main||!live.user)return;
  const isRev=live.user.roles.includes('reviewer'),isAd=live.user.roles.includes('admin');if(!isRev&&!isAd)return;
  let box=document.getElementById('marketReview');if(!box){box=document.createElement('div');box.id='marketReview';main.appendChild(box)}
  if(!info)try{info=await api('GET','/api/market/info')}catch{return}
  let html='';
  if(isRev){
    const qd=await api('GET','/api/market/queue').catch(()=>null);
    if(qd)html+=`${section('Pazar ilanları','Kör ve bağımsız: satıcının adı gizli; kendi ilanın kuyruğa gelmez. Onay için bütün ölçütler karşılanmalı.')}${qd.queue.length?qd.queue.map(l=>`<article class="panel" style="margin-bottom:14px"><div class="eyebrow">${esc(l.seller)} · ${esc(l.category)} · ${esc(l.area)}</div><div class="mk-order">${cover({cover:l.cover},'small')}<div><h3>${esc(l.title)} · ${l.price} ₺</h3><div class="read-note">${esc(l.desc)}</div></div></div><div class="fund-check">${qd.checks.map((c,i)=>`<label><input type="checkbox" id="mc-${esc(l.id)}-${i}"><span>${esc(c)}</span></label>`).join('')}</div><label class="field" for="mf-${esc(l.id)}">Geri bildirim (en az 20 karakter)</label><textarea id="mf-${esc(l.id)}" maxlength="500"></textarea><p class="error" id="me-${esc(l.id)}" role="alert"></p><div class="modal-actions"><button class="btn purple small" onclick="ScolaMarketUI.moderate('${esc(l.id)}','approve',${qd.checks.length})">Onayla</button><button class="btn light small" onclick="ScolaMarketUI.moderate('${esc(l.id)}','reject',${qd.checks.length})">Reddet</button></div></article>`).join(''):'<div class="empty"><p>Değerlendirilecek ilan yok.</p></div>'}`;
  }
  if(isAd){
    const am=await api('GET','/api/admin/market').catch(()=>null);
    if(am)html+=`${section('Yönetici: uyuşmazlıklar ve bildirimler','Emanetteki ücret karar verilene kadar bekler.')}${am.disputes.length?am.disputes.map(d=>`<div class="review-box"><strong>${esc(d.title||'ürün')}</strong> · ${d.price} ₺<br>Alıcı: ${esc(d.buyer)} · Satıcı: ${esc(d.seller)}<br>Neden: ${esc(d.reason)}${d.deliveryNote?'<br>Teslim notu: '+esc(d.deliveryNote):''}<div class="modal-actions"><button class="btn purple small" onclick="ScolaMarketUI.resolve('${esc(d.id)}','refund')">Alıcıya iade</button><button class="btn light small" onclick="ScolaMarketUI.resolve('${esc(d.id)}','release')">Satıcıya serbest</button></div></div>`).join(''):'<div class="empty"><p>Açık uyuşmazlık yok.</p></div>'}${am.reports.length?`<h3>İlan bildirimleri</h3>${am.reports.map(r=>`<div class="review-box"><strong>${esc(r.title||'ilan')}</strong> · ${esc(r.reason)} · <span class="badge gray">${esc(r.status||'')}</span> <button class="text-btn" onclick="ScolaMarketUI.takedown('${esc(r.listingId)}')">İlanı kaldır</button></div>`).join('')}`:''}`;
  }
  box.innerHTML=html;
}
async function moderate(id,decision,n){
  const checks=Array.from({length:n},(_,i)=>!!document.getElementById(`mc-${id}-${i}`)?.checked);
  try{await api('POST',`/api/market/listings/${encodeURIComponent(id)}/moderate`,{decision,checks,feedback:document.getElementById('mf-'+id).value});toast(decision==='approve'?'İlan yayına alındı.':'İlan reddedildi.');mountReview()}catch(e){document.getElementById('me-'+id).textContent=e.message}
}
async function resolve(id,decision){const note=prompt(decision==='refund'?'İade gerekçesi (en az 10 karakter):':'Serbest bırakma gerekçesi (en az 10 karakter):','Taraflar incelendi, karar verildi.');if(note===null)return;try{await api('POST',`/api/admin/orders/${encodeURIComponent(id)}/resolve`,{decision,note});toast('Karar kaydedildi.');mountReview()}catch(e){toast(e.message)}}
async function takedown(id){const reason=prompt('Kaldırma gerekçesi (en az 10 karakter):','Kurallara aykırı içerik bildirimi incelendi.');if(reason===null)return;try{await api('POST',`/api/admin/listings/${encodeURIComponent(id)}/takedown`,{reason});toast('İlan kaldırıldı.');mountReview()}catch(e){toast(e.message)}}

window.ScolaMarketUI={render,mount,mountReview,open:openListing,sell,mine:t=>mineModal(t),act,deliver,dispute,review,moderate,resolve,takedown,
  async pause(id,paused){try{await api('POST',`/api/market/listings/${encodeURIComponent(id)}/pause`,{paused});await refresh();mineModal('listings')}catch(e){toast(e.message)}},
  async stock(id,cur){const v=prompt('Yeni stok adedi:',String(cur));if(v===null)return;try{await api('POST',`/api/market/listings/${encodeURIComponent(id)}/stock`,{stock:Number(v)});await refresh();mineModal('listings')}catch(e){toast(e.message)}}};
})();
