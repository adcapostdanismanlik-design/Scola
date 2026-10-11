'use strict';
// Scola Meydanı 3B görselleştirici (Three.js, alçak poligon / toon stil).
// Yalnız çizer: konum, kapı, bulmaca ve damga kararlarını sunucu verir. Sunucu 2B (x, y) tutar; burada y → z.
(()=>{
const P=40,TAU=Math.PI*2;                                   // 40 px = 1 birim
const COLORS=['#c5a5e9','#d7eca9','#efb28e','#a5c9ef','#f2d58a','#e9a5c9','#9fdcc4','#c8b8f0'];
const FACES=['😀','😎','🤓','🥳','🦊','🐱','🐼','🦉','🤖','👾'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const EMOJI_FONT='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

async function create(stage,opts={}){
  let T;try{T=await import('./vendor/three.module.min.js')}catch{return null}
  const probe=document.createElement('canvas');if(!(probe.getContext('webgl2')||probe.getContext('webgl')))return null;
  const coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
  const calm=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shadowsOn=!coarse&&(navigator.hardwareConcurrency||4)>=4;
  let renderer;try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch{return null}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.5:2));
  renderer.shadowMap.enabled=shadowsOn;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const cv=renderer.domElement;cv.id='hub3d';cv.setAttribute('role','img');cv.tabIndex=0;
  cv.setAttribute('aria-label','Scola Meydanı 3B oyun alanı. Ok tuşları veya WASD ile yürü, E ile etkileşime gir, fareyle sürükleyerek kamerayı döndür.');
  stage.insertBefore(cv,stage.firstChild);

  const scene=new T.Scene(),camera=new T.PerspectiveCamera(50,1,.1,400);
  const hemi=new T.HemisphereLight('#ffffff','#9bbf85',1.1),sun=new T.DirectionalLight('#fff4d6',2.4);
  sun.castShadow=shadowsOn;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:90});sun.shadow.bias=-.0004;
  scene.add(hemi,sun,sun.target);
  // gökyüzü kubbesi
  const skyU={top:{value:new T.Color('#8fd0ff')},bottom:{value:new T.Color('#e8f6ff')}};
  const sky=new T.Mesh(new T.SphereGeometry(220,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:skyU,vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying float h;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(-.05,.65,h)),1.);}'}));
  scene.add(sky);
  const starsG=new T.BufferGeometry(),sp=[];for(let i=0;i<260;i++){const a=Math.random()*TAU,e=Math.random()*1.3+.1,r=200;sp.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)}
  starsG.setAttribute('position',new T.Float32BufferAttribute(sp,3));const starsM=new T.PointsMaterial({color:'#ffffff',size:1.6,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false});scene.add(new T.Points(starsG,starsM));
  scene.fog=new T.Fog('#cfe8ff',40,150);

  /* ---------- malzeme / doku yardımcıları ---------- */
  const grad=new T.DataTexture(new Uint8Array([110,190,255]),3,1,T.RedFormat);grad.minFilter=grad.magFilter=T.NearestFilter;grad.needsUpdate=true;
  const matCache=new Map(),toon=(c,extra={})=>{const k=c+JSON.stringify(extra);let m=matCache.get(k);if(!m){m=new T.MeshToonMaterial({color:c,gradientMap:grad,...extra});m.userData.shared=true;matCache.set(k,m)}return m};
  const tex=(canvas)=>{const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t};
  const mkCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const rr=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
  const lblCache=new Map();
  function labelTex(text,{bg='#ffffffe6',fg='#40354e',size=30,pad=14,border=null}={}){
    const k=text+bg+fg+size;let e=lblCache.get(k);if(e)return e;
    const c=mkCanvas(8,8),x=c.getContext('2d');x.font=`800 ${size}px Manrope,${EMOJI_FONT}`;const w=Math.ceil(x.measureText(text).width)+pad*2,h=size+pad;c.width=w;c.height=h;
    const g=c.getContext('2d');g.font=`800 ${size}px Manrope,${EMOJI_FONT}`;g.fillStyle=bg;rr(g,0,0,w,h,h/2);g.fill();if(border){g.strokeStyle=border;g.lineWidth=3;g.stroke()}g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+1);
    e={t:tex(c),w,h};lblCache.set(k,e);if(lblCache.size>160){const first=lblCache.keys().next().value;lblCache.get(first).t.dispose();lblCache.delete(first)}return e;
  }
  function labelSprite(text,o={}){const e=labelTex(text,o),s=new T.Sprite(new T.SpriteMaterial({map:e.t,transparent:true,depthTest:!!o.depth}));const u=o.unit||150;s.scale.set(e.w/u,e.h/u,1);s.renderOrder=20;return s}
  const iconCache=new Map();
  function iconTex(emoji,size=128){let t=iconCache.get(emoji);if(!t){const c=mkCanvas(size,size),x=c.getContext('2d');x.font=`${size*.75}px ${EMOJI_FONT}`;x.textAlign='center';x.textBaseline='middle';x.fillText(emoji,size/2,size/2+4);t=tex(c);iconCache.set(emoji,t)}return t}
  const iconSprite=(emoji,s=1,depth=false)=>{const sp=new T.Sprite(new T.SpriteMaterial({map:iconTex(emoji),transparent:true,depthTest:depth}));sp.scale.set(s,s,1);sp.renderOrder=15;return sp};
  const box=(w,h,d,c,x=0,y=0,z=0,cast=true)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),toon(c));m.position.set(x,y,z);m.castShadow=cast&&shadowsOn;m.receiveShadow=shadowsOn;return m};
  const cyl=(rt,rb,h,c,seg=14)=>{const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),toon(c));m.castShadow=shadowsOn;m.receiveShadow=shadowsOn;return m};
  const at=(m,x,y,z)=>{m.position.set(x,y,z);return m};
  const ico=(r,c,x,y,z,d=0)=>{const m=new T.Mesh(new T.IcosahedronGeometry(r,d),toon(c));m.position.set(x,y,z);m.castShadow=shadowsOn;return m};

  /* ---------- sahne durumu ---------- */
  let roofs=[],occluders=[],lastKey='',camDist=12,world=null,anim=[],interacts=[],padMeshes=[],windows=[],hitList=[],mapInfo=null,state=null,gateMesh=null,chestLid=null,easelCtx=null,easelTex=null,ledCtx=null,ledTex=null,fountainDrops=[],clouds=[];
  const avatars=new Map(),particles=[],clockOff={v:0};
  const cam={yaw:0,pitch:.98,dist:coarse?13:12,tx:0,tz:0,ty:1};
  const winMat=new T.MeshBasicMaterial({color:'#b9d4ee'});

  /* ---------- zemin dokuları ---------- */
  function groundTex(key,m){
    const c=mkCanvas(1280,800),x=c.getContext('2d');
    if(key==='meydan'){
      for(let gy=0;gy<800;gy+=64)for(let gx=0;gx<1280;gx+=64){x.fillStyle=((gx+gy)/64)%2?'#cfe6b5':'#c6e0ab';x.fillRect(gx,gy,64,64)}
      x.fillStyle='#eadfc8';x.beginPath();x.arc(640,400,230,0,7);x.fill();x.fillRect(80,372,1120,56);x.fillRect(610,150,60,500);
      for(const i of m.interact){x.beginPath();x.arc(i.x,i.y,26,0,7);x.fill()}
      x.strokeStyle='#d8caae';x.lineWidth=4;x.beginPath();x.arc(640,400,230,0,7);x.stroke();x.beginPath();x.arc(640,400,150,0,7);x.stroke();
    }else if(key==='ada'){
      x.fillStyle='#f3e4b8';x.fillRect(0,0,1280,800);x.fillStyle='#e9d9a8';x.fillRect(660,0,620,800);x.fillStyle='#d9f0a8';rr(x,700,40,540,720,50);x.fill();
      x.fillStyle='#e8d7a6';for(let i=0;i<90;i++){x.beginPath();x.arc(Math.random()*1280,Math.random()*800,2+Math.random()*4,0,7);x.fill()}
    }else if(key==='atolye'){
      for(let i=0;i<20;i++){x.fillStyle=i%2?'#d9b88a':'#cfab7a';x.fillRect(0,i*40,1280,40);x.strokeStyle='#b88e5e';x.lineWidth=2;x.strokeRect(0,i*40,1280,40)}
      const blots=['#e5484d','#f5d90a','#3e63dd','#30a46c','#8e4ec6'];for(let i=0;i<26;i++){x.fillStyle=blots[i%5]+'55';x.beginPath();x.arc(Math.random()*1280,Math.random()*800,6+Math.random()*16,0,7);x.fill()}
    }else{
      x.fillStyle='#2b2140';x.fillRect(0,0,1280,800);x.strokeStyle='#6d55a8';x.lineWidth=3;for(let i=0;i<=1280;i+=80){x.beginPath();x.moveTo(i,0);x.lineTo(i,800);x.stroke()}for(let i=0;i<=800;i+=80){x.beginPath();x.moveTo(0,i);x.lineTo(1280,i);x.stroke()}
      const g=x.createRadialGradient(640,400,40,640,400,520);g.addColorStop(0,'#8a63d255');g.addColorStop(1,'#00000000');x.fillStyle=g;x.fillRect(0,0,1280,800);
    }
    return tex(c);
  }

  /* ---------- nesne kurucuları ---------- */
  function building(o,mapH){
    const g=new T.Group(),w=o.w/P,d=o.h/P,hgt=3.0,cx=(o.x+o.w/2)/P,cz=(o.y+o.h/2)/P,side=cz<mapH/P/2?1:-1;g.position.set(cx,0,cz);
    const bodyM=box(w,hgt,d,o.color,0,hgt/2,0);g.add(bodyM);occluders.push(bodyM);
    const roofC=new T.Color(o.color).multiplyScalar(.72),r=new T.Mesh(new T.ConeGeometry(Math.SQRT1_2,1.5,4),toon('#'+roofC.getHexString()));r.rotation.y=Math.PI/4;r.scale.set(w*1.08,1,d*1.08);r.position.y=hgt+.75;r.castShadow=shadowsOn;g.add(r);occluders.push(r);const foot=box(w,.1,d,o.color,0,.05,0,false);foot.visible=false;g.add(foot);roofs.push({m:r,b:bodyM,f:foot,x0:cx-w/2-3,x1:cx+w/2+3,z0:cz-d/2-3,z1:cz+d/2+3});
    g.add(box(1.3,2.1,.2,'#5a4a6a',0,1.05,side*(d/2+.02)));
    for(let i=0;i<3;i++){const wnd=new T.Mesh(new T.PlaneGeometry(.8,.8),winMat);wnd.position.set((i-1)*(w/3.2),2.3,side*(d/2+.03));if(side<0)wnd.rotation.y=Math.PI;g.add(wnd)}
    const sign=labelSprite(o.label,{bg:'#40354ee6',fg:'#fff',size:34,unit:110,depth:true});sign.position.set(0,hgt+.2,side*(d/2+.4));g.add(sign);
    for(const sx of [-1,1])g.add(box(.18,.18,.5,'#ffffff',sx*(w/2-.1),hgt-.1,side*(d/2+.25),false));
    return g;
  }
  function treeObj(o,palm){
    const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);
    const tr=cyl(.14,.22,palm?2.4:1.3,'#8a6a4a',8);tr.position.y=palm?1.2:.65;if(palm)tr.rotation.z=.12;g.add(tr);
    if(palm){for(let i=0;i<6;i++){const f=new T.Mesh(new T.ConeGeometry(.28,1.9,4),toon('#4fa86a'));f.position.set(Math.cos(i/6*TAU)*.7,2.45,Math.sin(i/6*TAU)*.7);f.rotation.set(Math.sin(i/6*TAU)*1.1,0,-Math.cos(i/6*TAU)*1.1);g.add(f)}g.add(ico(.22,'#8a5a3a',.1,2.35,.1))}
    else{g.add(ico(.85,'#6fb06a',0,1.9,0,0),ico(.55,'#86c47f',.45,2.35,.1,0),ico(.5,'#5da05a',-.4,1.55,.2,0))}
    const ph=(o.x*.13)%TAU;anim.push((t)=>{if(!calm)g.rotation.z=Math.sin(t*.9+ph)*.025});return g;
  }
  function rockObj(o){const m=new T.Mesh(new T.DodecahedronGeometry(.6,0),toon('#a6a0b0'));m.position.set((o.x+o.w/2)/P,.4,(o.y+o.h/2)/P);m.scale.set(1,.8,1);m.rotation.y=o.x;m.castShadow=shadowsOn;m.receiveShadow=shadowsOn;return m}
  function fountainObj(o){
    const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);
    g.add(at(cyl(1.6,1.8,.55,'#cfc6d8',24),0,.28,0));
    const w=new T.Mesh(new T.CylinderGeometry(1.35,1.35,.1,24),new T.MeshBasicMaterial({color:'#8fd0ee',transparent:true,opacity:.9}));w.position.y=.58;g.add(w);
    g.add(at(cyl(.2,.3,1.4,'#cfc6d8',10),0,1,0));
    const dm=new T.MeshBasicMaterial({color:'#dff4ff'});
    for(let i=0;i<28;i++){const d=new T.Mesh(new T.SphereGeometry(.07,6,4),dm);g.add(d);fountainDrops.push({m:d,a:i/28*TAU,ph:i/28})}
    return g;
  }
  function boardObj(o){
    const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);
    g.add(box(.12,1.6,.12,'#8a6a4a',-.45,.8,0),box(.12,1.6,.12,'#8a6a4a',.45,.8,0),box(1.4,.95,.1,'#d9b88a',0,1.5,0));
    for(const [x,y,c] of [[-.35,1.7,'#ffffff'],[.1,1.65,'#d7eca9'],[-.15,1.3,'#c5a5e9'],[.4,1.35,'#ffffff']])g.add(box(.3,.3,.02,c,x,y,.07,false));
    g.rotation.y=-.5;return g;
  }
  function pillarObj(o){const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);g.add(box(o.w/P,2.8,o.h/P,'#cfc6d8',0,1.4,0),box(o.w/P+.2,.3,o.h/P+.2,'#a79bb5',0,2.9,0));return g}
  function wallObj(o){const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);const wm=box(o.w/P,2.2,o.h/P,'#7a6a8c',0,1.1,0);g.add(wm);occluders.push(wm);for(let y=0.4;y<2;y+=.55)g.add(box(o.w/P+.04,.05,o.h/P+.04,'#5f5070',0,y,0,false));return g}
  function bucketObj(o){const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);g.add(at(cyl(.4,.34,.7,'#9a9aa8',12),0,.35,0));const p=new T.Mesh(new T.CylinderGeometry(.34,.34,.06,12),new T.MeshBasicMaterial({color:o.c}));p.position.y=.68;g.add(p);return g}
  function speakerObj(o){const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);g.add(box(o.w/P,2,o.h/P,'#2a2a36',0,1,0));for(const y of [.6,1.4]){const c=new T.Mesh(new T.CylinderGeometry(.3,.3,.08,16),toon('#555566'));c.position.set(-(o.w/P)/2-.02,y,0);c.rotation.z=Math.PI/2;g.add(c)}anim.push((t)=>{if(!calm)g.scale.setScalar(1+Math.sin(t*6+o.x)*.015)});return g}
  function easelObj(o){
    const g=new T.Group();g.position.set((o.x+o.w/2)/P,0,(o.y+o.h/2)/P);g.rotation.y=-Math.PI/2;
    for(const x of [-.9,0,.9])g.add(at(cyl(.06,.06,2.6,'#8a6a4a',6),x,1.3,x===0?-.5:0));
    const c=mkCanvas(512,640);easelCtx=c.getContext('2d');easelTex=tex(c);world.userData.texs.push(easelTex);const b=new T.Mesh(new T.PlaneGeometry(2.6,3.2),new T.MeshBasicMaterial({map:easelTex}));b.position.set(0,2.1,.12);g.add(b);g.add(box(2.8,3.4,.08,'#d9b88a',0,2.1,.05));return g;
  }
  function drawEasel(){
    if(!easelCtx||!state||state.kind!=='atolye')return;const x=easelCtx;x.fillStyle='#fffdf6';x.fillRect(0,0,512,640);
    x.fillStyle='#40354e';x.font='800 34px Manrope,sans-serif';x.textAlign='center';x.fillText('HEDEF RENK',256,60);
    x.fillStyle=state.css;x.beginPath();x.arc(256,190,100,0,7);x.fill();x.strokeStyle='#40354e';x.lineWidth=6;x.stroke();
    x.fillStyle='#40354e';x.font='800 44px Manrope,sans-serif';x.fillText(state.done?'Tamamlandı!':state.target,256,345);
    x.font='600 24px Manrope,sans-serif';x.fillStyle='#7a6a8c';x.fillText(state.hint?state.hint:'Hangi renkler bunu yapar?',256,390);
    const cols=['#f08a24','#30a46c','#8e4ec6'];for(let i=0;i<3;i++){x.fillStyle=state.round>i||state.done?cols[i]:'#e8e2f0';x.beginPath();x.arc(120+i*136,500,48,0,7);x.fill();x.strokeStyle='#40354e';x.lineWidth=4;x.stroke()}
    x.fillStyle='#40354e';x.font='700 24px Manrope,sans-serif';x.fillText(`${Math.min(state.round,3)}/3`,256,600);easelTex.needsUpdate=true;
  }
  function drawLed(){
    if(!ledCtx||!state||state.kind!=='ritim')return;const x=ledCtx;x.fillStyle='#14101f';x.fillRect(0,0,1024,256);x.fillStyle='#b9a8e8';x.font='800 34px Manrope,sans-serif';x.textAlign='center';
    x.fillText(`Kalıp ${Math.min(state.round+1,3)}/3 · art arda FARKLI kişi çalmalı`,512,48);
    const seq=state.seq,step=Math.min(150,900/seq.length);seq.forEach((n,i)=>{const cx=512+(i-(seq.length-1)/2)*step,done=i<state.pos;x.fillStyle=done?'#30a46c':i===state.pos?'#f5d90a':'#3a3150';x.beginPath();x.arc(cx,150,48,0,7);x.fill();x.fillStyle=done||i===state.pos?'#14101f':'#b9a8e8';x.font='800 52px Manrope,sans-serif';x.fillText(String(n+1),cx,168)});
    if(state.done){x.fillStyle='#d7eca9';x.font='800 40px Manrope,sans-serif';x.fillText('Ritim Ustası! 🥁',512,236)}ledTex.needsUpdate=true;
  }
  function robotObj(){
    const g=new T.Group(),body=box(.7,.8,.5,'#b8c4d8',0,.9,0),head=new T.Group();head.position.y=1.65;
    head.add(box(.62,.5,.5,'#dfe6f3',0,0,0));for(const x of [-.14,.14]){const e=new T.Mesh(new T.SphereGeometry(.08,8,6),new T.MeshBasicMaterial({color:'#3b3f5c'}));e.position.set(x,.03,.26);head.add(e)}
    const ant=cyl(.02,.02,.3,'#8a8aa0',4);ant.position.y=.4;head.add(ant);const bulb=new T.Mesh(new T.SphereGeometry(.07,8,6),new T.MeshBasicMaterial({color:'#d7eca9'}));bulb.position.y=.58;head.add(bulb);
    g.add(body,head,box(.18,.5,.18,'#9aa6bc',-.45,.95,0),box(.18,.5,.18,'#9aa6bc',.45,.95,0),box(.22,.3,.22,'#8896ae',-.18,.15,0),box(.22,.3,.22,'#8896ae',.18,.15,0));
    g.userData.head=head;g.userData.bulb=bulb;return g;
  }
  function portalRing(color){
    const g=new T.Group(),ring=new T.Mesh(new T.TorusGeometry(1.1,.1,10,36),new T.MeshBasicMaterial({color})),disc=new T.Mesh(new T.CircleGeometry(1.05,32),new T.MeshBasicMaterial({color,transparent:true,opacity:.28,side:T.DoubleSide}));
    ring.position.y=1.3;disc.position.y=1.3;g.add(ring,disc);g.userData={ring,disc};return g;
  }

  /* ---------- harita kurulumu ---------- */
  function clearWorld(){
    if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!o.material.userData?.shared)o.material.dispose?.()});for(const t of world.userData.texs||[])t.dispose()}
    avatars.clear();world=new T.Group();world.userData.texs=[];scene.add(world);anim=[];occluders=[];roofs=[];interacts=[];padMeshes=[];windows=[];hitList=[];gateMesh=null;chestLid=null;easelCtx=easelTex=ledCtx=ledTex=null;fountainDrops=[];clouds=[];
  }
  function setMap(map,st){
    mapInfo=map;state=st;clearWorld();if(lastKey!==map.key){cam.yaw=0;cam.pitch=.98;camDist=cam.dist;lastKey=map.key}const key=map.key,W=map.w/P,H=map.h/P,indoor=key==='atolye'||key==='ritim';
    scene.fog.near=indoor?30:40;
    // zemin
    const gt=groundTex(key,map);world.userData.texs.push(gt);const ground=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshLambertMaterial({map:gt}));ground.rotation.x=-Math.PI/2;ground.position.set(W/2,0,H/2);ground.receiveShadow=shadowsOn;world.add(ground);
    // çevre
    if(key==='meydan'){
      const out=new T.Mesh(new T.PlaneGeometry(260,260),new T.MeshLambertMaterial({color:'#9ccf8f'}));out.rotation.x=-Math.PI/2;out.position.set(W/2,-.03,H/2);world.add(out);
      for(const [x,z,w,d] of [[W/2,-.3,W+1,.6],[W/2,H+.3,W+1,.6],[-.3,H/2,.6,H+1],[W+.3,H/2,.6,H+1]])world.add(box(w,.7,d,'#bfe0a6',x,.35,z));
      for(let i=0;i<70;i++){const a=Math.random()*TAU,r=24+Math.random()*50,tx=W/2+Math.cos(a)*r*1.3,tz=H/2+Math.sin(a)*r;if(tx>-2&&tx<W+2&&tz>-2&&tz<H+2)continue;const g=new T.Group();g.position.set(tx,0,tz);g.add(cyl(.2,.3,1.8,'#8a6a4a',6),ico(1.1+Math.random()*.6,['#6fb06a','#5da05a','#86c47f'][i%3],0,2.4,0));g.children[0].position.y=.9;world.add(g)}
      for(let i=0;i<8;i++){const a=i/8*TAU,hill=new T.Mesh(new T.SphereGeometry(14+Math.random()*8,16,8,0,TAU,0,Math.PI/2),toon(['#a8d8a0','#9ccf8f','#b6e0b0'][i%3]));hill.position.set(W/2+Math.cos(a)*90,-2,H/2+Math.sin(a)*80);hill.scale.y=.7;world.add(hill)}
    }else if(key==='ada'){
      const sea=new T.Mesh(new T.PlaneGeometry(300,300,60,60),new T.MeshLambertMaterial({color:'#58b5d8',transparent:true,opacity:.92}));sea.rotation.x=-Math.PI/2;sea.position.set(W/2,-.45,H/2);world.add(sea);
      const pos=sea.geometry.attributes.position,base=Float32Array.from(pos.array);anim.push((t)=>{if(calm)return;for(let i=0;i<pos.count;i++){const x=base[i*3],y=base[i*3+1];pos.setZ(i,Math.sin(x*.18+t*.9)*.18+Math.cos(y*.22+t*.7)*.15)}pos.needsUpdate=true});
      world.add(box(W+1.4,.9,H+1.4,'#e6d3a0',W/2,-.45,H/2,false));
    }else{
      const wallC=key==='atolye'?'#f3e2cf':'#3b2d5a';
      for(const [x,z,w,d] of [[W/2,-.5,W+3,1],[W/2,H+.5,W+3,1],[-.5,H/2,1,H+3],[W+.5,H/2,1,H+3]]){const wl=box(w,3.6,d,wallC,x,1.8,z,false);world.add(wl);occluders.push(wl)}
      const out=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshLambertMaterial({color:key==='atolye'?'#e8d3b6':'#1b1430'}));out.rotation.x=-Math.PI/2;out.position.set(W/2,-.05,H/2);world.add(out);
      for(let i=0;i<5;i++){const wnd=new T.Mesh(new T.PlaneGeometry(2.6,1.7),winMat);wnd.position.set(3+i*6.5,2.1,.02);world.add(wnd)}
    }
    // engeller
    for(const o of map.obstacles){
      let m=null;
      switch(o.k){case 'building':m=building(o,map.h);break;case 'tree':m=treeObj(o,key==='ada');break;case 'rock':m=rockObj(o);break;case 'fountain':m=fountainObj(o);break;case 'board':m=boardObj(o);break;case 'pillar':m=pillarObj(o);break;case 'wall':m=wallObj(o);break;case 'bucket':m=bucketObj(o);break;case 'speaker':m=speakerObj(o);break;case 'easel':m=easelObj(o);break}
      if(m)world.add(m);
    }
    if(map.gate){const g=map.gate;gateMesh=new T.Group();gateMesh.position.set((g.x+g.w/2)/P,0,(g.y+g.h/2)/P);gateMesh.add(box(g.w/P,2.4,g.h/P,'#8a76a0',0,1.2,0));for(let z=-1.2;z<=1.2;z+=.6)gateMesh.add(box(g.w/P+.06,.06,.5,'#5f5070',0,1.9,z,false));const lock=iconSprite('🔒',.9);lock.position.y=1.3;gateMesh.add(lock);world.add(gateMesh)}
    // peds / plakalar
    map.pads.forEach((pd,i)=>{
      const g=new T.Group();g.position.set(pd.x/P,0,pd.y/P);const big=key==='ritim';
      const base=cyl(big?1.0:.9,big?1.05:.95,.25,pd.c,24);base.position.y=.12;g.add(base);
      const top=new T.Mesh(new T.CylinderGeometry(big?.85:.75,big?.85:.75,.06,24),new T.MeshStandardMaterial({color:pd.c,emissive:pd.c,emissiveIntensity:.25,roughness:.5}));top.position.y=.27;g.add(top);
      const lab=labelSprite(key==='ritim'?String(i+1):pd.label,{bg:'#40354ee6',fg:'#fff',size:30,unit:130});lab.position.y=1.3;g.add(lab);
      if(key==='ritim'){const cone=new T.Mesh(new T.ConeGeometry(1.1,5,20,1,true),new T.MeshBasicMaterial({color:pd.c,transparent:true,opacity:.1,side:T.DoubleSide,depthWrite:false}));cone.position.y=3;g.add(cone)}
      world.add(g);padMeshes.push({g,top,on:0,flash:0,color:pd.c});
    });
    if(key==='ritim'){const c=mkCanvas(1024,256);ledCtx=c.getContext('2d');ledTex=tex(c);world.userData.texs.push(ledTex);const led=new T.Mesh(new T.PlaneGeometry(10,2.5),new T.MeshBasicMaterial({map:ledTex}));led.position.set(W/2,3,1.1);world.add(led)}
    // etkileşim noktaları
    for(const it of map.interact){
      const g=new T.Group();g.position.set(it.x/P,0,it.y/P);const e={it,g,lab:null,icon:null,robot:null,portal:null,lid:null};
      const ring=new T.Mesh(new T.TorusGeometry(.7,.06,8,32),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.85}));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.add(ring);e.ring=ring;
      if(it.act==='npc'){const r=robotObj();g.add(r);e.robot=r}
      else if(it.act==='portal'){const colr={ada:'#7fe0ff',atolye:'#ff9ad5',ritim:'#ffd36a',meydan:'#bba2ff'}[it.arg]||'#bba2ff',p=portalRing(colr);g.add(p);e.portal=p;e.icon=iconSprite(it.emoji,.8);e.icon.position.y=3;g.add(e.icon)}
      else if(it.act==='clue'){const ped=cyl(.35,.5,.8,'#cfc6d8',10);ped.position.y=.4;g.add(ped);e.icon=iconSprite(it.emoji,1.1);e.icon.position.y=1.7;g.add(e.icon)}
      else if(it.act==='chest'){const cb=box(1.4,.8,.9,'#b07a3a',0,.4,0),lid=new T.Group();lid.position.set(0,.8,-.45);lid.add(box(1.4,.35,.9,'#c98d44',0,.17,.45));g.add(cb,lid);g.add(box(1.5,.12,1,'#e8c15a',0,.55,0,false));chestLid=lid;e.icon=iconSprite('✨',.9);e.icon.position.y=1.9;g.add(e.icon)}
      else{e.icon=iconSprite(it.emoji,it.act==='mission'?.95:.85,it.act==='mission');e.icon.position.y=it.act==='mission'?2.6:2.1;g.add(e.icon)}
      e.lab=labelSprite(it.label,{bg:'#40354ee6',fg:'#fff',size:28,unit:150,depth:it.act==='mission'});e.lab.position.y=it.act==='portal'?3.8:(e.robot?2.5:(it.act==='mission'?3.3:2.9));g.add(e.lab);
      world.add(g);interacts.push(e);
    }
    // bulutlar (dış mekân)
    if(!indoor)for(let i=0;i<7;i++){const c=new T.Group();for(let k=0;k<4;k++){const s=new T.Mesh(new T.IcosahedronGeometry(1.4+Math.random()*.9,1),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.9,fog:false}));s.position.set(k*1.5,Math.random()*.4,Math.random()*.8);s.scale.y=.6;c.add(s)}c.position.set(Math.random()*W*1.6-W*.3,16+Math.random()*5,Math.random()*H*1.4-H*.2);c.userData.sp=.15+Math.random()*.2;clouds.push(c);world.add(c)}
    setState(st);
  }
  function setState(st){
    state=st;if(!mapInfo)return;
    if(st.kind==='atolye')drawEasel();if(st.kind==='ritim')drawLed();
  }

  /* ---------- avatarlar ---------- */
  function makeAvatar(p){
    const g=new T.Group(),col=COLORS[p.c];
    const body=new T.Mesh(new T.CapsuleGeometry(.3,.5,4,10),toon(col));body.position.y=.8;body.castShadow=shadowsOn;g.add(body);
    const head=new T.Group();head.position.y=1.5;const hs=new T.Mesh(new T.SphereGeometry(.33,18,14),toon('#fff4e6'));hs.castShadow=shadowsOn;head.add(hs);
    const face=new T.Mesh(new T.PlaneGeometry(.5,.5),new T.MeshBasicMaterial({map:iconTex(FACES[p.e]),transparent:true}));face.position.set(0,0,.325);head.add(face);
    const cap=new T.Mesh(new T.SphereGeometry(.345,18,8,0,TAU,0,Math.PI*.36),toon(col));cap.position.y=.02;cap.rotation.x=-.25;head.add(cap);g.add(head);
    const armL=new T.Group(),armR=new T.Group();armL.position.set(-.4,1.1,0);armR.position.set(.4,1.1,0);
    for(const a of [armL,armR]){const m=new T.Mesh(new T.CapsuleGeometry(.08,.34,3,6),toon(col));m.position.y=-.2;a.add(m);g.add(a)}
    const legL=new T.Group(),legR=new T.Group();legL.position.set(-.15,.5,0);legR.position.set(.15,.5,0);
    for(const l of [legL,legR]){const m=new T.Mesh(new T.CylinderGeometry(.09,.1,.45,8),toon('#5a4a7a'));m.position.y=-.22;l.add(m);g.add(l)}
    const blob=new T.Mesh(new T.CircleGeometry(.5,16),new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.22,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=.02;g.add(blob);
    const ring=new T.Mesh(new T.TorusGeometry(.55,.05,6,24),new T.MeshBasicMaterial({color:'#d7eca9'}));ring.rotation.x=Math.PI/2;ring.position.y=.04;ring.visible=false;g.add(ring);
    const hit=new T.Mesh(new T.SphereGeometry(.8,6,4),new T.MeshBasicMaterial({visible:false}));hit.position.y=1;hit.userData.pid=p.id;g.add(hit);hitList.push(hit);
    const a={g,body,head,armL,armR,legL,legR,ring,hit,tag:null,tagKey:'',bubble:null,bubbleKey:'',bobPh:Math.random()*TAU,rot:p.h||0,p};
    world?.add(g);return a;
  }
  function syncAvatars(S,t,dt,mute){
    for(const [id,a] of avatars)if(!S.players.has(id)){world?.remove(a.g);const hi=hitList.indexOf(a.hit);if(hi>=0)hitList.splice(hi,1);avatars.delete(id)}
    for(const p of S.players.values()){
      let a=avatars.get(p.id);if(!a){a=makeAvatar(p);avatars.set(p.id,a)}
      a.p=p;const g=a.g,me=p.id===S.id,ghost=mute.has(p.id);
      g.position.x=p.x/P;g.position.z=p.y/P;
      let dr=(p.h||0)-a.rot;dr=Math.atan2(Math.sin(dr),Math.cos(dr));a.rot+=dr*Math.min(1,dt*12);g.rotation.y=a.rot;
      const mv=p.mv,k=calm?0:1,sw=mv?Math.sin(t*11+a.bobPh)*.85:0,emo=p.emo&&t*1000<p.emo.until?p.emo.i:-1;
      a.legL.rotation.x=sw*k;a.legR.rotation.x=-sw*k;a.armL.rotation.x=-sw*.8*k;a.armR.rotation.x=sw*.8*k;
      let y=mv&&!calm?Math.abs(Math.sin(t*11+a.bobPh))*.07:Math.sin(t*2+a.bobPh)*.015*k;a.body.scale.y=1+(mv?0:Math.sin(t*2+a.bobPh)*.02*k);
      if(emo===3){y+=Math.abs(Math.sin(t*9))*.45;g.rotation.y+=t*5%TAU;a.armL.rotation.z=a.armR.rotation.z=2.4}
      else if(emo===5){a.armR.rotation.x=0;a.armR.rotation.z=2.6+Math.sin(t*14)*.4;a.armL.rotation.z=0}
      else if(emo===1){a.armL.rotation.set(-1.2,0,.5);a.armR.rotation.set(-1.2,0,-.5+Math.sin(t*20)*.3)}
      else if(emo===0||emo===2||emo===7||emo===4||emo===6){a.head.rotation.z=Math.sin(t*8)*.18;a.armL.rotation.z=a.armR.rotation.z=0}
      else{a.armL.rotation.z=a.armR.rotation.z=0;a.head.rotation.z=0}
      g.position.y=y;a.ring.visible=me;
      g.scale.setScalar(ghost?.78:1);
      // isim etiketi
      const tk=p.n+'|'+(p.st||[]).join(',')+me+ghost;if(tk!==a.tagKey){if(a.tag){g.remove(a.tag)}a.tagKey=tk;const icons=(p.st||[]).map(s=>S.stamps[s]?.icon||'').join('');a.tag=labelSprite((ghost?'🔇 ':'')+p.n+(icons?' '+icons:''),{bg:me?'#d7eca9':ghost?'#d8d2e0':'#ffffffee',size:30,unit:150});a.tag.position.y=2.2;g.add(a.tag)}
      // konuşma balonu
      const sy=p.say&&!ghost&&t*1000*1<p.say.until?p.say:null,bk=sy?sy.t+(sy.e?'e':'p'):'';
      if(bk!==a.bubbleKey){if(a.bubble){g.remove(a.bubble);a.bubble=null}a.bubbleKey=bk;if(sy){a.bubble=sy.e?iconSprite(sy.t,.9):labelSprite(sy.t,{bg:'#ffffff',fg:'#40354e',size:28,border:'#d8c9ea',unit:130});a.bubble.position.y=sy.e?2.85:2.75;g.add(a.bubble)}}
      if(a.bubble&&sy?.e)a.bubble.position.y=2.85+(calm?0:Math.sin(t*5)*.06);
    }
  }

  /* ---------- parçacıklar ---------- */
  const pDot=(()=>{const c=mkCanvas(32,32),x=c.getContext('2d');const g=x.createRadialGradient(16,16,2,16,16,15);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');x.fillStyle=g;x.fillRect(0,0,32,32);return tex(c)})();
  function burst(x,z,color='#ffffff',n=14,y=.6){if(calm)n=Math.min(n,4);for(let i=0;i<n&&particles.length<140;i++){const s=new T.Sprite(new T.SpriteMaterial({map:pDot,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));s.position.set(x,y,z);s.scale.setScalar(.35);const a=Math.random()*TAU,v=1+Math.random()*2.4;scene.add(s);particles.push({s,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:2+Math.random()*3,life:0,max:.7+Math.random()*.5})}}

  /* ---------- gün / gece ---------- */
  const C=(h)=>new T.Color(h),night=C('#252a58'),dayTop=C('#7cc8ff'),dayBot=C('#e6f5ff'),dusk=C('#ff9a6a'),tmp=new T.Color();
  function applyTime(){
    const cycle=420,ph=(((Date.now()+clockOff.v)/1000)%cycle)/cycle;               // 7 dk
    const light=.5+.5*Math.cos((ph-.35)*TAU),dayAmt=smooth(.2,.62,light),warm=1-clamp(Math.abs(dayAmt-.5)*2.4,0,1);
    const indoor=mapInfo&&(mapInfo.key==='atolye'||mapInfo.key==='ritim'),dn=indoor?1:dayAmt;
    const top=tmp.copy(night).lerp(dayTop,dn).lerp(dusk,warm*.55*(indoor?0:1));skyU.top.value.copy(top);
    skyU.bottom.value.copy(night).lerp(dayBot,dn).lerp(dusk,warm*.8*(indoor?0:1));
    scene.fog.color.copy(skyU.bottom.value);
    hemi.intensity=indoor?1.15:.85+.55*dn;hemi.color.set(indoor?'#fff2e0':'#ffffff').lerp(C('#8fa0ff'),(1-dn)*.55);sun.intensity=indoor?1.4:2.6*dn+.45;sun.color.set('#fff4d6').lerp(dusk,warm*.6);
    const ang=ph*TAU-Math.PI*.7;sun.position.set(cam.tx+Math.cos(ang)*30,20+Math.sin(ang)*18+8,cam.tz+Math.sin(ang*.8)*20+12);sun.target.position.set(cam.tx,0,cam.tz);
    starsM.opacity=indoor?0:clamp(1-dayAmt*1.6,0,1);
    winMat.color.set('#b9d4ee').lerp(C('#ffd98a'),indoor?.6:1-dayAmt);
    return dayAmt;
  }

  /* ---------- girdi: kamera, dokunma ---------- */
  const ptr=new Map();let dragMoved=0,lastPinch=0,lastCamSend=0;
  const ray=new T.Raycaster(),ndc=new T.Vector2(),groundPlane=new T.Plane(new T.Vector3(0,1,0),0),hitPt=new T.Vector3();
  function pick(cx,cy){
    const r=cv.getBoundingClientRect();ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    const out={x:null,y:null,player:null};
    const hits=ray.intersectObjects(hitList,false);if(hits.length)out.player=hits[0].object.userData.pid;
    if(ray.ray.intersectPlane(groundPlane,hitPt)){out.x=hitPt.x*P;out.y=hitPt.z*P}
    return out;
  }
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY});dragMoved=0;lastPinch=0});
  cv.addEventListener('pointermove',e=>{
    const p=ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(ptr.size===2){const [a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(lastPinch)cam.dist=clamp(cam.dist*(lastPinch/d),5,24);lastPinch=d;dragMoved=99;return}
    dragMoved+=Math.abs(dx)+Math.abs(dy);
    if(dragMoved>7){cam.yaw-=dx*.0065;cam.pitch=clamp(cam.pitch+dy*.0042,.28,1.3);const t=performance.now();if(t-lastCamSend>90){lastCamSend=t;opts.onCamera?.()}}
  });
  const up=e=>{const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(p&&dragMoved<=7&&e.type==='pointerup'&&e.button<=0)opts.onTap?.(pick(e.clientX,e.clientY));lastPinch=0};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('wheel',e=>{e.preventDefault();cam.dist=clamp(cam.dist*Math.exp(e.deltaY*.001),5,24)},{passive:false});

  function dirToWorld(ix,iy){const s=Math.sin(cam.yaw),c=Math.cos(cam.yaw),fx=-s,fz=-c,rx=c,rz=-s;return [rx*ix+fx*(-iy),rz*ix+fz*(-iy)]}

  /* ---------- çizim döngüsü ---------- */
  let sw=0,sh=0;
  function resize(w,h){sw=w;sh=h;renderer.setSize(w,h,false);cv.style.width=w+'px';cv.style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();if(coarse||w<600)cam.dist=Math.max(cam.dist,12)}
  const camDir=new T.Vector3(),camOrg=new T.Vector3(),camRay=new T.Raycaster();
  function render(S,t,dt,mute){
    if(!world)return;const day=applyTime();
    syncAvatars(S,t,dt,mute);
    const me=S.players.get(S.id);if(me){const k=Math.min(1,dt*5);cam.tx+=(me.x/P-cam.tx)*k;cam.tz+=(me.y/P-cam.tz)*k}
    const cp=Math.cos(cam.pitch),dirV=camDir.set(Math.sin(cam.yaw)*cp,Math.sin(cam.pitch),Math.cos(cam.yaw)*cp);
    camRay.set(camOrg.set(cam.tx,cam.ty,cam.tz),dirV);camRay.far=cam.dist;const oh=camRay.intersectObjects(occluders.filter(o=>o.visible),false);
    const want=oh.length?Math.max(2.4,oh[0].distance-.6):cam.dist;camDist+=(want-camDist)*Math.min(1,dt*(want<camDist?14:3));
    camera.position.set(cam.tx+dirV.x*camDist,cam.ty+dirV.y*camDist,cam.tz+dirV.z*camDist);camera.lookAt(cam.tx,cam.ty,cam.tz);
    for(const rf of roofs){const hide=camera.position.x>rf.x0&&camera.position.x<rf.x1&&camera.position.z>rf.z0&&camera.position.z<rf.z1;rf.m.visible=rf.b.visible=!hide;rf.f.visible=hide}
    for(const f of anim)f(t,dt);
    // çeşme
    for(const d of fountainDrops){const u=(t*.7+d.ph)%1,r=.15+u*1.15;d.m.position.set(Math.cos(d.a)*r,.7+Math.sin(u*Math.PI)*1.4,Math.sin(d.a)*r)}
    for(const c of clouds){c.position.x+=c.userData.sp*dt;if(c.position.x>mapInfo.w/P+30)c.position.x=-30}
    // etkileşim noktaları
    for(const e of interacts){
      const near=me&&Math.hypot(me.x-e.it.x,me.y-e.it.y)<e.it.r+20,clueDone=e.it.act==='clue'&&state?.clues?.[e.it.arg];
      e.ring.scale.setScalar(1+(calm?0:Math.sin(t*3+e.it.x)*.08)+(near?.25:0));e.ring.material.color.set(near?'#b79bff':'#ffffff');
      if(e.icon){e.icon.position.y=(e.it.act==='mission'?2.6:e.it.act==='portal'?3:e.it.act==='clue'?1.7:e.it.act==='chest'?1.9:2.1)+(calm?0:Math.sin(t*2.4+e.it.y)*.12);e.icon.material.opacity=clueDone?.4:1}
      e.lab.visible=near||e.it.act!=='mission';
      if(e.portal){e.portal.userData.ring.rotation.z=t*1.2;e.portal.rotation.y=Math.atan2(camera.position.x-e.g.position.x,camera.position.z-e.g.position.z);e.portal.userData.disc.material.opacity=.22+(calm?0:Math.sin(t*3)*.08)+(near?.15:0);if(Math.random()<.04&&!calm)burst(e.g.position.x+(Math.random()-.5)*1.4,e.g.position.z+(Math.random()-.5)*.3,e.portal.userData.ring.material.color,1,.4+Math.random()*1.8)}
      if(e.robot){const h=e.robot.userData.head;let tr=0;if(me){tr=Math.atan2(me.x/P-e.g.position.x,me.y/P-e.g.position.z)}h.rotation.y+=(clamp(Math.atan2(Math.sin(tr),Math.cos(tr)),-.9,.9)-h.rotation.y)*.12;e.robot.position.y=calm?0:Math.sin(t*2)*.05;e.robot.userData.bulb.material.color.set(near?'#ffd36a':'#d7eca9')}
      if(e.it.act==='chest'&&chestLid)chestLid.rotation.x=lerp(chestLid.rotation.x,state?.done?-1.9:0,.12);
    }
    // pedler
    padMeshes.forEach((pm,i)=>{const on=state?.pads?.[i]?1:0;pm.on+=(on-pm.on)*Math.min(1,dt*10);pm.flash=Math.max(0,pm.flash-dt*2.5);const m=pm.top.material;m.emissiveIntensity=.25+pm.on*1.3+pm.flash*2;pm.g.position.y=-pm.on*.07;if(on&&!pm._p){pm._p=1;burst(pm.g.position.x,pm.g.position.z,pm.color,8,.4)}if(!on)pm._p=0});
    if(gateMesh){const open=!!state?.gate;gateMesh.position.y=lerp(gateMesh.position.y,open?-2.6:0,.07)}
    // parçacıklar
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;p.vy-=9*dt;p.s.position.x+=p.vx*dt;p.s.position.z+=p.vz*dt;p.s.position.y=Math.max(.05,p.s.position.y+p.vy*dt);p.s.material.opacity=1-p.life/p.max;if(p.life>=p.max){scene.remove(p.s);p.s.material.dispose();particles.splice(i,1)}}
    renderer.render(scene,camera);
  }
  function hit(pad,ok){const pm=padMeshes[pad];if(!pm)return;pm.flash=ok?1:.3;burst(pm.g.position.x,pm.g.position.z,ok?pm.color:'#ff5a5a',ok?14:6,.5)}
  function dispose(){clearWorld();renderer.dispose();cv.remove()}
  return {kind:'3d',canvas:cv,setMap,setState,render,resize,pick,dirToWorld,hit,burst,dispose,setClock:ms=>{clockOff.v=ms},
    
    get camYaw(){return cam.yaw},get dbg(){return {occ:occluders.length,camDist,want:cam.dist,pos:camera.position.toArray().map(v=>+v.toFixed(1)),tgt:[cam.tx,cam.tz].map(v=>+v.toFixed(1))}}};
}
window.ScolaHub3D={create};
})();
