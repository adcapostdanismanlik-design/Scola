// Scola Pazar: ilan → bağımsız değerlendirme → satın alma (test emaneti) → teslim → onay → komisyonlu serbest bırakma; güvenlik denetimleri.
import http from 'node:http';
import assert from 'node:assert/strict';
import {createApi} from '../server/app.mjs';
let offset=0;const DAY=864e5;
const api=createApi({dbFile:null,adminEmails:['yonetici@ornek.test'],clock:()=>Date.now()+offset,marketCommissionPct:8});
const server=http.createServer((q,s)=>api.handle(q,s));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const client=()=>{let cookie='';return async(method,url,body)=>{const res=await fetch(base+url,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return {...await res.json(),status:res.status}}};
let n=0;const mk=async name=>{const c=client(),r=await c('POST','/api/auth/register',{name,email:`${++n}${name}@ornek.test`.toLowerCase(),password:'guclu-sifre-1'});assert.equal(r.status,200);return {c,id:r.user.id,name}};
const admin=client();await admin('POST','/api/auth/register',{name:'Yönetici',email:'yonetici@ornek.test',password:'guclu-sifre-1'});
const [S,B,B2]=[await mk('Satici'),await mk('Alici'),await mk('Alici2')];
const dig={title:'Pixel-art sticker paketi',desc:'On adet el çizimi pixel-art sticker. PNG olarak teslim edilir, kendi projelerinde kullanabilirsin.',category:'dijital',area:'art',price:40,cover:{e:0,c:2}};
const fiz={title:'Pastel bilek bandı seti',desc:'Üç adet el örgüsü pastel bilek bandı. Koyu mavi, turuncu ve beyaz renklerde, yumuşak ipten yapıldı.',category:'fiziksel',area:'craft',price:100,stock:3,cover:{e:11,c:6}};
const info=await S.c('GET','/api/market/info');assert.equal(info.testMode,true);assert.equal(info.commissionPct,8);assert(info.limits.maxPrice===2000&&info.tags.length===5);

// ---- İlan doğrulamaları ----
assert.equal((await client()('POST','/api/market/listings',dig)).status,401);
assert.equal((await S.c('POST','/api/market/listings',{...dig,price:5})).status,400);assert.equal((await S.c('POST','/api/market/listings',{...dig,price:50.5})).status,400);
assert.equal((await S.c('POST','/api/market/listings',{...dig,category:'canlı'})).status,400);assert.equal((await S.c('POST','/api/market/listings',{...dig,desc:'kısa'})).status,400);
assert.equal((await S.c('POST','/api/market/listings',{...fiz,stock:0})).status,400);
const bad1=await S.c('POST','/api/market/listings',{...dig,title:'Alkollü içecek tarifleri'});assert.equal(bad1.status,400);assert.equal(bad1.error,'prohibited');
const bad2=await S.c('POST','/api/market/listings',{...dig,desc:'Bana ulaş: 05321234567 numaralı hattan yaz, ürünü orada konuşalım olur mu.'});assert.equal(bad2.error,'contact_info');
assert.equal((await S.c('POST','/api/market/listings',{...dig,desc:'İnstagram hesabımdan bana yazarsan ürünü daha ucuza veririm, mesaj at.'})).error,'contact_info');
const l1=(await S.c('POST','/api/market/listings',dig)).listing,l2=(await S.c('POST','/api/market/listings',fiz)).listing;
assert.equal(l1.status,'pending');assert.equal((await S.c('POST','/api/market/listings',dig)).status,409,'aynı başlık');
// Yayın öncesi görünmez; satın alınamaz
assert.equal((await B.c('GET','/api/market/listings')).listings.length,0);assert.equal((await B.c('GET','/api/market/listings/'+l1.id)).status,404);
assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/buy`,{confirm:true})).status,409);

// ---- Bağımsız değerlendirme ----
assert.equal((await S.c('GET','/api/market/queue')).status,403,'değerlendirici rolü gerekir');
const q=await admin('GET','/api/market/queue');assert.equal(q.queue.length,2);assert(q.queue[0].seller.startsWith('Satıcı #')&&!JSON.stringify(q).includes('Satici')&&!JSON.stringify(q).includes(S.id),'kör: satıcı adı gizli');
const mod=(id,dec,checks,fb='Açıklama net ve güvenli; fiyat makul görünüyor.')=>admin('POST',`/api/market/listings/${id}/moderate`,{decision:dec,checks,feedback:fb});
assert.equal((await mod(l1.id,'approve',[true,true,false,true])).status,400,'tüm ölçütler şart');assert.equal((await mod(l1.id,'approve',[true,true,true,true],'kısa')).status,400);
assert.equal((await mod(l1.id,'approve',[true,true,true,true])).status,200);assert.equal((await mod(l2.id,'reject',[true,false,true,true],'Fotoğraf ve ölçü bilgisi eksik; ekleyip yeniden gönder.')).status,200);
const mine=await S.c('GET','/api/me/market');assert.equal(mine.listings.find(l=>l.id===l2.id).status,'rejected');assert(mine.listings.find(l=>l.id===l2.id).moderation[0].feedback.includes('eksik'),'satıcı gerekçeyi görür');
// yeniden gönder (reddedilenle aynı başlık serbest) ve onayla
const l3=(await S.c('POST','/api/market/listings',{...fiz,desc:fiz.desc+' Ölçü: bilek çevresine göre ayarlanabilir, fotoğrafı teslimde gösterilir.'})).listing;assert.equal((await mod(l3.id,'approve',[true,true,true,true])).status,200);
// kendi ilanını değerlendiremez
const adminSeller=(await admin('POST','/api/market/listings',{...dig,title:'Yönetici deneme ilanı',cover:{e:3,c:1}})).listing;assert.equal((await mod(adminSeller.id,'approve',[true,true,true,true])).status,403);
await admin('POST',`/api/admin/listings/${adminSeller.id}/takedown`,{reason:'Test ilanı kaldırıldı, gerçek ürün değil.'});

// ---- Vitrin ----
let list=await B.c('GET','/api/market/listings');assert.equal(list.listings.length,2);assert(list.listings.every(l=>l.newSeller&&l.seller.name==='Satici'&&!('email' in l.seller)));
assert.equal((await B.c('GET','/api/market/listings?cat=dijital')).listings.length,1);assert.equal((await B.c('GET','/api/market/listings?q=BİLEK')).listings.length,1,'Türkçe büyük/küçük harf aramada duyarsız');
assert.equal((await B.c('GET','/api/market/listings?area=art')).listings[0].id,l1.id);
const cheap=await B.c('GET','/api/market/listings?sort=fiyat-artan');assert.deepEqual(cheap.listings.map(l=>l.price),[40,100]);
// Pazar keşfi: para / satış sayısı sıralamayı etkilemez (kalite %40 · konu %25 · yeni üretici %20 · güncellik %15)
assert.equal((await B.c('GET','/api/market/listings?sort=oneri')).sort,'oneri');

// ---- Satın alma (TEST emaneti) ----
assert.equal((await S.c('POST',`/api/market/listings/${l1.id}/buy`,{confirm:true})).status,403,'kendi ürününü alamaz');
assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/buy`,{})).status,400,'onay şart');assert.equal((await B.c('POST',`/api/market/listings/${l3.id}/buy`,{confirm:true,qty:9})).status,400);
assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/buy`,{confirm:true,qty:2})).status,400,'dijital tek adet');
const o1=(await B.c('POST',`/api/market/listings/${l3.id}/buy`,{confirm:true,qty:2})).order;assert.equal(o1.price,200);assert.equal(o1.status,'paid');
assert.equal((await S.c('GET','/api/market/listings/'+l3.id)).listing.stock,1,'stok düştü');
assert.equal((await B2.c('POST',`/api/market/listings/${l3.id}/buy`,{confirm:true,qty:2})).status,409,'yetersiz stok');
const sell=await S.c('GET','/api/me/market');assert.equal(sell.selling[0].commission,16);assert.equal(sell.selling[0].net,184);assert.equal(sell.selling[0].counterpart.name,'Alici');
assert.equal((await B.c('GET','/api/me/market')).held,200);
// teslim: iletişim bilgisi yasak, doğru yetki
const dv=(o,note)=>S.c('POST',`/api/market/orders/${o}/deliver`,{note});
assert.equal((await B.c('POST',`/api/market/orders/${o1.id}/deliver`,{note:'Teslim ettim sayılır mı bilmiyorum'})).status,404,'alıcı teslim edemez');
assert.equal((await dv(o1.id,'Whatsapp numaram 0532 123 45 67')).error,'contact_info');
assert.equal((await dv(o1.id,'Okulda teneffüste sınıf kapısında elden teslim edilecek, haber veririm.')).order.status,'delivered');
assert.equal((await B.c('POST',`/api/market/orders/${o1.id}/cancel`,{})).status,409,'teslimden sonra iptal yok');
assert.equal((await S.c('POST',`/api/market/orders/${o1.id}/confirm`,{})).status,404,'satıcı kendi siparişini onaylayamaz');
assert((await B.c('GET','/api/me/market')).buying[0].deliveryNote.includes('teneffüs'),'alıcı teslim notunu görür');
const cf=await B.c('POST',`/api/market/orders/${o1.id}/confirm`,{});assert.deepEqual(cf.payout,{gross:200,commission:16,net:184});
assert.equal((await B.c('POST',`/api/market/orders/${o1.id}/confirm`,{})).status,409,'ikinci onay yok');
assert.equal((await S.c('GET','/api/me/market')).earned,184);
// yorum: hazır etiketler, serbest metin yok; tek sefer
assert.equal((await B2.c('POST',`/api/market/orders/${o1.id}/review`,{rating:5,tags:['Kaliteli']})).status,404);
const rv=await B.c('POST',`/api/market/orders/${o1.id}/review`,{rating:5,tags:['Kaliteli','Hızlı teslim','Yaratıcı','Fiyatına değer','<script>']});assert.equal(rv.order.review.tags.length,3);assert(!rv.order.review.tags.includes('<script>'));
assert.equal((await B.c('POST',`/api/market/orders/${o1.id}/review`,{rating:4,tags:[]})).status,409);
const det=(await B.c('GET','/api/market/listings/'+l3.id)).listing;assert.equal(det.rating.count,1);assert.equal(det.rating.avg,5);assert.equal(det.seller.sales,1);

// ---- İptal (teslim öncesi) iade ve stok geri gelir ----
const o2=(await B.c('POST',`/api/market/listings/${l3.id}/buy`,{confirm:true})).order;assert.equal((await B.c('GET','/api/market/listings/'+l3.id)).listing.status,'soldout','tükenen ürün görünür kalır');assert.equal((await B.c('GET','/api/market/listings')).listings.at(-1).status,'soldout','tükenenler sona');
assert.equal((await S.c('POST',`/api/market/orders/${o2.id}/cancel`,{})).order.status,'refunded');assert.equal((await B.c('GET','/api/market/listings/'+l3.id)).listing.stock,1,'iptalde stok iade');assert.equal((await B.c('GET','/api/market/listings/'+l3.id)).listing.status,'active');

// ---- Uyuşmazlık: yönetici kararı ----
const o3=(await B.c('POST',`/api/market/listings/${l3.id}/buy`,{confirm:true})).order;
assert.equal((await B.c('POST',`/api/market/orders/${o3.id}/dispute`,{reason:0})).status,409,'teslim için satıcıya 1 gün tanınır');
await dv(o3.id,'Elden teslim ettim, okulda sınıf arkadaşıma bıraktım.');
assert.equal((await B.c('POST',`/api/market/orders/${o3.id}/dispute`,{reason:9})).status,400);
assert.equal((await B.c('POST',`/api/market/orders/${o3.id}/dispute`,{reason:1})).order.status,'disputed');
const am=await admin('GET','/api/admin/market');assert.equal(am.disputes.length,1);assert.equal(am.disputes[0].reason,'Ürün anlatıldığı gibi değil');assert.equal((await S.c('GET','/api/admin/market')).status,403);
assert.equal((await S.c('POST',`/api/admin/orders/${o3.id}/resolve`,{decision:'release',note:'Kendi lehime karar vermeye çalışıyorum'})).status,403);
assert.equal((await admin('POST',`/api/admin/orders/${o3.id}/resolve`,{decision:'refund',note:'Ürün anlatıldığı gibi değildi; alıcıya iade edildi.'})).ok,true);
const b3=(await B.c('GET','/api/me/market')).buying.find(o=>o.id===o3.id);assert.equal(b3.status,'refunded');assert(b3.dispute.resolution.startsWith('İade'));
assert.equal((await B.c('GET','/api/market/listings/'+l3.id)).listing.stock,1,'iadeyle stok geri');

// ---- Otomatik serbest bırakma (3 gün) ----
const o4=(await B2.c('POST',`/api/market/listings/${l1.id}/buy`,{confirm:true})).order;await dv(o4.id,'PNG dosyalarını Drive bağlantısıyla paylaştım: drive.example/xyz (kullanıma hazır).');
offset=2*DAY;assert.equal((await B2.c('GET','/api/me/market')).buying[0].status,'delivered','2 gün: hâlâ bekliyor');
offset=4*DAY;const after=await B2.c('GET','/api/me/market');assert.equal(after.buying[0].status,'completed','alıcı yanıtsız: 3 gün sonra otomatik serbest');assert.equal(after.buying[0].canReview,true);
assert.equal((await S.c('GET','/api/me/market')).earned,220.8,'184 ₺ + (40 ₺ − %8 komisyon 3,20 ₺ = 36,80 ₺)');

// ---- Pause / stok / bildirim / sınırlar ----
assert.equal((await S.c('POST',`/api/market/listings/${l1.id}/pause`,{paused:true})).listing.status,'paused');assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/buy`,{confirm:true})).status,409);
assert.equal((await S.c('POST',`/api/market/listings/${l1.id}/pause`,{paused:false})).listing.status,'active');assert.equal((await S.c('POST',`/api/market/listings/${l1.id}/stock`,{stock:3})).status,409,'dijitalde stok yok');
assert.equal((await S.c('POST',`/api/market/listings/${l3.id}/stock`,{stock:0})).listing.status,'soldout');assert.equal((await S.c('POST',`/api/market/listings/${l3.id}/stock`,{stock:5})).listing.status,'active');
assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/report`,{reason:1})).ok,true);assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/report`,{reason:1})).status,429);assert.equal((await B.c('POST',`/api/market/listings/${l1.id}/report`,{reason:77})).status,400);
assert.equal((await admin('GET','/api/admin/market')).reports.length,1);
// günlük alışveriş sınırı (3000 ₺ test) ve açık sipariş sınırı
const big=(await S.c('POST','/api/market/listings',{...fiz,title:'Büyük el yapımı koleksiyon kutusu',price:1900,stock:10,desc:'Elle yapılmış, ahşap, özel koleksiyon kutusu. Uzun uğraşla hazırlanır ve hediye paketi içerir; fotoğraflar eklenir.'})).listing;await mod(big.id,'approve',[true,true,true,true]);
assert.equal((await B2.c('POST',`/api/market/listings/${big.id}/buy`,{confirm:true})).status,200);assert.equal((await B2.c('POST',`/api/market/listings/${big.id}/buy`,{confirm:true})).error,'daily_limit');

// ---- Defter ve nabız ----
const led=await fetch(base+'/api/ledger').then(r=>r.json());assert(led.entries.some(e=>e.task.startsWith('Pazar:')&&e.type==='hold')&&led.entries.some(e=>e.type==='release'&&e.commission===16)&&led.entries.some(e=>e.type==='refund'));
assert(!JSON.stringify(led).includes(S.id)&&!JSON.stringify(led).includes('Satici'),'defterde kişi kimliği yok');
const pulse=await fetch(base+'/api/pulse').then(r=>r.json());assert(pulse.market.listings>=3&&pulse.market.sales>=2);
// emanet bütünlüğü: her serbest bırakılan siparişte komisyon + net = brüt
for(const o of api.db.data.orders.filter(o=>o.status==='completed'))assert.equal(o.commission+o.net,o.amount);
api.close();server.close();
console.log('PASS: market — ilan doğrulama (yasaklı ürün, dış iletişim), bağımsız değerlendirme, vitrin/filtre/öneri, test emaneti, komisyon, teslim, onay, yorum etiketleri, iptal/iade, uyuşmazlık, otomatik serbest, sınırlar, defter.');
setTimeout(()=>process.exit(0),50);
