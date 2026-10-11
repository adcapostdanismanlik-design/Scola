// Gelişim sistemi (Tohum → Fidan → Ağaç → Orman): eşikler, zaman, oyundan bağımsızlık, mentörlük, bağımsız değerlendirme, Orman metrikleri.
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createApi} from '../server/app.mjs';
const G=createRequire(import.meta.url)('../dist/assets/growth.js');

let offset=0;const DAY=864e5;
const api=createApi({dbFile:null,adminEmails:['yonetici@ornek.test'],clock:()=>Date.now()+offset});
const server=http.createServer((q,s)=>api.handle(q,s));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const client=()=>{let cookie='';return async(method,url,body)=>{const res=await fetch(base+url,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return {...await res.json(),status:res.status}}};
let n=0;const mkUser=async name=>{const c=client(),r=await c('POST','/api/auth/register',{name,email:`u${++n}-${name}@ornek.test`.toLowerCase(),password:'guclu-sifre-1'});assert.equal(r.status,200,name);return {c,id:r.user.id,name}};
const admin=client();await admin('POST','/api/auth/register',{name:'Yönetici',email:'yonetici@ornek.test',password:'guclu-sifre-1'});
const text=(w='x')=>('Bu bir test çıktısıdır, ölçütleri açıkça karşılar ve ayrıntılı anlatılmıştır. '+w).padEnd(130,'.');
// admin yetkisiyle bir görevi öğrenci adına tamamlat
async function earn(u,mission){
  const s=await u.c('POST',`/api/missions/${mission}/submissions`,{title:'Teslim '+mission,output:text(mission),impact:'iyileştirme'});assert.equal(s.status,200,mission+' teslim: '+JSON.stringify(s));
  const r=await admin('POST',`/api/submissions/${s.submission.id}/reviews`,{decision:'accept',checks:[true,true,true],feedback:'Ölçütler karşılanmış; açık, tekrarlanabilir ve gerekçeli bir çıktı.'});assert.equal(r.status,200,'kabul '+mission+JSON.stringify(r));return r;
}
const growth=u=>u.c('GET','/api/me/growth');
const req=(g,k)=>g.requirements.find(r=>r.key===k);

// ---- Saf hesaplama (tarayıcı ve sunucu aynı dosyayı kullanır) ----
assert.equal(G.computeGrowth({xp:0,accepted:0,areas:0,decided:0,tenureDays:0}).stage,'tohum');
assert.equal(G.computeGrowth({xp:200,accepted:3,areas:2,decided:3,tenureDays:7}).stage,'fidan');
assert.equal(G.computeGrowth({xp:199,accepted:3,areas:2,decided:3,tenureDays:7}).stage,'tohum','XP eşiği');
assert.equal(G.computeGrowth({xp:300,accepted:3,areas:1,decided:3,tenureDays:30}).stage,'tohum','tek alan yetmez');
assert.equal(G.computeGrowth({xp:300,accepted:3,areas:2,decided:8,tenureDays:30}).stage,'tohum','düşük kabul oranı (3/8)');
assert.equal(G.computeGrowth({xp:9999,accepted:99,areas:9,decided:99,tenureDays:999}).stage,'fidan','Ağaç yalnız değerlendirmeyle gelir, sayılarla gelmez');
assert.equal(G.computeGrowth({xp:0,accepted:0,areas:0,decided:0,tenureDays:0,treeAt:1}).stage,'agac');
assert.equal(G.computeGrowth({xp:0,accepted:0,areas:0,decided:0,tenureDays:0,fidanAt:1}).stage,'fidan','kalıcı: geri düşmez');
assert.equal(G.forestStatus({trees:2,seeds:9,totalMentored:9,retention:1,overloaded:0}).id,'filiz');
assert.equal(G.forestStatus({trees:3,seeds:3,totalMentored:3,retention:.8,overloaded:0}).id,'saglikli');
assert.equal(G.forestStatus({trees:3,seeds:3,totalMentored:3,retention:.8,overloaded:1}).id,'gelisiyor','aşırı yük sağlıklı sayılmaz');

// ---- Kişiler ----
const [S,C,M1,M2,M3,M4,M5]=[await mkUser('Tohum'),await mkUser('Aday'),await mkUser('Mentor1'),await mkUser('Mentor2'),await mkUser('Mentor3'),await mkUser('Mentor4'),await mkUser('Mentor5')];
// Kurucu ağaç yalnız yönetici
assert.equal((await S.c('POST',`/api/admin/users/${M1.id}/founding-tree`,{enabled:true})).status,403);
for(const m of [M1,M2,M3,M4,M5])assert.equal((await admin('POST',`/api/admin/users/${m.id}/founding-tree`,{enabled:true})).ok,true);
let me=await M1.c('GET','/api/me');assert.equal(me.stage,'agac');assert(me.user.roles.includes('mentor'));

// ---- Tohum: yol haritası ve ölçümler; oyundan bağımsızlık ----
let g=await growth(S);assert.equal(g.stage,'tohum');assert.equal(g.independentOfGame,true);assert.equal(g.stats.xp,0);
assert.equal((await S.c('POST','/api/me/route',{areas:[],goal:'öğrenmek'})).status,400);assert.equal((await S.c('POST','/api/me/route',{areas:['hack'],goal:'öğrenmek istiyorum'})).status,400);
g=await S.c('POST','/api/me/route',{areas:['art','culture'],goal:'Resim yapıp sergi açmak'});assert.equal(g.routeProgress.length,2);assert.equal(g.routeProgress[0].done,0);
// Meydan damgaları / demo verisi seviyeye etki etmez
api.db.data.users.find(u=>u.id===S.id).stamps=['ilk-adim','sosyal','ada-kasifi','renk-ustasi','ritim-ustasi'];
g=await growth(S);assert.equal(g.stage,'tohum');assert.equal(g.stats.xp,0);assert.equal(g.stats.accepted,0);

// ---- Mentör dizini, talep ve kapasite ----
const dir=await S.c('GET','/api/mentors');assert.equal(dir.mentors.length,5);assert(dir.mentors.every(m=>m.cap===5&&m.load===0&&!('email' in m)));
assert.equal((await S.c('POST','/api/mentorships',{mentorId:M1.id,message:'kısa'})).status,400);
assert.equal((await S.c('POST','/api/mentorships',{mentorId:S.id,message:'Kendime mentör olmak istiyorum yazısı'})).status,404);
assert.equal((await M2.c('POST','/api/mentorships',{mentorId:M1.id,message:'Ben de bir mentör ama öğrenci olmak istiyorum'})).status,409,'Ağaç öğrenci olamaz');
const rq=await S.c('POST','/api/mentorships',{mentorId:M1.id,message:'Sanat alanında yol göstermeni isterim, birlikte çalışalım.'});assert.equal(rq.mentorship.status,'pending');
assert.equal((await S.c('POST','/api/mentorships',{mentorId:M1.id,message:'Aynı mentöre ikinci talep gönderiyorum şimdi'})).status,409);
assert.equal((await S.c('POST',`/api/mentorships/${rq.mentorship.id}/respond`,{accept:true})).status,404,'öğrenci kendi talebini kabul edemez');
assert.equal((await M1.c('POST',`/api/mentorships/${rq.mentorship.id}/respond`,{accept:true})).mentorship.status,'active');
assert.equal((await S.c('POST','/api/mentorships',{mentorId:M2.id,message:'Zaten bir mentörüm var ama ikinci istiyorum'})).status,409);
// kapasite: bir mentöre en fazla 5 öğrenci
const kids=[];for(let i=0;i<6;i++)kids.push(await mkUser('Cocuk'+i));
for(let i=0;i<5;i++){const r=await kids[i].c('POST','/api/mentorships',{mentorId:M5.id,message:'Merhaba, mentörlüğünü isterim çünkü öğrenmek istiyorum'});assert.equal((await M5.c('POST',`/api/mentorships/${r.mentorship.id}/respond`,{accept:true})).mentorship.status,'active')}
assert.equal((await kids[5].c('POST','/api/mentorships',{mentorId:M5.id,message:'Ben de katılmak isterim, yer var mı acaba?'})).status,409,'mentör dolu');
assert.equal((await S.c('GET','/api/mentors')).mentors.find(m=>m.id===M5.id).load,5);

// ---- Mentörlük notları (puan vermez) ----
assert.equal((await S.c('POST',`/api/mentorships/${rq.mentorship.id}/note`,{text:'kısa'})).status,400);
assert.equal((await M1.c('POST',`/api/mentorships/${rq.mentorship.id}/note`,{text:'İlk görüşmemizde hedeflerini konuştuk; ilk görev önerisi: sanat yorumu.'})).mentorship.notes.length,1);
assert.equal((await C.c('POST',`/api/mentorships/${rq.mentorship.id}/note`,{text:'Başkasının mentörlüğüne not yazmaya çalışıyorum'})).status,404);
g=await growth(S);assert.equal(g.stats.mentorNotes,1);assert.equal(g.stats.xp,0,'mentör notu XP üretmez');

// ---- Tohum → Fidan: yetkinlik + zaman ----
await earn(S,'copy');await earn(S,'art-reading');await earn(S,'culture-story');
g=await growth(S);assert.equal(g.stats.xp,210);assert.equal(g.stats.accepted,3);assert.equal(g.stats.areas,3);
assert.equal(g.stage,'tohum','yetkinlik tamam ama zaman şartı yok: henüz Tohum');assert.equal(req(g,'tenure').met,false);
assert.equal(req(g,'rate').display,'100%');assert.equal(g.routeProgress[0].steps[0].done,true);
// Aday tüm görevleri yapar
for(const m of ['test-game','test-cart','copy','art-reading','culture-story','trade-pitch','game-idea','music-listen','big-project'])await earn(C,m);
g=await growth(C);assert.equal(g.stats.xp,720);assert.equal(g.stats.accepted,9);assert.equal(g.stage,'tohum');
offset=8*DAY; // 8 gün sonra
g=await growth(S);assert.equal(g.stage,'fidan','zamanla Fidan');assert.equal(g.next,'agac');assert(g.progress<1);
assert.equal((await S.c('GET','/api/me')).stageEmoji,'🌱');
assert.equal((await growth(C)).stage,'fidan');
// Ağaç'a yalnız sayılarla çıkılmaz
assert.equal((await C.c('POST','/api/tree-applications',{statement:text('aday')})).status,409);

// ---- Çırak mentörlük ----
const mid=rq.mentorship.id;
assert.equal((await M1.c('POST',`/api/mentorships/${mid}/apprentice`,{userId:S.id})).status,400,'öğrenci çırak olamaz');
assert.equal((await M1.c('POST',`/api/mentorships/${mid}/apprentice`,{userId:M2.id})).status,409,'Ağaç çırak olamaz');
assert.equal((await M2.c('POST',`/api/mentorships/${mid}/apprentice`,{userId:C.id})).status,404,'yalnız mentör ekler');
assert.equal((await M1.c('POST',`/api/mentorships/${mid}/apprentice`,{userId:C.id})).mentorship.apprentice.status,'invited');
assert.equal((await S.c('POST',`/api/mentorships/${mid}/apprentice/accept`,{accept:true})).status,404,'davet yalnız çırağa');
assert.equal((await C.c('POST',`/api/mentorships/${mid}/apprentice/accept`,{accept:true})).mentorship.apprentice.status,'active');
offset=9*DAY;g=await growth(C);assert.equal(req(g,'apprentice').met,false);assert.equal(g.canApplyTree,false);
// ---- Ağaç adaylığı: 60. gün ----
offset=60*DAY;g=await growth(C);assert.equal(req(g,'tenure').met,true);assert.equal(req(g,'apprentice').met,true,'14+ gün, öğrencisi gerçek katkı üretti');assert.equal(g.canApplyTree,true);
assert.equal((await C.c('POST','/api/tree-applications',{statement:'çok kısa'})).status,400);
assert.equal((await C.c('POST','/api/tree-applications',{statement:text('Tohumlara yol göstermeyi ve geri bildirim vermeyi seviyorum; çırak olarak öğrendiklerimi paylaşmak istiyorum.')})).ok,true);
assert.equal((await C.c('POST','/api/tree-applications',{statement:text('ikinci')})).status,409,'tek açık adaylık');
// Değerlendirme kuyruğu: körleme, bağımsızlık
const q1=await M1.c('GET','/api/tree-applications/queue');assert.equal(q1.queue.length,0,'mentörlük bağı olan değerlendiremez');
assert.equal((await S.c('GET','/api/tree-applications/queue')).status,403,'Tohum kuyruğu göremez');
const q2=await M2.c('GET','/api/tree-applications/queue');assert.equal(q2.queue.length,1);assert(q2.queue[0].candidate.startsWith('Fidan #')&&!JSON.stringify(q2).includes('Aday')&&!JSON.stringify(q2).includes(C.id));
const aid=q2.queue[0].id,pass={bilgi:true,geriBildirim:true,guvenilirlik:true,paylasim:true},fb='Çırak mentörlükte tutarlı ve saygılı geri bildirim verdiği görülüyor; katkıları güvenilir.';
assert.equal((await M1.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:fb})).status,403);
assert.equal((await C.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:fb})).status,403,'kendi adaylığını değerlendiremez');
assert.equal((await M2.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:'kısa'})).status,400);
// çıkar çatışması beyanı kuyruktan çıkarır
await M3.c('POST',`/api/tree-applications/${aid}/conflict`,{reason:'Aynı ekipteyiz'});assert.equal((await M3.c('GET','/api/tree-applications/queue')).queue.length,0);assert.equal((await M3.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:fb})).status,403);
// 1 onay → açık; 1 ret → açık (bölünmüş); üçüncü karar verir
assert.equal((await M2.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:fb})).outcome,'open');
assert.equal((await M2.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:fb})).status,403,'aynı kişi iki kez değerlendiremez');
assert.equal((await M4.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:{...pass,paylasim:false},feedback:'Bilgi paylaşımı konusunda henüz yeterli örnek görmedim, daha fazlası gerekir.'})).outcome,'open');
assert.equal((await growth(C)).stage,'fidan');
assert.equal((await M5.c('POST',`/api/tree-applications/${aid}/evaluate`,{rubric:pass,feedback:fb})).outcome,'passed');
g=await growth(C);assert.equal(g.stage,'agac');assert.equal(g.next,null);me=await C.c('GET','/api/me');assert.equal(me.stageEmoji,'🌳');assert(me.user.roles.includes('mentor'));
assert.equal(g.application.status,'passed');assert.equal(g.application.evals.length,3);assert(!JSON.stringify(g.application).includes(M2.id),'değerlendirici kimliği gizli');
// Yeni Ağaç artık mentörlük alabilir
assert.equal((await S.c('GET','/api/mentors')).mentors.some(m=>m.id===C.id),true);

// ---- Orman: topluluk metriği ----
assert.equal((await S.c('POST','/api/forests',{name:'Tohumluk',mission:'Gençlerin sanatla büyümesine mentörlük eden bir orman kuruyoruz.',area:'art'})).status,403,'yalnız Ağaç orman kurar');
const fr=await M1.c('POST','/api/forests',{name:'Sanat Ormanı',mission:'Gençlerin sanatla büyümesine mentörlük eden bir orman kuruyoruz.',area:'art'});assert.equal(fr.forest.metrics.status.id,'filiz');
const fid=fr.forest.id;
assert.equal((await M1.c('POST','/api/forests',{name:'sanat ormanı',mission:'Aynı ada sahip ikinci bir orman kurmayı deniyorum şimdi.',area:'art'})).status,409);
assert.equal((await S.c('POST',`/api/forests/${fid}/invite`,{userId:M2.id})).status,404,'üye olmayan davet edemez');
assert.equal((await M1.c('POST',`/api/forests/${fid}/invite`,{userId:S.id})).status,404,'Ağaç olmayan davet edilemez');
for(const m of [M2,M4]){assert.equal((await M1.c('POST',`/api/forests/${fid}/invite`,{userId:m.id})).forest.me,'member');}
assert.equal((await M3.c('POST',`/api/forests/${fid}/join`,{})).status,403,'davetsiz katılamaz');
for(const m of [M2,M4])assert.equal((await m.c('POST',`/api/forests/${fid}/join`,{})).forest.me,'member');
let list=await S.c('GET','/api/forests');const f=list.forests.find(x=>x.id===fid);
assert.equal(f.metrics.trees,3);assert.equal(f.metrics.seeds,1);assert.equal(f.metrics.totalMentored,1);assert.equal(f.metrics.saplingsGrown,1,'öğrenci mentörlük sırasında Fidan oldu');assert.equal(f.metrics.status.id,'gelisiyor');
assert(!JSON.stringify(f).includes('@'),'orman verisinde e-posta yok');assert(f.members.every(m=>m.name));
// kişiler sıralanmıyor/puanlanmıyor: orman çıktısında kişi başına skor alanı yok
assert(!JSON.stringify(f).match(/"(score|rating|rank|puan)"/i));
// bir Ağaç en fazla 2 ormanda
await M1.c('POST','/api/forests',{name:'Müzik Ormanı',mission:'Müzik alanında yeni nesil mentörler yetiştirmek için kurulan orman.',area:'music'});
assert.equal((await M1.c('POST','/api/forests',{name:'Üçüncü Orman',mission:'Üçüncü ormana üye olmaya çalışıyorum ama limit var.',area:'game'})).status,409);
// ayrılma: kurucu ayrılırsa devredilir
assert.equal((await M1.c('POST',`/api/forests/${fid}/leave`,{})).ok,true);list=await S.c('GET','/api/forests');assert.equal(list.forests.find(x=>x.id===fid).metrics.trees,2);assert.equal(list.forests.find(x=>x.id===fid).metrics.status.id,'filiz');

// ---- Canlı nabız sayaçları ve denetim kaydı ----
const pulse=await fetch(base+'/api/pulse').then(r=>r.json());assert(pulse.stages.agac>=6&&pulse.stages.fidan>=1&&pulse.stages.tohum>=1&&pulse.stages.forests>=1);
assert(api.db.data.auditLog.some(a=>a.action==='tree.passed')&&api.db.data.auditLog.some(a=>a.action==='stage.fidan')&&api.db.data.auditLog.some(a=>a.action==='founding-tree.grant'));
assert(api.db.data.stageEvents.some(e=>e.userId===S.id&&e.stage==='fidan'&&e.mentorIds.includes(M1.id)),'Fidan olma anında mentör kaydı');
api.close();server.close();
console.log('PASS: growth — eşikler, zaman, oyundan bağımsızlık, mentör dizini/kapasite, notlar, çırak mentörlük, bağımsız Ağaç değerlendirmesi (çatışma, bölünme), Orman metrikleri ve sınırları, denetim.');
setTimeout(()=>process.exit(0),50);
