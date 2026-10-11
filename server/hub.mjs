// Scola Meydanı: gerçek zamanlı çok oyunculu hub (Server-Sent Events + POST).
// Sunucu otoriterdir: konum, çarpışma, kapı/bulmaca ve damga kararları burada verilir; istemci yalnız niyet gönderir.
// Güvenlik: serbest metin sohbet YOKTUR (yalnız hazır cümle / emoji), özel mesaj YOKTUR.
// Dünya 2B düzlemde (x, y) tutulur; istemci bunu 2B ya da 3B olarak çizebilir.
import {randomBytes} from 'node:crypto';

export const PHRASES=['Merhaba! 👋','Birlikte keşfe çıkalım mı?','Bana yardım eder misin?','Teşekkürler!','Harika iş!','Beni takip et','Burada bekle','Hadi Ada\'ya gidelim!','Hangi görevi yapıyorsun?','Çok güzel bir yer!','Hazırım!','Bir dakika bekle'];
export const EMOTES=['😀','👏','❤️','🎉','🤔','👋','😮','💡'];
export const REPORT_REASONS=['Rahatsız edici davranış','Uygunsuz isim','Başkasını taklit ediyor','Diğer'];
export const STAMPS={
  'ilk-adim':{label:'İlk Adım',icon:'👣',hint:'Meydan\'a ilk kez gir.'},
  'sosyal':{label:'Sosyal Kelebek',icon:'🦋',hint:'Yanındaki 3 farklı kişiye "Merhaba" de (hazır cümle ya da 👋).'},
  'ada-kasifi':{label:'Ada Kaşifi',icon:'🧭',hint:'Gizemli Ada\'da kapıyı birlikte aç, 3 ipucunu bul, sandığı aç.'},
  'renk-ustasi':{label:'Renk Ustası',icon:'🎨',hint:'Renk Atölyesi\'nde arkadaşlarınla üç rengi karıştır.'},
  'ritim-ustasi':{label:'Ritim Ustası',icon:'🥁',hint:'Ritim Sahnesi\'nde davulları sırayla ve kişiler değişerek çal.'}};
const COLORS=8,FACES=10,R=12,SPEED=150,ROOM_CAP={meydan:60,ada:20,atolye:12,ritim:12},TOTAL_CAP=120,AFK_MS=180000,MEET_DIST=220;
const ADJ=['Meraklı','Neşeli','Cesur','Yaratıcı','Sakin','Çevik','Gizemli','Parlak'],ANI=['Kaşif','Kedi','Tilki','Baykuş','Panda','Yunus','Kartal','Ahtapot'];
const rid=()=>randomBytes(9).toString('base64url');
const pick=a=>a[Math.floor(Math.random()*a.length)];

const bld=(x,y,w,h,label,color)=>({x,y,w,h,k:'building',label,color});
const tree=(x,y)=>({x,y,w:36,h:36,k:'tree'});
const rock=(x,y)=>({x,y,w:40,h:40,k:'rock'});
const back={id:'don',x:50,y:400,r:50,emoji:'🏙️',label:'Meydan\'a dön',act:'portal',arg:'meydan'};
export const MAPS={
  meydan:{key:'meydan',title:'Scola Meydanı',w:1280,h:800,spawn:[640,480],
    obstacles:[bld(120,70,200,140,'Sanat Atölyesi','#c5a5e9'),bld(540,60,200,130,'Kültür Müzesi','#efb28e'),bld(960,70,200,140,'Müzik Sahnesi','#a5c9ef'),bld(120,590,200,140,'Oyun Salonu','#9fdcc4'),bld(540,600,200,130,'Pazar','#f2d58a'),
      {x:610,y:370,w:60,h:60,k:'fountain'},{x:380,y:380,w:44,h:56,k:'board',label:'Görevler'},{x:1100,y:340,w:30,h:36,k:'pillar'},{x:1100,y:424,w:30,h:36,k:'pillar'},{x:528,y:468,w:24,h:24,k:'npc'},
      ...[[40,300],[40,480],[1210,200],[1210,600],[460,260],[820,260],[460,540],[820,540],[360,170],[900,190]].map(([x,y])=>tree(x,y))],
    interact:[
      {id:'sanat',x:220,y:240,r:55,emoji:'🎨',label:'Sanat Atölyesi',act:'mission',arg:'art-reading'},
      {id:'kultur',x:640,y:215,r:55,emoji:'🏺',label:'Kültür Müzesi',act:'mission',arg:'culture-story'},
      {id:'muzik',x:1060,y:240,r:55,emoji:'🎵',label:'Müzik Sahnesi',act:'mission',arg:'music-listen'},
      {id:'oyun',x:220,y:565,r:55,emoji:'🎮',label:'Oyun Salonu',act:'mission',arg:'game-idea'},
      {id:'pazar',x:640,y:578,r:55,emoji:'🛍️',label:'Scola Pazar',act:'board',arg:'market'},
      {id:'pano',x:402,y:450,r:50,emoji:'📋',label:'Görev Panosu',act:'board',arg:'missions'},
      {id:'kapi',x:1160,y:400,r:55,emoji:'🧭',label:'Kaşif Kapısı → Gizemli Ada',act:'portal',arg:'ada'},
      {id:'atolye',x:350,y:140,r:50,emoji:'🖌️',label:'Renk Atölyesi (ekip)',act:'portal',arg:'atolye'},
      {id:'ritim',x:930,y:150,r:50,emoji:'🥁',label:'Ritim Sahnesi (ekip)',act:'portal',arg:'ritim'},
      {id:'rehber',x:540,y:490,r:60,emoji:'🤖',label:'Rehber Pusula',act:'npc'}]},
  ada:{key:'ada',title:'Gizemli Ada',w:1280,h:800,spawn:[150,400],plates:[[300,160],[300,640]],gate:{x:620,y:340,w:40,h:120,k:'gate'},
    obstacles:[{x:620,y:0,w:40,h:340,k:'wall'},{x:620,y:460,w:40,h:340,k:'wall'},rock(420,300),rock(420,460),rock(900,300),rock(900,500),rock(1000,200),rock(1000,600),tree(200,120),tree(200,680),tree(700,60),tree(700,720)],
    interact:[back,
      {id:'ip0',x:800,y:150,r:50,emoji:'🎨',label:'Sanat ipucu',act:'clue',arg:0,fact:'Renk çemberinde karşıt renkler (ör. kırmızı ve yeşil) yan yana gelince birbirini daha parlak gösterir.'},
      {id:'ip1',x:1000,y:420,r:50,emoji:'🏺',label:'Kültür ipucu',act:'clue',arg:1,fact:'Nazar boncuğu, Anadolu\'da yüzyıllardır koruyucu olduğuna inanılan bir semboldür.'},
      {id:'ip2',x:800,y:650,r:50,emoji:'🎵',label:'Müzik ipucu',act:'clue',arg:2,fact:'Ritim, sesin zamandaki düzenidir; dört vuruşluk bir kalıba 4/4\'lük ölçü denir.'},
      {id:'sandik',x:1180,y:400,r:55,emoji:'🧰',label:'Keşif Sandığı',act:'chest',arg:null}]},
  atolye:{key:'atolye',title:'Renk Atölyesi',w:1280,h:800,spawn:[140,400],
    pads:[{x:250,y:200,label:'Kırmızı',c:'#e5484d'},{x:250,y:600,label:'Sarı',c:'#f5d90a'},{x:700,y:400,label:'Mavi',c:'#3e63dd'}],
    obstacles:[{x:1070,y:330,w:90,h:140,k:'easel'},{x:480,y:110,w:36,h:36,k:'bucket',c:'#e5484d'},{x:480,y:660,w:36,h:36,k:'bucket',c:'#f5d90a'},{x:900,y:130,w:36,h:36,k:'bucket',c:'#3e63dd'},{x:900,y:630,w:36,h:36,k:'bucket',c:'#a5c9ef'}],
    interact:[back]},
  ritim:{key:'ritim',title:'Ritim Sahnesi',w:1280,h:800,spawn:[140,400],
    pads:[300,500,700,900].map((x,i)=>({x,y:400,label:'Davul '+(i+1),c:['#e5484d','#f5d90a','#30a46c','#3e63dd'][i]})),
    obstacles:[{x:1120,y:260,w:60,h:90,k:'speaker'},{x:1120,y:450,w:60,h:90,k:'speaker'},{x:500,y:130,w:60,h:90,k:'speaker'},{x:700,y:580,w:60,h:90,k:'speaker'}],
    interact:[back]}
};
const padsOf=m=>m.pads||(m.plates?m.plates.map(([x,y],i)=>({x,y,label:'Plaka '+(i+1),c:'#c5a5e9'})):[]);
const serializeMap=m=>({key:m.key,title:m.title,w:m.w,h:m.h,obstacles:m.obstacles,interact:m.interact,plates:m.plates||[],pads:padsOf(m),gate:m.gate||null});
const overlap=(x,y,r)=>x-R<r.x+r.w&&x+R>r.x&&y-R<r.y+r.h&&y+R>r.y;
const blockers=room=>{const m=MAPS[room.key];return room.key==='ada'&&!room.gate?[...m.obstacles,m.gate]:m.obstacles};

// Yol bulma: 20 px'lik ızgarada A*, ardından doğrudan görüş çizgisiyle düzleştirme.
const CELL=20;
function findPath(bl,m,sx,sy,tx,ty){
  const cols=Math.ceil(m.w/CELL),rows=Math.ceil(m.h/CELL);
  const cx=x=>Math.max(0,Math.min(cols-1,Math.floor(x/CELL))),cy=y=>Math.max(0,Math.min(rows-1,Math.floor(y/CELL)));
  const free=(i,j)=>{const x=i*CELL+CELL/2,y=j*CELL+CELL/2;return x>=R&&x<=m.w-R&&y>=R&&y<=m.h-R&&!bl.some(r=>overlap(x,y,r))};
  const clear=(ax,ay,bx,by)=>{const d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d/8);for(let i=1;i<=n;i++){const x=ax+(bx-ax)*i/n,y=ay+(by-ay)*i/n;if(bl.some(r=>overlap(x,y,r)))return false}return true};
  if(clear(sx,sy,tx,ty))return [{x:tx,y:ty}];
  let gi=cx(tx),gj=cy(ty);
  if(!free(gi,gj)){let best=null,bd=1e9;for(let r=1;r<=10&&!best;r++)for(let i=gi-r;i<=gi+r;i++)for(let j=gj-r;j<=gj+r;j++){if(i<0||j<0||i>=cols||j>=rows||!free(i,j))continue;const d=Math.hypot(i-gi,j-gj);if(d<bd){bd=d;best=[i,j]}}if(!best)return [];[gi,gj]=best;tx=gi*CELL+CELL/2;ty=gj*CELL+CELL/2}
  const si=cx(sx),sj=cy(sy),key=(i,j)=>j*cols+i,g=new Map([[key(si,sj),0]]),from=new Map(),open=[[0,si,sj]],closed=new Set();
  const push=n=>{open.push(n);let i=open.length-1;while(i>0){const p=(i-1)>>1;if(open[p][0]<=open[i][0])break;[open[p],open[i]]=[open[i],open[p]];i=p}};
  const pop=()=>{const top=open[0],last=open.pop();if(open.length){open[0]=last;let i=0;for(;;){let l=2*i+1,r=l+1,s=i;if(l<open.length&&open[l][0]<open[s][0])s=l;if(r<open.length&&open[r][0]<open[s][0])s=r;if(s===i)break;[open[s],open[i]]=[open[i],open[s]];i=s}}return top};
  let found=false;
  while(open.length){
    const [,i,j]=pop(),k=key(i,j);if(closed.has(k))continue;closed.add(k);if(i===gi&&j===gj){found=true;break}
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=cols||nj>=rows||!free(ni,nj))continue;
      if(di&&dj&&(!free(i+di,j)||!free(i,j+dj)))continue; // köşeden sıyırma
      const nk=key(ni,nj),ng=g.get(k)+(di&&dj?1.414:1);if(ng<(g.get(nk)??1e9)){g.set(nk,ng);from.set(nk,k);push([ng+Math.hypot(ni-gi,nj-gj),ni,nj])}
    }
  }
  if(!found)return [];
  const cells=[];for(let k=key(gi,gj);k!==undefined;k=from.get(k))cells.unshift({x:(k%cols)*CELL+CELL/2,y:Math.floor(k/cols)*CELL+CELL/2});
  const pts=[{x:sx,y:sy},...cells.slice(1,-1),{x:tx,y:ty}],out=[];let a=0;
  while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!clear(pts[a].x,pts[a].y,pts[b].x,pts[b].y))b--;out.push(pts[b]);a=b}
  return out;
}

// Renk Atölyesi: hedef renk, hangi pedlerin (tam olarak) basılı olması gerektiği
const COLOR_ROUNDS=[{name:'Turuncu',need:[0,1],css:'#f08a24'},{name:'Yeşil',need:[1,2],css:'#30a46c'},{name:'Mor',need:[0,2],css:'#8e4ec6'}];
const MIX_NAMES={'0,1':'Kırmızı + Sarı = Turuncu','1,2':'Sarı + Mavi = Yeşil','0,2':'Kırmızı + Mavi = Mor'};
// Ritim Sahnesi: davul sıraları; art arda vuruşlar farklı kişilerden olmalı
const RHYTHM_ROUNDS=[[0,2,1],[1,3,0,2],[2,0,3,1,2]];

export function createHub({db,now=()=>Date.now(),autoTick=true}={}){
  const players=new Map();
  const rooms=Object.fromEntries(Object.keys(MAPS).map(k=>[k,mkRoom(k)]));
  let snapAcc=0,beatAcc=0,dirty=false,timer=null;
  function mkRoom(key){return {key,players:new Set(),pads:padsOf(MAPS[key]).map(()=>false),gate:false,plateT:0,clues:[false,false,false],done:false,resetAt:0,lastState:'',round:0,hold:0,roundAt:0,pos:0,lastHitter:null,lastHitAt:0,missAt:0}}
  const stateOf=room=>{
    const b={kind:room.key,done:room.done,pads:room.pads};
    if(room.key==='ada')return {...b,gate:room.gate,plates:room.pads,clues:room.clues};
    if(room.key==='atolye'){const r=COLOR_ROUNDS[Math.min(room.round,2)];return {...b,round:room.round,rounds:3,target:r.name,css:r.css,hint:!room.done&&now()-room.roundAt>25000?MIX_NAMES[r.need.join(',')]:null,hold:Math.min(1,room.hold/1.5)}}
    if(room.key==='ritim')return {...b,round:room.round,rounds:3,seq:RHYTHM_ROUNDS[Math.min(room.round,2)],pos:room.pos};
    return b;
  };
  const send=(p,event,data)=>{try{p.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)}catch{leave(p.tok)}};
  const toRoom=(room,event,data,except=null)=>{for(const p of [...room.players])if(p!==except)send(p,event,data)};
  const profile=p=>({id:p.id,n:p.name,c:p.avatar.c,e:p.avatar.e,st:p.stamps,g:!p.userId});
  const posOf=p=>[p.id,Math.round(p.x),Math.round(p.y),p.f,p.mv?1:0,Math.round(p.h*100)/100];
  const broadcastState=(room,force=false)=>{const st=stateOf(room),s=JSON.stringify(st);if(force||s!==room.lastState){room.lastState=s;toRoom(room,'state',st)}};
  const counts=()=>({...Object.fromEntries(Object.keys(rooms).map(k=>[k,rooms[k].players.size])),total:players.size});

  function grantStamp(p,sid){
    if(p.stamps.includes(sid))return false;p.stamps.push(sid);
    if(p.userId&&db)db.tx(d=>{const u=d.users.find(u=>u.id===p.userId);if(u)u.stamps=[...new Set([...(u.stamps||[]),sid])]});
    send(p,'stamp',{id:sid,...STAMPS[sid]});if(p.room)toRoom(rooms[p.room],'prof',profile(p));return true;
  }
  function enter(p,key){
    const room=rooms[key],m=MAPS[key];
    if(p.room){const old=rooms[p.room];old.players.delete(p);toRoom(old,'leave',{id:p.id})}
    p.room=key;p.x=m.spawn[0]+(Math.random()*40-20);p.y=m.spawn[1]+(Math.random()*40-20);p.dx=p.dy=0;p.target=null;p.path=[];p.mv=false;p.f=1;p.h=0;p.pad=-1;
    room.players.add(p);if(room.players.size===1&&key!=='meydan')resetRoom(room);
    send(p,'init',{id:p.id,tok:p.tok,map:serializeMap(m),state:stateOf(room),stamps:STAMPS,clock:now(),
      players:[...room.players].map(q=>({...profile(q),pos:posOf(q)}))});
    toRoom(room,'join',{...profile(p),pos:posOf(p)},p);
  }
  function join({userId=null,name=null,stamps=[],avatar={},room='meydan'},res){
    if(!rooms[room])room='meydan';
    if(players.size>=TOTAL_CAP||rooms[room].players.size>=ROOM_CAP[room])return {error:'full'};
    if(userId){const old=[...players.values()].find(q=>q.userId===userId);if(old){send(old,'kicked',{reason:'another-tab'});leave(old.tok)}}
    const c=Number.isInteger(avatar.c)&&avatar.c>=0&&avatar.c<COLORS?avatar.c:Math.floor(Math.random()*COLORS),e=Number.isInteger(avatar.e)&&avatar.e>=0&&avatar.e<FACES?avatar.e:Math.floor(Math.random()*FACES);
    const p={tok:rid(),id:rid().slice(0,8),userId,name:name||`${pick(ADJ)} ${pick(ANI)} ${100+Math.floor(Math.random()*900)}`,avatar:{c,e},stamps:[...stamps].filter(s=>STAMPS[s]),res,room:null,x:0,y:0,h:0,pad:-1,dx:0,dy:0,target:null,mv:false,f:1,lastSay:0,lastAct:now(),bucket:40,bucketAt:now(),lastReport:0,met:new Set()};
    players.set(p.tok,p);enter(p,room);grantStamp(p,'ilk-adim');
    return {tok:p.tok,id:p.id};
  }
  function leave(tok){
    const p=players.get(tok);if(!p)return;players.delete(tok);
    const room=rooms[p.room];room.players.delete(p);toRoom(room,'leave',{id:p.id});
    try{p.res.end()}catch{}
    if(!room.players.size)resetRoom(room);
  }
  function allow(p){const t=now();p.bucket=Math.min(40,p.bucket+(t-p.bucketAt)/1000*40);p.bucketAt=t;if(p.bucket<1)return false;p.bucket--;p.lastAct=t;return true}
  const get=tok=>{const p=players.get(tok);return p&&allow(p)?p:null};

  function input(tok,{dx,dy,tx,ty}={}){
    const p=get(tok);if(!p)return false;const m=MAPS[p.room];
    if(Number.isFinite(tx)&&Number.isFinite(ty)){const gx=Math.max(R,Math.min(m.w-R,tx)),gy=Math.max(R,Math.min(m.h-R,ty));p.path=findPath(blockers(rooms[p.room]),m,p.x,p.y,gx,gy);p.target=p.path.at(-1)||null;p.dx=p.dy=0;return true}
    dx=Number(dx)||0;dy=Number(dy)||0;const l=Math.hypot(dx,dy);
    if(l>0){p.dx=dx/Math.max(1,l);p.dy=dy/Math.max(1,l);p.target=null;p.path=[]}else p.dx=p.dy=0;
    return true;
  }
  function say(tok,kind,i){
    const p=get(tok);if(!p)return {ok:false};const t=now();if(t-p.lastSay<1200)return {ok:false,msg:'Biraz yavaş!'};
    const list=kind==='e'?EMOTES:kind==='p'?PHRASES:null;if(!list||!Number.isInteger(i)||i<0||i>=list.length)return {ok:false};
    p.lastSay=t;const room=rooms[p.room];toRoom(room,'say',{id:p.id,k:kind,i});
    // Tanışma: selamlaşma, yakındaki farklı oyuncularla "tanışma" sayılır
    if((kind==='p'&&i===0)||(kind==='e'&&i===5)){
      for(const q of room.players){
        if(q===p||p.met.has(q.id)||Math.hypot(q.x-p.x,q.y-p.y)>MEET_DIST)continue;
        p.met.add(q.id);send(p,'toast',{msg:`${q.name} ile tanıştın (${Math.min(p.met.size,3)}/3)`});
        if(p.met.size>=3)grantStamp(p,'sosyal');
      }
    }
    return {ok:true};
  }
  function report(tok,targetId,reason){
    const p=get(tok);if(!p)return {ok:false};const target=[...rooms[p.room].players].find(q=>q.id===targetId);
    if(!target||target===p||!Number.isInteger(reason)||reason<0||reason>=REPORT_REASONS.length)return {ok:false};
    if(now()-p.lastReport<10000)return {ok:false,msg:'Bildirimi biraz sonra tekrar gönder.'};p.lastReport=now();
    if(db)db.tx(d=>{d.hubReports=d.hubReports||[];d.hubReports.push({at:new Date().toISOString(),room:p.room,reporter:p.userId||'misafir:'+p.name,target:target.userId||'misafir:'+target.name,targetName:target.name,reason:REPORT_REASONS[reason]});d.hubReports=d.hubReports.slice(-500)});
    return {ok:true};
  }
  function npcText(p){
    const n=Math.min(p.met.size,3),has=s=>p.stamps.includes(s);
    if(!has('sosyal'))return `Merhaba kaşif, ben Pusula! Yanındaki birine "Merhaba!" de (hızlı sohbet ya da 👋). 3 farklı kişiyle tanışırsan Sosyal Kelebek damgası senin. Şu an: ${n}/3.`;
    if(!has('ada-kasifi'))return 'Harika, tanışmayı biliyorsun! Şimdi bir arkadaşınla Kaşif Kapısı\'ndan Gizemli Ada\'ya git. Kapıyı iki kişi birlikte açar.';
    if(!has('renk-ustasi'))return 'Sanat Atölyesi\'nin yanındaki Renk Atölyesi\'ne uğra. Pedlere arkadaşlarınla basıp renkleri karıştırın. Hangi iki renk turuncu yapar?';
    if(!has('ritim-ustasi'))return 'Müzik Sahnesi\'nin yanındaki Ritim Sahnesi\'nde davullar sırayla çalınmalı, ama aynı kişi art arda çalamaz. Ekip işi!';
    return 'Bütün damgaları topladın, tebrikler! Yeni gelenlere yol göstermeye ne dersin? Binalardaki gerçek görevleri de dene.';
  }
  function interact(tok,iid){
    const p=get(tok);if(!p)return {ok:false};const room=rooms[p.room],m=MAPS[p.room],it=m.interact.find(i=>i.id===iid);
    if(!it||Math.hypot(p.x-it.x,p.y-it.y)>it.r+30)return {ok:false,msg:'Biraz daha yaklaş.'};
    if(it.act==='mission'||it.act==='board')return {ok:true,act:it.act,arg:it.arg};
    if(it.act==='npc')return {ok:true,act:'npc',name:'Pusula',text:npcText(p)};
    if(it.act==='portal'){
      if(rooms[it.arg].players.size>=ROOM_CAP[it.arg])return {ok:false,msg:'Bu alan şu an dolu.'};
      enter(p,it.arg);return {ok:true,act:'portal'};
    }
    if(it.act==='clue'){
      if(!room.gate)return {ok:false,msg:'Önce kapıyı birlikte açın.'};
      if(room.clues[it.arg])return {ok:true,act:'clue',fact:it.fact,again:true};
      room.clues[it.arg]=true;broadcastState(room);toRoom(room,'toast',{msg:`${p.name} bir ipucu buldu (${room.clues.filter(Boolean).length}/3)`});
      return {ok:true,act:'clue',fact:it.fact};
    }
    if(it.act==='chest'){
      if(room.done)return {ok:true,act:'chest',msg:'Sandık zaten açıldı!'};
      const n=room.clues.filter(Boolean).length;if(n<3)return {ok:false,msg:`Sandık kilitli. İpuçları: ${n}/3`};
      finish(room,'ada-kasifi','Sandık açıldı!');return {ok:true,act:'chest'};
    }
    return {ok:false};
  }
  function finish(room,stamp,title){
    room.done=true;room.resetAt=now()+15000;const crew=[...room.players];crew.forEach(q=>grantStamp(q,stamp));
    toRoom(room,'win',{crew:crew.map(q=>q.name),resetIn:15,stamp,title});broadcastState(room,true);
  }
  function resetRoom(room){
    room.gate=false;room.pads=room.pads.map(()=>false);room.plateT=0;room.clues=[false,false,false];room.done=false;room.resetAt=0;room.round=0;room.hold=0;room.roundAt=now();room.pos=0;room.lastHitter=null;
    if(room.key!=='meydan'){const m=MAPS[room.key];for(const p of room.players){if(room.key!=='ada'||p.x>600){p.x=m.spawn[0];p.y=m.spawn[1];p.dx=p.dy=0;p.target=null;p.path=[]}}}
    broadcastState(room,true);
  }
  const padHit=(p,pads,r)=>{let best=-1,bd=r;pads.forEach((pd,i)=>{const d=Math.hypot(p.x-pd.x,p.y-pd.y);if(d<bd){bd=d;best=i}});return best};

  function stepRoomLogic(room,dt,t){
    const m=MAPS[room.key],pads=padsOf(m);
    if(room.key==='ada'){
      room.pads=m.plates.map(([px,py])=>[...room.players].some(p=>Math.hypot(p.x-px,p.y-py)<32));
      if(!room.gate&&!room.done){room.plateT=room.pads[0]&&room.pads[1]?room.plateT+dt:0;if(room.plateT>=1.5){room.gate=true;toRoom(room,'toast',{msg:'Kapı açıldı! Birlikte çalıştınız 🎉'})}}
    }
    if(room.key==='atolye'&&!room.done){
      room.pads=pads.map(pd=>[...room.players].some(p=>Math.hypot(p.x-pd.x,p.y-pd.y)<34));
      const on=room.pads.map((b,i)=>b?i:-1).filter(i=>i>=0),need=COLOR_ROUNDS[room.round].need,key=on.join(',');
      if(on.length>=2){
        room.hold+=dt;
        if(room.hold>=1.5){
          if(key===need.join(',')){toRoom(room,'toast',{msg:`${COLOR_ROUNDS[room.round].name} karıştırdınız! 🎨 (${room.round+1}/3)`});room.round++;room.hold=0;room.roundAt=t;if(room.round>=3)finish(room,'renk-ustasi','Renk Ustası!')}
          else if(t-room.missAt>2500){room.missAt=t;room.hold=0;toRoom(room,'toast',{msg:`${MIX_NAMES[key]||'Bu karışım'}: hedef ${COLOR_ROUNDS[room.round].name} değil, tekrar dene.`})}
        }
      }else room.hold=0;
    }
    if(room.key==='ritim'&&!room.done){
      room.pads=pads.map(pd=>[...room.players].some(p=>Math.hypot(p.x-pd.x,p.y-pd.y)<38));
      for(const p of room.players){
        if(room.done)break;
        const i=padHit(p,pads,38);
        if(i>=0&&p.pad!==i){
          const seq=RHYTHM_ROUNDS[room.round];
          if(i===seq[room.pos]&&(room.pos===0||(room.lastHitter!==p&&t-room.lastHitAt<6000))){
            room.pos++;room.lastHitter=p;room.lastHitAt=t;toRoom(room,'hit',{pad:i,ok:true,pos:room.pos});
            if(room.pos>=seq.length){room.pos=0;room.lastHitter=null;room.round++;if(room.round>=3)finish(room,'ritim-ustasi','Ritim Ustası!');else toRoom(room,'toast',{msg:`Ritim tamam! Sıradaki kalıp (${room.round+1}/3)`})}
          }else{
            const same=room.pos>0&&room.lastHitter===p&&i===seq[room.pos];
            room.pos=0;room.lastHitter=null;toRoom(room,'hit',{pad:i,ok:false,pos:0});
            if(t-room.missAt>1500){room.missAt=t;toRoom(room,'toast',{msg:same?'Aynı kişi art arda çalamaz! Sırayı değiştirin.':'Sıra bozuldu, baştan başlayın.'})}
          }
        }
        p.pad=i;
      }
    }
    if(room.done&&t>=room.resetAt)resetRoom(room);
    if(room.key!=='meydan')broadcastState(room);
  }
  function step(dt){
    const t=now();let moved=false;
    for(const room of Object.values(rooms)){
      const m=MAPS[room.key],bl=blockers(room);
      for(const p of room.players){
        let vx=0,vy=0;
        if(p.dx||p.dy){vx=p.dx*SPEED;vy=p.dy*SPEED}
        else if(p.path?.length){const wp=p.path[0],ex=wp.x-p.x,ey=wp.y-p.y,d=Math.hypot(ex,ey);if(d<4){p.path.shift();if(!p.path.length)p.target=null}else{const s=Math.min(SPEED,d/dt);vx=ex/d*s;vy=ey/d*s}}
        const ox=p.x,oy=p.y;
        if(vx){const nx=Math.max(R,Math.min(m.w-R,p.x+vx*dt));if(!bl.some(r=>overlap(nx,p.y,r)))p.x=nx}
        if(vy){const ny=Math.max(R,Math.min(m.h-R,p.y+vy*dt));if(!bl.some(r=>overlap(p.x,ny,r)))p.y=ny}
        const mv=p.x!==ox||p.y!==oy;if(!mv&&(vx||vy)&&p.path?.length){p.path=[];p.target=null}
        if(mv){p.f=vx<0?0:vx>0?1:p.f;if(vx||vy)p.h=Math.atan2(vx,vy);moved=true}
        if(mv!==p.mv){p.mv=mv;moved=true}
        if(t-p.lastAct>AFK_MS){send(p,'kicked',{reason:'afk'});leave(p.tok)}
      }
      if(room.key!=='meydan')stepRoomLogic(room,dt,t);
    }
    dirty=dirty||moved;snapAcc+=dt;beatAcc+=dt;
    if(snapAcc>=0.1){snapAcc=0;for(const room of Object.values(rooms)){if(room.players.size&&(dirty||beatAcc>=1))toRoom(room,'snap',[...room.players].map(posOf))}dirty=false}
    if(beatAcc>=1)beatAcc=0;
    if(beatAcc===0&&players.size)for(const p of players.values()){try{p.res.write(': ping\n\n')}catch{leave(p.tok)}}
  }
  if(autoTick){timer=setInterval(()=>step(0.05),50);timer.unref?.()}
  return {join,leave,input,say,interact,report,step,counts,close:()=>{clearInterval(timer);for(const tok of [...players.keys()])leave(tok)},
    info:()=>({phrases:PHRASES,emotes:EMOTES,reportReasons:REPORT_REASONS,stamps:STAMPS,online:counts()}),_players:players,_rooms:rooms};
}
