// İlk gerçek dikey akışın uçtan uca testi: hesap → teslim → bağımsız inceleme → sunucu XP.
import http from 'node:http';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApi} from '../server/app.mjs';

const dir=mkdtempSync(path.join(tmpdir(),'scola-api-'));
const dbFile=path.join(dir,'db.json');
const api=createApi({dbFile,adminEmails:['yonetici@ornek.test']});
const server=http.createServer((req,res)=>api.handle(req,res));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;

function client(){
  let cookie='';
  return async(method,url,body)=>{
    const res=await fetch(base+url,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});
    const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];
    return {status:res.status,...await res.json()};
  };
}
const report={title:'Sıfırla zıplama sayısını sıfırlamıyor',output:'Sağa iki kez gittim, üç kez zıpladım ve Sıfırla düğmesine bastım. Beklenen: konum ve zıplama sayısı sıfır. Gerçekleşen: konum sıfırlandı ama zıplama sayısı 3 olarak kaldı.',impact:'Kullanımı zorlaştırıyor'};
const goodReview={decision:'accept',checks:[true,true,true],feedback:'Adımlar net ve tekrarlanabilir; beklenen ve gerçekleşen sonuç ayrı yazılmış. Etki makul.'};
try{
  const admin=client(),ayse=client(),deniz=client(),anon=client();

  // Kimlik
  assert.equal((await anon('POST','/api/missions/test-game/submissions',report)).status,401);
  assert.equal((await admin('POST','/api/auth/register',{name:'Yönetici',email:'yonetici@ornek.test',password:'guclu-sifre-1'})).user.roles.includes('admin'),true);
  const a=await ayse('POST','/api/auth/register',{name:'Ayşe',email:'ayse@ornek.test',password:'guclu-sifre-2'});
  assert.deepEqual(a.user.roles,['producer']);
  const dz=await deniz('POST','/api/auth/register',{name:'Deniz',email:'deniz@ornek.test',password:'guclu-sifre-3'});
  assert.equal((await anon('POST','/api/auth/register',{name:'X',email:'ayse@ornek.test',password:'12345678'})).status,400);
  assert.equal((await anon('POST','/api/auth/register',{name:'Kopya',email:'AYSE@ornek.test',password:'12345678'})).status,409);
  assert.equal((await anon('POST','/api/auth/login',{email:'ayse@ornek.test',password:'yanlis-sifre'})).status,401);
  // Şifre düz metin saklanmaz
  assert(!readFileSync(dbFile,'utf8').includes('guclu-sifre-2'));

  // Yetki: normal kullanıcı kuyruk göremez, rol veremez
  assert.equal((await ayse('GET','/api/reviews/queue')).status,403);
  assert.equal((await ayse('POST',`/api/admin/users/${a.user.id}/roles`,{role:'reviewer',enabled:true})).status,403);

  // Görev sözleşmesi görünür
  const ms=await ayse('GET','/api/missions');
  const game=ms.missions.find(m=>m.id==='test-game');
  assert(game.acceptance.length===3&&game.payment.label&&game.license&&game.share);

  // Teslim; istemci XP veya durum gönderse de yok sayılır
  const sub=await ayse('POST','/api/missions/test-game/submissions',{...report,xp:9999,status:'accepted'});
  assert.equal(sub.submission.status,'submitted');
  assert.equal((await ayse('GET','/api/me')).xp,0);
  assert.equal((await ayse('POST','/api/missions/test-game/submissions',report)).status,409);
  assert.equal((await ayse('POST','/api/missions/test-game/submissions',{...report,output:'kısa'})).status,400);

  // Admin Ayşe ve Deniz'e değerlendirici rolü verir
  await admin('POST',`/api/admin/users/${a.user.id}/roles`,{role:'reviewer',enabled:true});
  await admin('POST',`/api/admin/users/${dz.user.id}/roles`,{role:'reviewer',enabled:true});

  // Kendi teslimini değerlendiremez, kuyrukta da görmez
  assert.equal((await ayse('GET','/api/reviews/queue')).queue.length,0);
  assert.equal((await ayse('POST',`/api/submissions/${sub.submission.id}/reviews`,goodReview)).status,403);

  // Kör inceleme: yazar adı görünmez
  const q=await deniz('GET','/api/reviews/queue');
  assert.equal(q.queue.length,1);assert(!JSON.stringify(q).includes('Ayşe'));

  // Ölçütler eksikse kabul edilmez; kısa geri bildirim reddedilir
  assert.equal((await deniz('POST',`/api/submissions/${sub.submission.id}/reviews`,{...goodReview,checks:[true,false,true]})).status,400);
  assert.equal((await deniz('POST',`/api/submissions/${sub.submission.id}/reviews`,{...goodReview,feedback:'iyi'})).status,400);

  // Revizyon → yeniden teslim (yeni deneme sayılmaz) → kabul → tek XP olayı
  const rev=await deniz('POST',`/api/submissions/${sub.submission.id}/reviews`,{decision:'revise',checks:[true,true,false],feedback:'Etki bölümünde kullanıcıya etkisini bir cümleyle daha açık anlatır mısın?'});
  assert.equal(rev.status,'revision');
  const resub=await ayse('POST','/api/missions/test-game/submissions',{...report,impact:'Akışı engelliyor'});
  assert.equal(resub.submission.id,sub.submission.id);assert.equal(resub.submission.attempt,1);
  // Revizyon isteyen Deniz aynı teslimi tekrar inceleyemez; Yönetici inceler
  assert.equal((await deniz('POST',`/api/submissions/${sub.submission.id}/reviews`,goodReview)).status,403);
  const acc=await admin('POST',`/api/submissions/${sub.submission.id}/reviews`,goodReview);
  assert.equal(acc.xpAwarded,70);
  assert.equal((await ayse('GET','/api/me')).xp,70);
  // İkinci kabul ve aynı görevde yeni teslim ikinci ödül üretmez
  assert.equal((await admin('POST',`/api/submissions/${sub.submission.id}/reviews`,goodReview)).status,409);
  assert.equal((await ayse('POST','/api/missions/test-game/submissions',report)).status,409);
  assert.equal((await ayse('GET','/api/me')).xp,70);

  // Portfolyo: kabul edilen kanıt ve geri bildirim görünür, değerlendirici kimliği gizli
  const pf=await ayse('GET','/api/me/submissions');
  assert.equal(pf.submissions[0].status,'accepted');assert.equal(pf.submissions[0].xpAwarded,70);
  assert.equal(pf.submissions[0].reviews.at(-1).reviewer,'Bağımsız değerlendirici');

  // Karşılıklı halka: Ayşe, kendisini kabul eden Yönetici'nin teslimini kabul edemez
  const own=await admin('POST','/api/missions/copy/submissions',{title:'Başvuru durumu metni',output:'Başvurunu aldık. İnceleme bitince sana e-posta ile haber vereceğiz; süre henüz belli değil. Bu arada senden bir şey yapman gerekmiyor. Gerekçe: kullanıcıya ne olacağını sade anlatır.',impact:'İyileştirme önerisi'});
  assert.equal((await ayse('POST',`/api/submissions/${own.submission.id}/reviews`,{decision:'accept',checks:[true,true,true],feedback:'Metin sade ve süreyi uydurmuyor; kullanıcı ne yapacağını anlıyor.'})).status,403);

  // Ret → itiraz → farklı değerlendirici
  const big=await deniz('POST','/api/missions/big-project/submissions',{title:'Tek elle kapı kontrolü',output:'Oyuncu A sol tetikle kolu çeker, oyuncu B aynı anda tek tuşla kapıyı iter. İki oyuncu da tek elle oynayabilir. Ölçüt 1: ilk denemede 60 saniyede açma. Ölçüt 2: tek elle oynayan test kullanıcısı yardım istemeden tamamlar.',impact:'İyileştirme önerisi'});
  await ayse('POST',`/api/submissions/${big.submission.id}/reviews`,{decision:'reject',checks:[false,true,true],feedback:'Tek elle kullanım için tuş yerleşimi tanımlanmamış; hangi tuşun nerede olduğu belirsiz.'});
  assert.equal((await deniz('POST','/api/missions/big-project/submissions',{...report,title:'Yeni deneme'})).status,409); // maxAttempts=1
  const ap=await deniz('POST',`/api/submissions/${big.submission.id}/appeal`,{reason:'Tuş yerleşimi ikinci paragrafta tarif edildi: tek tetik ve tek tuş.'});
  assert.equal(ap.submission.status,'appealed');
  assert.equal((await ayse('GET','/api/reviews/queue')).queue.some(x=>x.id===big.submission.id),false);
  assert.equal((await admin('GET','/api/reviews/queue')).queue.some(x=>x.id===big.submission.id),true);

  // Çıkar çatışması beyanı kuyruktan çıkarır
  await admin('POST',`/api/submissions/${big.submission.id}/conflict`,{reason:'Aynı okuldayız'});
  assert.equal((await admin('GET','/api/reviews/queue')).queue.some(x=>x.id===big.submission.id),false);

  // CSRF / içerik türü
  assert.equal((await fetch(base+'/api/auth/logout',{method:'POST'})).status,415);
  assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers:{'content-type':'application/json',origin:'https://kotu.example'},body:'{}'})).status,403);

  // Kalıcılık: yeni süreç aynı dosyadan aynı XP'yi okur
  const again=createApi({dbFile});
  assert.equal(again.db.data.xpEvents.length,1);
  assert(again.db.data.auditLog.some(e=>e.action==='review.accept'));

  await ayse('POST','/api/auth/logout',{});
  assert.equal((await ayse('GET','/api/me')).user,null);
  console.log('PASS: api — hesap, rol, görev sözleşmesi, kör bağımsız inceleme, revizyon, idempotent XP, halka engeli, itiraz, çıkar çatışması, CSRF, kalıcılık.');
}finally{server.close();rmSync(dir,{recursive:true,force:true})}
