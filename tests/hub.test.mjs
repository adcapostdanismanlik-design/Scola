// Meydan motoru: sunucu otoriter hareket, çarpışma, iş birliği kapısı, güvenli sohbet, damga, bildirim.
import assert from 'node:assert/strict';
import http from 'node:http';
import {openDb} from '../server/db.mjs';
import {createHub,MAPS,PHRASES} from '../server/hub.mjs';
import {createApi} from '../server/app.mjs';

const db=openDb(null);
let clock=1e6;const hub=createHub({db,now:()=>clock,autoTick:false});
const fake=()=>{const ev=[];return {ev,write(c){const m=/^event: (\w+)\ndata: (.*)\n\n$/s.exec(c);if(m)ev.push([m[1],JSON.parse(m[2])])},end(){this.ended=true},last(n){return this.ev.filter(e=>e[0]===n).at(-1)?.[1]}}};
const run=(s,dt=0.05)=>{for(let i=0;i<Math.round(s/dt);i++){clock+=dt*1000;hub.step(dt)}};
const place=(tok,x,y)=>{const p=hub._players.get(tok);p.x=x;p.y=y;p.dx=p.dy=0;p.target=null};
const P=tok=>hub._players.get(tok);

// Katılım: misafir adı otomatik, hazır avatar doğrulanır, ilk damga verilir
const ra=fake(),rb=fake(),rc=fake();
const A=hub.join({avatar:{c:2,e:3}},ra),B=hub.join({avatar:{c:99,e:-1}},rb),C=hub.join({},rc);
assert(A.tok&&B.tok&&C.tok&&A.id!==B.id);
assert.equal(ra.last('init').map.key,'meydan');assert(ra.last('init').players.length>=1);
assert(P(B.tok).avatar.c<8&&P(B.tok).avatar.e<10); // geçersiz avatar düzeltilir
assert(!/[<>]/.test(P(A.tok).name));assert.deepEqual(P(A.tok).stamps,['ilk-adim']);
assert(ra.ev.some(e=>e[0]==='join'&&e[1].id===B.id)); // diğerleri yeni gelen oyuncuyu görür

// Hareket sunucuda: hız sınırı ve duvar çarpışması
place(A.tok,640,480);hub.input(A.tok,{dx:1,dy:0});run(1);
const ax=P(A.tok).x;assert(ax>640+120&&ax<640+170,'1 sn ~150px: '+ax);
hub.input(A.tok,{dx:99999,dy:99999});run(1);assert(Math.hypot(P(A.tok).x-ax,P(A.tok).y-480)<=155,'hız büyütülemez');
place(A.tok,640,330);hub.input(A.tok,{dx:0,dy:-1});run(2); // çeşmeye değil, kültür müzesine doğru
assert(P(A.tok).y>=190,'bina içine girilemez: '+P(A.tok).y);
place(A.tok,640,470);hub.input(A.tok,{dx:0,dy:-1});run(1);assert(P(A.tok).y>=430+12,'çeşme engel: '+P(A.tok).y);
hub.input(A.tok,{dx:-1,dy:0});run(20);assert(P(A.tok).x>=12,'dünya sınırı');
place(A.tok,640,480);hub.input(A.tok,{tx:700,ty:480});run(3);assert(Math.abs(P(A.tok).x-700)<6,'dokunarak yürü hedefine varır');

// Anlık görüntü: hareketten sonra herkese gider
assert(rb.ev.some(e=>e[0]==='snap'));

// Güvenli sohbet: yalnız hazır cümle / emoji, hız sınırı
assert.equal(hub.say(A.tok,'p',3).ok,true);assert.equal(rb.last('say').i,3);
assert.equal(hub.say(A.tok,'p',4).ok,false,'1.2 sn içinde ikinci mesaj');run(1.5);
assert.equal(hub.say(A.tok,'p',9999).ok,false);assert.equal(hub.say(A.tok,'x',0).ok,false);
assert.equal(hub.say(A.tok,'p','<script>').ok,false);assert.equal(hub.say(A.tok,'e',2).ok,true);
assert(PHRASES.every(t=>t.length<40));

// Etkileşim: yakınlık şartı, görev kapısı istemciye eylem döner
place(A.tok,300,300);assert.equal(hub.interact(A.tok,'sanat').ok,false);
place(A.tok,220,245);const it=hub.interact(A.tok,'sanat');assert.deepEqual([it.ok,it.act,it.arg],[true,'mission','art-reading']);
assert.equal(hub.interact(A.tok,'yok').ok,false);

// Bildirim
place(B.tok,500,500);
assert.equal(hub.report(A.tok,B.id,0).ok,true);assert.equal(db.data.hubReports.length,1);
assert.equal(hub.report(A.tok,B.id,0).ok,false,'bildirim hız sınırı');assert.equal(hub.report(A.tok,A.id,0).ok,false,'kendini bildiremez');assert.equal(hub.report(A.tok,B.id,99).ok,false);
run(11);assert.equal(hub.report(A.tok,'olmayan',0).ok,false);

// ---- Gizemli Ada: iş birliği ----
place(A.tok,1160,400);assert.equal(hub.interact(A.tok,'kapi').act,'portal');
assert.equal(P(A.tok).room,'ada');assert.equal(ra.last('init').map.key,'ada');assert(rb.ev.some(e=>e[0]==='leave'&&e[1].id===A.id));
place(B.tok,1160,400);hub.interact(B.tok,'kapi');
// Tek kişi iki plakaya aynı anda basamaz: kapı açılmaz
place(A.tok,300,160);place(B.tok,700,700+0);P(B.tok).room==='ada';
run(3);assert.equal(MAPS.ada.gate.k,'gate');assert.equal(ra.last('state').gate,false,'tek plaka yetmez');
// İkisi aynı anda: 1.5 sn sonra açılır
place(B.tok,300,640);run(1.0);assert.equal(ra.last('state').gate,false,'1.5 sn dolmadan açılmaz');run(0.8);assert.equal(ra.last('state').gate,true,'iki kişi iki plakada');
assert(ra.ev.some(e=>e[0]==='toast'));
// Kapıdan geçilir (kapalıyken bloke olurdu), ipuçları kapıdan önce alınamaz
place(A.tok,560,400);hub.input(A.tok,{dx:1,dy:0});run(2);assert(P(A.tok).x>700,'açık kapıdan geçti');
// Sandık erken açılmaz
place(A.tok,1180,400);assert.equal(hub.interact(A.tok,'sandik').ok,false);
// Üç ipucu
place(A.tok,800,150);const c0=hub.interact(A.tok,'ip0');assert(c0.fact&&!c0.again);
place(A.tok,800,150);assert.equal(hub.interact(A.tok,'ip0').again,true,'aynı ipucu tekrar sayılmaz');
place(A.tok,1000,420);hub.interact(A.tok,'ip1');place(A.tok,800,650);hub.interact(A.tok,'ip2');
assert.deepEqual(ra.last('state').clues,[true,true,true]);
// Sandık: damga yalnız odadakilere, kalıcı kullanıcıya DB'de
place(A.tok,1180,400);assert.equal(hub.interact(A.tok,'sandik').ok,true);
assert(P(A.tok).stamps.includes('ada-kasifi')&&P(B.tok).stamps.includes('ada-kasifi')&&!P(C.tok).stamps.includes('ada-kasifi'));
assert.equal(ra.last('win').crew.length,2);
// 15 sn sonra oda sıfırlanır, sağ taraftakiler başlangıca döner
run(16);assert.equal(ra.last('state').gate,false);assert(P(A.tok).x<600);

// Girişli kullanıcı: damga kalıcı, ikinci sekme eskiyi atar
db.tx(d=>d.users.push({id:'u1',name:'Ayşe',email:'a@b.c',roles:['producer'],stamps:[]}));
const ru=fake(),U=hub.join({userId:'u1',name:'Ayşe',stamps:[]},ru);
assert.equal(P(U.tok).name,'Ayşe');assert(db.data.users[0].stamps.includes('ilk-adim'));
const ru2=fake(),U2=hub.join({userId:'u1',name:'Ayşe',stamps:db.data.users[0].stamps},ru2);
assert.equal(ru.last('kicked').reason,'another-tab');assert.equal(ru.ended,true);assert(!hub._players.has(U.tok));
hub.leave(U2.tok);

// Kapasite
const many=[];for(let i=0;i<70;i++){const r=hub.join({},fake());many.push(r)}
assert.equal(hub.counts().meydan,60,'Meydan kapasitesi 60');assert(many.some(r=>r.error==='full'));
hub.close();

// ---- HTTP + SSE uçtan uca ----
const api=createApi({dbFile:null});
const srv=http.createServer((q,s)=>api.handle(q,s));await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${srv.address().port}`;
async function sse(room='meydan'){
  const ctl=new AbortController(),res=await fetch(`${base}/api/hub/stream?room=${room}&c=1&e=2`,{signal:ctl.signal});
  assert.equal(res.headers.get('content-type').split(';')[0],'text/event-stream');
  const reader=res.body.getReader(),dec=new TextDecoder(),events=[];let buf='';
  (async()=>{try{for(;;){const {value,done}=await reader.read();if(done)break;buf+=dec.decode(value);let i;while((i=buf.indexOf('\n\n'))>=0){const raw=buf.slice(0,i);buf=buf.slice(i+2);const m=/event: (\w+)\ndata: (.*)/s.exec(raw);if(m)events.push([m[1],JSON.parse(m[2])])}}}catch{}})();
  const wait=async(name,pred=()=>true,ms=3000)=>{const t=Date.now();for(;;){const e=events.find(e=>e[0]===name&&pred(e[1]));if(e)return e[1];if(Date.now()-t>ms)throw new Error('timeout '+name);await new Promise(r=>setTimeout(r,25))}};
  return {events,wait,close:()=>ctl.abort()};
}
const post=(u,b)=>fetch(base+u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
const s1=await sse(),i1=await s1.wait('init'),s2=await sse(),i2=await s2.wait('init');
assert.equal(i2.players.length,2);await s1.wait('join',j=>j.id===i2.id);
const x0=i1.players.find(p=>p.id===i1.id).pos[1];
await post('/api/hub/input',{tok:i1.tok,dx:1,dy:0});
await s2.wait('snap',s=>s.some(p=>p[0]===i1.id&&p[1]>x0+20),4000);
assert.equal((await post('/api/hub/input',{tok:'sahte-jeton',dx:1,dy:0})).ok,false,'başkasının jetonu olmadan hareket ettirilemez');
await post('/api/hub/say',{tok:i2.tok,k:'e',i:0});const sy=await s1.wait('say');assert.equal(sy.id,i2.id);
const info=await fetch(base+'/api/hub/info').then(r=>r.json());assert.equal(info.online.meydan,2);assert(!JSON.stringify(info).includes(i1.tok));
assert.equal((await fetch(base+'/api/pulse').then(r=>r.json())).hubOnline,2);
s1.close();await s2.wait('leave',l=>l.id===i1.id);
s2.close();api.close();srv.close();
console.log('PASS: hub — sunucu otoriter hareket, çarpışma, hız sınırı, güvenli sohbet, yakınlık, iş birliği kapısı, ipuçları, damga, bildirim, tek sekme, kapasite, SSE uçtan uca.');
setTimeout(()=>process.exit(0),50);
