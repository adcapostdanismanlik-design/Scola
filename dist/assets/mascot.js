/* Scola ağaçkakanı: tek kaynaklı çizim + hareketler. Süs amaçlıdır; XP, seviye ya da doğrulama anlamı taşımaz. */
(function(root){
function art(kind,extra){return `<div class="mascot ${kind==='full'?'':'mascot-head'} ${extra||''}"><div class="m-stage"><img class="m-img" src="assets/woodpecker.png" alt="Scola ağaçkakanı" draggable="false"><i class="m-lid"></i></div></div>`}
const calm=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const MOODS={peck:900*3/1000*1000,flap:1000,hop:700,tilt:1500,cheer:1500};
let nodes=[];
function play(el,mood){if(!el||calm())return;Object.keys(MOODS).forEach(m=>el.classList.remove('is-'+m));void el.getBoundingClientRect();el.classList.add('is-'+mood);clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('is-'+mood),MOODS[mood]+80)}
function all(mood){nodes=nodes.filter(n=>n.isConnected);nodes.forEach(n=>play(n,mood))}
function scan(scope){(scope||document).querySelectorAll('[data-mascot]:not([data-m-ready])').forEach(h=>{const kind=h.dataset.mascot==='full'?'full':'head';h.dataset.mReady='1';h.innerHTML=art(kind);const svg=h.firstElementChild;nodes.push(svg);if(kind==='full')svg.addEventListener('click',()=>play(svg,'peck'));h.addEventListener('pointerenter',()=>play(svg,kind==='full'?'tilt':'peck'))})}
function look(){}
let idleT;function idle(){clearTimeout(idleT);idleT=setTimeout(()=>{const vis=nodes.filter(n=>n.isConnected&&n.classList.contains('mascot')&&!n.classList.contains('mascot-head')&&n.getBoundingClientRect().height);if(vis.length&&!document.hidden)play(vis[0],['peck','tilt','flap','hop'][Math.floor(Math.random()*4)]);idle()},4500+Math.random()*3500)}
document.addEventListener('DOMContentLoaded',()=>{scan();idle()});
root.Mascot={art,scan,play:all,cheer:()=>all('cheer'),peck:()=>all('peck')};
})(typeof window!=='undefined'?window:globalThis);
