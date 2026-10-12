/* Scola ağaçkakanı: kesilmiş görsel, WebGL örgü bükmesiyle canlandırılır (baş, arma, kanat, kuyruk, gövde ayrı ayrı oynar).
   WebGL yoksa ya da hareket azaltma açıksa sabit görsel gösterilir. Hareketler süstür; XP ya da doğrulama anlamı taşımaz. */
(function(root){
const SRC='assets/woodpecker.png';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const sm=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const FIELDS=['head','hx','hy','crest','wing','tail','lean','hop','sq'];
const add=(o,p)=>{for(const k in p)o[k]=(o[k]||0)+p[k]};
/* Hareketler: süre (sn) ve geçen süreye göre sapma değerleri. Baş açısı + değeri öne/aşağı (saat yönü). */
const ACTIONS={
  peck:{dur:2.3,f(e){const o={},H=.62,n=Math.floor(e/H);if(n>=3){const x=clamp((e-3*H)/.4);o.head=.03*Math.sin(x*14)*(1-x);return o}
    const x=(e%H)/H,ant=sm(0,.3,x)-sm(.3,.38,x),str=sm(.3,.42,x)-sm(.55,.9,x),vib=Math.sin(x*70)*sm(.42,.5,x)*(1-sm(.5,.75,x));
    o.head=-.12*ant+.42*str+.02*vib;o.hx=.025*str;o.hy=.05*str-.012*ant;o.lean=-.02*ant+.045*str;o.sq=-.012*str;o.crest=-.12*str+.06*ant;o.tail=-.04*str;o.wing=.05*str;return o}},
  flap:{dur:1.3,f(e){const env=sm(0,.12,e)*(1-sm(1.05,1.3,e)),w=Math.abs(Math.sin(e*Math.PI*3.6));return {wing:.6*w*env,hop:.02*w*env,tail:-.1*env,head:-.06*env,crest:.12*Math.sin(e*38)*env,sq:.012*w*env}}},
  hop:{dur:.9,f(e){const squat=sm(0,.15,e)-sm(.15,.22,e),air=e>.15&&e<.55?Math.sin(Math.PI*(e-.15)/.4):0,land=sm(.55,.6,e)-sm(.6,.85,e);return {sq:-.035*squat+.025*air-.04*land,hop:.09*air,wing:.3*air,head:-.06*air+.05*land,crest:.15*land-.1*air,tail:.1*air}}},
  tilt:{dur:1.7,f(e){const env=sm(0,.3,e)*(1-sm(1.25,1.7,e));return {head:-.14*env,hx:-.012*env,lean:-.012*env,crest:.1*Math.sin(e*7)*env}}},
  look:{dur:2.2,f(e){return {head:-.08*(sm(0,.3,e)-sm(.55,.85,e))+.07*(sm(.85,1.15,e)-sm(1.5,2,e)),crest:.06*Math.sin(e*5)}}},
  cheer:{dur:1.9,f(e){const o={};add(o,ACTIONS.hop.f(e));add(o,ACTIONS.hop.f(e-.75));add(o,ACTIONS.flap.f(e*.8));o.head=(o.head||0)-.08*sm(0,.3,e)*(1-sm(1.5,1.9,e));return o}}
};
const VS=`precision mediump float;attribute vec2 a;uniform vec4 uRect;uniform float uA,uHead,uCrest,uWing,uTail,uLean,uHop,uSq;uniform vec2 uHeadT;varying vec2 v;
vec2 rotA(vec2 p,vec2 c,float t){vec2 d=(p-c)*vec2(uA,1.0);float s=sin(t),co=cos(t);d=vec2(co*d.x-s*d.y,s*d.x+co*d.y);return c+d/vec2(uA,1.0);}
void main(){v=a;vec2 p=a;
float wH=1.0-smoothstep(0.17,0.38,a.y);p=rotA(p,vec2(0.48,0.33),uHead*wH);p+=uHeadT*wH;
float wC=(1.0-smoothstep(0.0,0.22,a.y))*(1.0-smoothstep(0.25,0.6,a.x));p=rotA(p,vec2(0.5,0.17),uCrest*wC);
vec2 dw=(a-vec2(0.33,0.56))*vec2(1.25,1.0);float wW=exp(-dot(dw,dw)/0.045);p=rotA(p,vec2(0.45,0.40),uWing*wW);
vec2 dt=(a-vec2(0.12,0.84))*vec2(1.2,1.0);float wT=exp(-dot(dt,dt)/0.035);p=rotA(p,vec2(0.38,0.76),uTail*wT);
float wL=1.0-smoothstep(0.55,0.95,a.y);p=rotA(p,vec2(0.52,0.97),uLean*wL);
p.y=0.97+(p.y-0.97)*(1.0+uSq);p.x=0.52+(p.x-0.52)*(1.0-uSq*0.6);p.y-=uHop;
vec2 q=(p-uRect.xy)/uRect.zw;gl_Position=vec4(q.x*2.0-1.0,1.0-q.y*2.0,0.0,1.0);}`;
const FS=`precision mediump float;uniform sampler2D t;uniform float uBlink;varying vec2 v;
void main(){vec4 c=texture2D(t,v);
if(uBlink>0.01){vec2 d=(v-vec2(0.565,0.16))/vec2(0.047,0.037);float r=length(d),e=-1.0+2.0*uBlink;
if(r<1.08){if(d.y<e)c.rgb=vec3(0.97,0.96,0.94)*c.a;else if(d.y<e+0.2)c.rgb=vec3(0.13,0.11,0.17)*c.a;}}
gl_FragColor=c;}`;
const rigs=[];let img=null,imgReady=false,cursor=null;
function makeRig(box,head){
  const cv=document.createElement('canvas'),st=box.querySelector('.m-img');
  const gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:true});
  if(!gl)return null;
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  const NX=34,NY=44,pos=[],idx=[];
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++)pos.push(i/NX,j/NY);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const k=j*(NX+1)+i;idx.push(k,k+1,k+NX+1,k+1,k+NX+2,k+NX+1)}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.STATIC_DRAW);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const A=img.naturalWidth/img.naturalHeight,rectH=head?(1/(84/48))/(1/A):1;
  cv.className='m-canvas';cv.width=img.naturalWidth;cv.height=Math.round(head?img.naturalWidth*48/84:img.naturalHeight);
  gl.viewport(0,0,cv.width,cv.height);
  const U=n=>gl.getUniformLocation(pr,n);
  const u={rect:U('uRect'),A:U('uA'),head:U('uHead'),crest:U('uCrest'),wing:U('uWing'),tail:U('uTail'),lean:U('uLean'),hop:U('uHop'),sq:U('uSq'),hx:U('uHeadT'),blink:U('uBlink')};
  gl.uniform4f(u.rect,0,0,1,head?Math.min(1,rectH):1);gl.uniform1f(u.A,A);
  box.appendChild(cv);box.classList.add('gl');
  const r={box,cv,gl,u,head,acts:[],blink:{next:performance.now()/1e3+2,t0:-9,dbl:false},look:0,cx:0,
    play(name,now){if(this.acts.some(a=>a.name===name&&now-a.t0<.2))return;this.acts=this.acts.filter(a=>a.name!==name);this.acts.push({name,t0:now,def:ACTIONS[name]})}};
  return r;
}
function frame(now){
  requestAnimationFrame(frame);if(document.hidden)return;
  const t=now/1e3;
  for(const r of rigs){
    if(!r.box.isConnected)continue;
    const bb=r.box.getBoundingClientRect();if(bb.bottom<0||bb.top>innerHeight||!bb.width)continue;
    const o={};
    // boşta: nefes, hafif baş ve arma salınımı
    o.sq=(o.sq||0)+Math.sin(t*1.7)*.006;
    o.head=Math.sin(t*.7)*.022+Math.sin(t*1.9+1)*.008;o.crest=Math.sin(t*2.3)*.035;o.tail=Math.sin(t*.9)*.018;o.wing=Math.sin(t*1.7+.5)*.015;
    // imleci hafifçe izle
    if(cursor){const dy=(cursor.y-(bb.top+bb.height*.2))/innerHeight,dx=(cursor.x-(bb.left+bb.width*.6))/innerWidth;const tg=clamp(dy,-1,1)*.07,tx=clamp(dx,-1,1)*.012;r.look+=(tg-r.look)*.06;r.cx+=(tx-r.cx)*.06}
    o.head+=r.look;o.hx=r.cx;
    r.acts=r.acts.filter(a=>t-a.t0<a.def.dur);
    for(const a of r.acts)add(o,a.def.f(t-a.t0));
    // göz kırpma
    const B=r.blink;if(t>B.next){B.t0=t;B.next=t+2.5+Math.random()*3.5;B.dbl=Math.random()<.2}
    let bl=0;const e=t-B.t0;if(e<.16)bl=Math.sin(e/.16*Math.PI);else if(B.dbl&&e>.26&&e<.42)bl=Math.sin((e-.26)/.16*Math.PI);
    const g=r.gl,u=r.u;
    g.uniform1f(u.head,o.head||0);g.uniform1f(u.crest,o.crest||0);g.uniform1f(u.wing,o.wing||0);g.uniform1f(u.tail,o.tail||0);g.uniform1f(u.lean,o.lean||0);g.uniform1f(u.hop,o.hop||0);g.uniform1f(u.sq,o.sq||0);g.uniform2f(u.hx,o.hx||0,o.hy||0);g.uniform1f(u.blink,bl);
    g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);g.drawElements(g.TRIANGLES,34*44*6,g.UNSIGNED_SHORT,0);
  }
}
const calm=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function html(kind,extra){return `<div class="mascot ${kind==='full'?'':'mascot-head'} ${extra||''}"><img class="m-img" src="${SRC}" alt="Scola ağaçkakanı" draggable="false"></div>`}
function boxes(){return rigs.map(r=>r.box)}
function all(mood){const now=performance.now()/1e3;rigs.forEach(r=>{if(r.box.isConnected)r.play(mood,now)})}
function upgrade(){
  document.querySelectorAll('.mascot:not(.gl):not([data-nogl])').forEach(box=>{
    if(!imgReady||calm()){box.dataset.nogl='1';return}
    try{const r=makeRig(box,box.classList.contains('mascot-head'));if(r){rigs.push(r);box.firstElementChild.style.visibility='hidden'}else box.dataset.nogl='1'}catch(e){box.dataset.nogl='1'}
  });
  for(let i=rigs.length-1;i>=0;i--)if(!rigs[i].box.isConnected)rigs.splice(i,1);
}
function scan(scope){(scope||document).querySelectorAll('[data-mascot]:not([data-m-ready])').forEach(h=>{const kind=h.dataset.mascot==='full'?'full':'head';h.dataset.mReady='1';h.innerHTML=html(kind);const box=h.firstElementChild;
  h.addEventListener('pointerenter',()=>{const r=rigs.find(x=>x.box===box);r?.play(kind==='full'?'tilt':'peck',performance.now()/1e3)});
  if(kind==='full')h.addEventListener('click',()=>{const r=rigs.find(x=>x.box===box);r?.play('peck',performance.now()/1e3)})});upgrade()}
let idleT;function idle(){clearTimeout(idleT);idleT=setTimeout(()=>{const vis=rigs.filter(r=>r.box.isConnected&&r.box.getBoundingClientRect().height&&r.box.getBoundingClientRect().top<innerHeight);if(vis.length&&!document.hidden){const r=vis[Math.floor(Math.random()*vis.length)],pool=r.head?['look','tilt','peck']:['peck','tilt','look','flap','hop','peck'];r.play(pool[Math.floor(Math.random()*pool.length)],performance.now()/1e3)}idle()},3500+Math.random()*3000)}
root.Mascot={scan,play:all,cheer:()=>all('cheer'),peck:()=>all('peck'),hop:()=>all('hop'),flap:()=>all('flap')};
function boot(){img=new Image();img.onload=()=>{imgReady=true;upgrade();requestAnimationFrame(frame);idle()};img.src=SRC;scan()}
document.addEventListener('pointermove',e=>{cursor={x:e.clientX,y:e.clientY}},{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
