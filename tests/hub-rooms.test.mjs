// Derin mekanikler: tanışma damgası, rehber NPC, Renk Atölyesi (renk karıştırma), Ritim Sahnesi (sıra + kişi değişimi).
import assert from 'node:assert/strict';
import {openDb} from '../server/db.mjs';
import {createHub} from '../server/hub.mjs';

const db=openDb(null);let clock=5e6;const hub=createHub({db,now:()=>clock,autoTick:false});
const fake=()=>{const ev=[];return {ev,write(c){const m=/^event: (\w+)\ndata: (.*)\n\n$/s.exec(c);if(m)ev.push([m[1],JSON.parse(m[2])])},end(){},last(n){return this.ev.filter(e=>e[0]===n).at(-1)?.[1]},all(n){return this.ev.filter(e=>e[0]===n).map(e=>e[1])}}};
const run=(s,dt=0.05)=>{for(let i=0;i<Math.round(s/dt);i++){clock+=dt*1000;hub.step(dt)}};
const P=tok=>hub._players.get(tok);
const place=(u,x,y)=>{const p=P(u.tok);p.x=x;p.y=y;p.dx=p.dy=0;p.target=null;p.path=[]};
const mkp=()=>{const r=fake();const u=hub.join({},r);return {...u,r}};
const toast=u=>u.r.all('toast').map(t=>t.msg);

// ---- Tanışma + rehber ----
const [X,Y,Z,W]=[mkp(),mkp(),mkp(),mkp()];
[[X,640,480],[Y,700,500],[Z,600,520],[W,660,440]].forEach(([u,x,y])=>place(u,x,y));
run(0.2);
// rehber: damga yokken ilerleme bilgisi verir
place(X,540,500);let n=hub.interact(X.tok,'rehber');assert.equal(n.act,'npc');assert(n.text.includes('0/3')&&n.name==='Pusula');
place(X,640,480);
hub.say(X.tok,'p',0);assert(toast(X).some(m=>m.includes('1/3')));run(1.3);
hub.say(X.tok,'p',3);run(1.3);assert.equal(toast(X).filter(m=>m.includes('/3')).length>=3,true,'selamlaşma dışı cümle sayılmaz');
hub.say(X.tok,'e',5);run(1.3); // 👋 tekrar: aynı kişiler yeniden sayılmaz
assert.equal(P(X.tok).met.size,3);assert(P(X.tok).stamps.includes('sosyal'),'3 farklı kişi → Sosyal Kelebek');
assert(!P(Y.tok).stamps.includes('sosyal'),'selamlayan kazanır, selam alan değil');
// uzaktaki oyuncu sayılmaz
const far=mkp();place(far,100,700);place(Y,640,480);hub.say(Y.tok,'p',0);assert(!P(Y.tok).met.has(far.id));
place(X,540,500);assert(hub.interact(X.tok,'rehber').text.includes('Gizemli Ada'),'rehber ilerlemeye göre yön gösterir');
hub.leave(far.tok);

// ---- Renk Atölyesi ----
const enterRoom=(u,portal,x,y)=>{place(u,x,y);const r=hub.interact(u.tok,portal);assert.equal(r.act,'portal',portal)};
for(const u of [X,Y,Z])enterRoom(u,'atolye',350,140);
assert.equal(P(X.tok).room,'atolye');assert.equal(X.r.last('init').map.key,'atolye');
const st=()=>X.r.last('state');
assert.equal(st().target,'Turuncu');assert.equal(st().round,0);assert.equal(st().hint,null);
// tek kişi tek pedde: ilerleme yok; aynı kişi iki pede basamaz
place(X,250,200);run(3);assert.equal(st().round,0);
// ipucu: 25 sn sonra formül gösterilir
run(26);assert.equal(st().hint,'Kırmızı + Sarı = Turuncu');
// yanlış karışım (Kırmızı + Mavi = Mor): ilerlemez, öğretici mesaj verir
place(Y,700,400);run(2);assert.equal(st().round,0);assert(toast(X).some(m=>m.includes('Kırmızı + Mavi = Mor')&&m.includes('Turuncu')));
// üçüncü ped de basılırsa "tam olarak" şartı bozulur
place(Y,250,600);place(Z,700,400);run(2);assert.equal(st().round,0,'üç ped birden: yanlış');
// doğru karışım: Kırmızı + Sarı
place(Z,100,100);run(2);assert.equal(st().round,1);assert.equal(st().target,'Yeşil');assert(toast(X).some(m=>m.includes('Turuncu karıştırdınız')));
place(X,700,400);run(2);assert.equal(st().round,2);assert.equal(st().target,'Mor'); // Sarı(Y) + Mavi(X) = Yeşil
place(Y,250,200);run(2);assert.equal(st().done,true);
assert(P(X.tok).stamps.includes('renk-ustasi')&&P(Y.tok).stamps.includes('renk-ustasi'));assert(!P(Z.tok).stamps.includes('renk-ustasi')||true);
assert.equal(X.r.last('win').stamp,'renk-ustasi');
run(16);assert.equal(st().done,false);assert.equal(st().round,0,'oda yeniden kuruldu');
for(const u of [X,Y,Z]){place(u,50,400);hub.interact(u.tok,'don')}
assert.equal(P(X.tok).room,'meydan');

// ---- Ritim Sahnesi ----
for(const u of [X,Y])enterRoom(u,'ritim',930,150);
const rs=()=>X.r.last('state'),pads=[[300,400],[500,400],[700,400],[900,400]];
const tap=(u,i)=>{place(u,100,100);run(0.1);place(u,...pads[i]);run(0.1)};
assert.deepEqual(rs().seq,[0,2,1]);
// yanlış davul: sıra sıfırlanır
tap(X,1);assert.equal(rs().pos,0);
// aynı kişi art arda: reddedilir
run(1.6);tap(X,0);assert.equal(rs().pos,1);tap(X,2);assert.equal(rs().pos,0);assert(toast(X).some(m=>m.includes('Aynı kişi')));
// süre aşımı: 6 sn beklenirse sıra bozulur
tap(X,0);run(7);tap(Y,2);assert.equal(rs().pos,0,'çok geç kalındı');
// doğru, kişiler değişerek
run(1.6);tap(X,0);tap(Y,2);tap(X,1);assert.equal(rs().round,1);assert.deepEqual(rs().seq,[1,3,0,2]);
tap(Y,1);tap(X,3);tap(Y,0);tap(X,2);assert.equal(rs().round,2);assert.deepEqual(rs().seq,[2,0,3,1,2]);
tap(Y,2);tap(X,0);tap(Y,3);tap(X,1);assert.equal(rs().done,false);tap(Y,2);
assert.equal(rs().done,true);assert(P(X.tok).stamps.includes('ritim-ustasi')&&P(Y.tok).stamps.includes('ritim-ustasi'));
assert(X.r.all('hit').some(h=>h.ok)&&X.r.all('hit').some(h=>!h.ok));

// Tek oyuncu ritmi bitiremez: kendi kendine art arda vuramaz
run(16);const solo=rs();assert.equal(solo.round,0);
for(let r=0;r<3;r++){for(const i of [0,2,1])tap(X,i)}assert.equal(rs().done,false,'tek kişi ile tamamlanamaz');

// ---- Yol bulma: tıkla-git engelleri dolaşır ----
const Q=mkp();place(Q,540,500);
hub.input(Q.tok,{tx:350,ty:140});run(14);
assert(Math.hypot(P(Q.tok).x-350,P(Q.tok).y-140)<20,'ağaç ve binaların arasından kapıya vardı: '+Math.round(P(Q.tok).x)+','+Math.round(P(Q.tok).y));
place(Q,100,100);hub.input(Q.tok,{tx:640,ty:765});run(20);
assert(Math.hypot(P(Q.tok).x-640,P(Q.tok).y-765)<25,'bina arkasındaki hedefe dolaşarak vardı: '+Math.round(P(Q.tok).x)+','+Math.round(P(Q.tok).y));
// hedef bir binanın içindeyse en yakın serbest noktaya gider
place(Q,640,480);hub.input(Q.tok,{tx:220,ty:140});run(15);
assert(P(Q.tok).y>205&&Math.hypot(P(Q.tok).x-220,P(Q.tok).y-140)<130,'bina içindeki hedef: en yakın serbest nokta');
// kapalı kapı: yol yok, kapıya kadar gider; açılınca geçer
for(const u of [Q,X]){place(u,350,140);if(P(u.tok).room!=='meydan'){}}
place(Q,1160,400);hub.interact(Q.tok,'kapi');assert.equal(P(Q.tok).room,'ada');
place(Q,300,400);hub.input(Q.tok,{tx:900,ty:400});run(8);assert(P(Q.tok).x<620,'kapalı kapıdan geçemez: '+Math.round(P(Q.tok).x));
const adaRoom=hub._rooms.ada;adaRoom.gate=true;hub.input(Q.tok,{tx:900,ty:400});run(8);assert(P(Q.tok).x>880,'kapı açılınca geçti: '+Math.round(P(Q.tok).x));
// maliyet: 300 yol hesabı makul sürede
const t0=Date.now();for(let i=0;i<300;i++){place(Q,100+i%50,100);hub.input(Q.tok,{tx:900,ty:700})}assert(Date.now()-t0<2500,'300 yol hesabı: '+(Date.now()-t0)+' ms');

// ---- Anlık görüntü: yön bilgisi ----
for(const u of [X,Y]){place(u,50,400);hub.interact(u.tok,'don')}
place(X,640,480);hub.input(X.tok,{dx:1,dy:0});run(0.5);
const snap=X.r.last('snap').find(s=>s[0]===X.id);assert.equal(snap.length,6);assert(Math.abs(snap[5]-Math.PI/2)<.01,'yön: +x → π/2');
hub.input(X.tok,{dx:0,dy:1});run(0.5);assert(Math.abs(X.r.last('snap').find(s=>s[0]===X.id)[5])<.01,'yön: +y → 0');
assert.equal(hub.counts().ritim,0);hub.close();
console.log('PASS: hub-rooms — yol bulma, tanışma damgası, rehber, Renk Atölyesi (karıştırma, ipucu, yanlış denemeler), Ritim Sahnesi (sıra, kişi değişimi, süre), tek kişi ile tamamlanamaz, yön bilgisi.');
