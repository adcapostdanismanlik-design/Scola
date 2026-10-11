// Scola Meydanı: gerçek zamanlı çok oyunculu hub (Server-Sent Events + POST).
// Sunucu otoriterdir: konum, çarpışma, kapı ve damga kararları burada verilir; istemci yalnız niyet gönderir.
// Güvenlik: serbest metin sohbet YOKTUR (yalnız hazır cümle / emoji), özel mesaj YOKTUR.
import {randomBytes} from 'node:crypto';

export const PHRASES=['Merhaba! 👋','Birlikte keşfe çıkalım mı?','Bana yardım eder misin?','Teşekkürler!','Harika iş!','Beni takip et','Burada bekle','Hadi Ada\'ya gidelim!','Hangi görevi yapıyorsun?','Çok güzel bir yer!','Hazırım!','Bir dakika bekle'];
export const EMOTES=['😀','👏','❤️','🎉','🤔','👋','😮','💡'];
export const REPORT_REASONS=['Rahatsız edici davranış','Uygunsuz isim','Başkasını taklit ediyor','Diğer'];
export const STAMPS={'ilk-adim':{label:'İlk Adım',icon:'👣'},'ada-kasifi':{label:'Ada Kaşifi',icon:'🧭'}};
const COLORS=8,FACES=10,R=12,SPEED=150,ROOM_CAP={meydan:60,ada:20},TOTAL_CAP=120,AFK_MS=180000;
const ADJ=['Meraklı','Neşeli','Cesur','Yaratıcı','Sakin','Çevik','Gizemli','Parlak'],ANI=['Kaşif','Kedi','Tilki','Baykuş','Panda','Yunus','Kartal','Ahtapot'];
const rid=()=>randomBytes(9).toString('base64url');
const pick=a=>a[Math.floor(Math.random()*a.length)];

const bld=(x,y,w,h,label,color)=>({x,y,w,h,k:'building',label,color});
const tree=(x,y)=>({x,y,w:36,h:36,k:'tree'});
const rock=(x,y)=>({x,y,w:40,h:40,k:'rock'});
export const MAPS={
  meydan:{key:'meydan',title:'Scola Meydanı',w:1280,h:800,spawn:[640,480],
    obstacles:[bld(120,70,200,140,'Sanat Atölyesi','#c5a5e9'),bld(540,60,200,130,'Kültür Müzesi','#efb28e'),bld(960,70,200,140,'Müzik Sahnesi','#a5c9ef'),bld(120,590,200,140,'Oyun Salonu','#9fdcc4'),bld(540,600,200,130,'Pazar','#f2d58a'),
      {x:610,y:370,w:60,h:60,k:'fountain'},{x:380,y:380,w:44,h:56,k:'board',label:'Görevler'},{x:1100,y:340,w:30,h:36,k:'pillar'},{x:1100,y:424,w:30,h:36,k:'pillar'},
      ...[[40,300],[40,480],[1210,200],[1210,600],[460,260],[820,260],[460,540],[820,540],[360,170],[900,190]].map(([x,y])=>tree(x,y))],
    interact:[
      {id:'sanat',x:220,y:240,r:55,emoji:'🎨',label:'Sanat Atölyesi',act:'mission',arg:'art-reading'},
      {id:'kultur',x:640,y:215,r:55,emoji:'🏺',label:'Kültür Müzesi',act:'mission',arg:'culture-story'},
      {id:'muzik',x:1060,y:240,r:55,emoji:'🎵',label:'Müzik Sahnesi',act:'mission',arg:'music-listen'},
      {id:'oyun',x:220,y:565,r:55,emoji:'🎮',label:'Oyun Salonu',act:'mission',arg:'game-idea'},
      {id:'pazar',x:640,y:578,r:55,emoji:'🛍️',label:'Pazar',act:'mission',arg:'trade-pitch'},
      {id:'pano',x:402,y:450,r:50,emoji:'📋',label:'Görev Panosu',act:'board',arg:'missions'},
      {id:'kapi',x:1160,y:400,r:55,emoji:'🧭',label:'Kaşif Kapısı → Gizemli Ada',act:'portal',arg:'ada'}]},
  ada:{key:'ada',title:'Gizemli Ada',w:1280,h:800,spawn:[150,400],plates:[[300,160],[300,640]],gate:{x:620,y:340,w:40,h:120,k:'gate'},
    obstacles:[{x:620,y:0,w:40,h:340,k:'wall'},{x:620,y:460,w:40,h:340,k:'wall'},rock(420,300),rock(420,460),rock(900,300),rock(900,500),rock(1000,200),rock(1000,600),tree(200,120),tree(200,680),tree(700,60),tree(700,720)],
    interact:[
      {id:'don',x:50,y:400,r:50,emoji:'🏙️',label:'Meydan\'a dön',act:'portal',arg:'meydan'},
      {id:'ip0',x:800,y:150,r:50,emoji:'🎨',label:'Sanat ipucu',act:'clue',arg:0,fact:'Renk çemberinde karşıt renkler (ör. kırmızı ve yeşil) yan yana gelince birbirini daha parlak gösterir.'},
      {id:'ip1',x:1000,y:420,r:50,emoji:'🏺',label:'Kültür ipucu',act:'clue',arg:1,fact:'Nazar boncuğu, Anadolu\'da yüzyıllardır koruyucu olduğuna inanılan bir semboldür.'},
      {id:'ip2',x:800,y:650,r:50,emoji:'🎵',label:'Müzik ipucu',act:'clue',arg:2,fact:'Ritim, sesin zamandaki düzenidir; dört vuruşluk bir kalıba 4/4\'lük ölçü denir.'},
      {id:'sandik',x:1180,y:400,r:55,emoji:'🧰',label:'Keşif Sandığı',act:'chest',arg:null}]}
};
const serializeMap=m=>({key:m.key,title:m.title,w:m.w,h:m.h,obstacles:m.obstacles,interact:m.interact,plates:m.plates||[],gate:m.gate||null});
const hit=(x,y,r)=>x-R<r.x+r.w&&x+R>r.x&&y-R<r.y+r.h&&y+R>r.y;
const blockers=room=>{const m=MAPS[room.key];return room.key==='ada'&&!room.gate?[...m.obstacles,m.gate]:m.obstacles};
const roomState=room=>({gate:room.gate,plates:room.plates,clues:room.clues,done:room.done});

export function createHub({db,now=()=>Date.now(),autoTick=true}={}){
  const players=new Map(); // tok -> player
  const rooms={meydan:mkRoom('meydan'),ada:mkRoom('ada')};
  const reports=()=>db?.data.hubReports;
  let snapAcc=0,beatAcc=0,dirty=false,timer=null;
  function mkRoom(key){return {key,players:new Set(),gate:false,plates:[false,false],plateT:0,clues:[false,false,false],done:false,resetAt:0,lastState:''}}
  const send=(p,event,data)=>{try{p.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)}catch{leave(p.tok)}};
  const toRoom=(room,event,data,except=null)=>{for(const p of [...room.players])if(p!==except)send(p,event,data)};
  const profile=p=>({id:p.id,n:p.name,c:p.avatar.c,e:p.avatar.e,st:p.stamps,g:!p.userId});
  const posOf=p=>[p.id,Math.round(p.x),Math.round(p.y),p.f,p.mv?1:0];
  const broadcastState=(room,force=false)=>{const s=JSON.stringify(roomState(room));if(force||s!==room.lastState){room.lastState=s;toRoom(room,'state',roomState(room))}};
  const counts=()=>({meydan:rooms.meydan.players.size,ada:rooms.ada.players.size,total:players.size});

  function grantStamp(p,sid){
    if(p.stamps.includes(sid))return false;p.stamps.push(sid);
    if(p.userId&&db)db.tx(d=>{const u=d.users.find(u=>u.id===p.userId);if(u)u.stamps=[...new Set([...(u.stamps||[]),sid])]});
    send(p,'stamp',{id:sid,...STAMPS[sid]});toRoom(rooms[p.room],'prof',profile(p));return true;
  }

  function enter(p,key){
    const room=rooms[key],m=MAPS[key];
    if(p.room){const old=rooms[p.room];old.players.delete(p);toRoom(old,'leave',{id:p.id})}
    p.room=key;p.x=m.spawn[0]+(Math.random()*40-20);p.y=m.spawn[1]+(Math.random()*40-20);p.dx=p.dy=0;p.target=null;p.mv=false;p.f=1;
    room.players.add(p);
    send(p,'init',{id:p.id,tok:p.tok,map:serializeMap(m),state:roomState(room),stamps:STAMPS,
      players:[...room.players].map(q=>({...profile(q),pos:posOf(q)}))});
    toRoom(room,'join',{...profile(p),pos:posOf(p)},p);
  }

  function join({userId=null,name=null,stamps=[],avatar={},room='meydan'},res){
    if(!rooms[room])room='meydan';
    if(players.size>=TOTAL_CAP||rooms[room].players.size>=ROOM_CAP[room])return {error:'full'};
    if(userId){const old=[...players.values()].find(q=>q.userId===userId);if(old){send(old,'kicked',{reason:'another-tab'});leave(old.tok)}}
    const c=Number.isInteger(avatar.c)&&avatar.c>=0&&avatar.c<COLORS?avatar.c:Math.floor(Math.random()*COLORS),e=Number.isInteger(avatar.e)&&avatar.e>=0&&avatar.e<FACES?avatar.e:Math.floor(Math.random()*FACES);
    const p={tok:rid(),id:rid().slice(0,8),userId,name:name||`${pick(ADJ)} ${pick(ANI)} ${100+Math.floor(Math.random()*900)}`,avatar:{c,e},stamps:[...stamps].filter(s=>STAMPS[s]),res,room:null,x:0,y:0,dx:0,dy:0,target:null,mv:false,f:1,lastSay:0,lastAct:now(),bucket:40,bucketAt:now(),lastReport:0};
    players.set(p.tok,p);enter(p,room);grantStamp(p,'ilk-adim');
    return {tok:p.tok,id:p.id};
  }
  function leave(tok){
    const p=players.get(tok);if(!p)return;players.delete(tok);
    const room=rooms[p.room];room.players.delete(p);toRoom(room,'leave',{id:p.id});
    try{p.res.end()}catch{}
    if(!room.players.size)resetRoom(room);
  }
  // Basit jeton kovası: oyuncu başına saniyede en fazla ~40 istek.
  function allow(p){const t=now();p.bucket=Math.min(40,p.bucket+(t-p.bucketAt)/1000*40);p.bucketAt=t;if(p.bucket<1)return false;p.bucket--;p.lastAct=t;return true}
  const get=tok=>{const p=players.get(tok);return p&&allow(p)?p:null};

  function input(tok,{dx,dy,tx,ty}={}){
    const p=get(tok);if(!p)return false;const m=MAPS[p.room];
    if(Number.isFinite(tx)&&Number.isFinite(ty)){p.target={x:Math.max(R,Math.min(m.w-R,tx)),y:Math.max(R,Math.min(m.h-R,ty))};p.dx=p.dy=0;return true}
    dx=Number(dx)||0;dy=Number(dy)||0;const l=Math.hypot(dx,dy);
    if(l>0){p.dx=dx/Math.max(1,l);p.dy=dy/Math.max(1,l);p.target=null}else p.dx=p.dy=0;
    return true;
  }
  function say(tok,kind,i){
    const p=get(tok);if(!p)return {ok:false};const t=now();if(t-p.lastSay<1200)return {ok:false,msg:'Biraz yavaş!'};
    const list=kind==='e'?EMOTES:kind==='p'?PHRASES:null;if(!list||!Number.isInteger(i)||i<0||i>=list.length)return {ok:false};
    p.lastSay=t;toRoom(rooms[p.room],'say',{id:p.id,k:kind,i});return {ok:true};
  }
  function report(tok,targetId,reason){
    const p=get(tok);if(!p)return {ok:false};const target=[...rooms[p.room].players].find(q=>q.id===targetId);
    if(!target||target===p||!Number.isInteger(reason)||reason<0||reason>=REPORT_REASONS.length)return {ok:false};
    if(now()-p.lastReport<10000)return {ok:false,msg:'Bildirimi biraz sonra tekrar gönder.'};p.lastReport=now();
    if(db)db.tx(d=>{d.hubReports=d.hubReports||[];d.hubReports.push({at:new Date().toISOString(),room:p.room,reporter:p.userId||'misafir:'+p.name,target:target.userId||'misafir:'+target.name,targetName:target.name,reason:REPORT_REASONS[reason]});d.hubReports=d.hubReports.slice(-500)});
    return {ok:true};
  }
  function interact(tok,iid){
    const p=get(tok);if(!p)return {ok:false};const room=rooms[p.room],m=MAPS[p.room],it=m.interact.find(i=>i.id===iid);
    if(!it||Math.hypot(p.x-it.x,p.y-it.y)>it.r+30)return {ok:false,msg:'Biraz daha yaklaş.'};
    if(it.act==='mission'||it.act==='board')return {ok:true,act:it.act,arg:it.arg};
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
      room.done=true;room.resetAt=now()+15000;const crew=[...room.players];crew.forEach(q=>grantStamp(q,'ada-kasifi'));
      toRoom(room,'win',{crew:crew.map(q=>q.name),resetIn:15});broadcastState(room,true);
      return {ok:true,act:'chest'};
    }
    return {ok:false};
  }
  function resetRoom(room){
    room.gate=false;room.plates=[false,false];room.plateT=0;room.clues=[false,false,false];room.done=false;room.resetAt=0;
    if(room.key==='ada'){const m=MAPS.ada;for(const p of room.players){if(p.x>600){p.x=m.spawn[0];p.y=m.spawn[1];p.dx=p.dy=0;p.target=null}}}
    broadcastState(room);
  }

  function step(dt){
    const t=now();let moved=false;
    for(const room of Object.values(rooms)){
      const m=MAPS[room.key],bl=blockers(room);
      for(const p of room.players){
        let vx=0,vy=0;
        if(p.dx||p.dy){vx=p.dx*SPEED;vy=p.dy*SPEED}
        else if(p.target){const ex=p.target.x-p.x,ey=p.target.y-p.y,d=Math.hypot(ex,ey);if(d<4)p.target=null;else{const s=Math.min(SPEED,d/dt);vx=ex/d*s;vy=ey/d*s}}
        const ox=p.x,oy=p.y;
        if(vx){const nx=Math.max(R,Math.min(m.w-R,p.x+vx*dt));if(!bl.some(r=>hit(nx,p.y,r)))p.x=nx}
        if(vy){const ny=Math.max(R,Math.min(m.h-R,p.y+vy*dt));if(!bl.some(r=>hit(p.x,ny,r)))p.y=ny}
        const mv=p.x!==ox||p.y!==oy;if(p.target&&!mv&&(vx||vy))p.target=null; // engele takıldıysa vazgeç
        if(mv){p.f=vx<0?0:vx>0?1:p.f;moved=true}
        if(mv!==p.mv){p.mv=mv;moved=true}
        if(t-p.lastAct>AFK_MS){send(p,'kicked',{reason:'afk'});leave(p.tok)}
      }
      if(room.key==='ada'){
        const occ=m.plates.map(([px,py])=>[...room.players].some(p=>Math.hypot(p.x-px,p.y-py)<32));
        room.plates=occ;
        if(!room.gate&&!room.done){room.plateT=occ[0]&&occ[1]?room.plateT+dt:0;if(room.plateT>=1.5){room.gate=true;toRoom(room,'toast',{msg:'Kapı açıldı! Birlikte çalıştınız 🎉'})}}
        if(room.done&&t>=room.resetAt)resetRoom(room);
        broadcastState(room);
      }
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
