/* Yaşayan arayüz katmanı: selamlama, günün küçük adımı, hareketli arka plan, maskot tepkileri. Süstür; hak, XP ya da doğrulama üretmez. */
(function(){
const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const STEPS=[['Bir eğitimin ilk modülünü bitir','academy','Öğren’e git'],['Bir görevin kapsamını ve kabul ölçütlerini oku','missions','Görevlere bak'],['Pazar’da bir ilana göz at','market','Pazar’a git'],['Meydan’a gir, biriyle tanış','hub','Meydan’a gir'],['Yolundaki sıradaki adıma bak','growth','Yolum’a git'],['Bildiğin küçük bir şeyi paylaş','teach','Eğitim oluştur'],['Seni tanıyalım anketini doldur','survey','Ankete git']];
function dayIndex(){const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)}
function greet(name){const h=new Date().getHours(),g=h<6?'İyi geceler':h<12?'Günaydın':h<18?'Merhaba':'İyi akşamlar';return `${g} ${name}.`}
function daily(){const [t,go,btn]=STEPS[dayIndex()%STEPS.length];const act=go==='teach'?'openTeach()':`navigate('${go}')`;return `<div class="daily-step"><span class="daily-bird" data-mascot="head"></span><div><small>BUGÜNÜN KÜÇÜK ADIMI</small><strong>${t}</strong></div><button class="btn light small" onclick="${act}">${btn}</button></div>`}
const LEAF='<svg viewBox="0 0 24 24" fill="none" stroke="#23202f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20C4 9 11 4 20 4C20 13 15 20 4 20Z"/><path d="M4 20L14 10"/></svg>';
function decorate(){
  const main=document.getElementById('main');if(!main)return;
  const hero=main.querySelector('.hero');
  if(hero&&!hero.querySelector('.leaves')&&!reduce()){hero.style.position='relative';hero.insertAdjacentHTML('afterbegin','<div class="leaves" aria-hidden="true">'+Array.from({length:7},(_,i)=>`<i style="left:${8+i*13}%;animation-delay:${-i*2.3}s;animation-duration:${14+i%3*4}s">${LEAF}</i>`).join('')+'</div>')}
  const intro=main.querySelector('.page-intro');
  if(intro&&main.querySelector('[data-home]')&&!main.querySelector('.daily-step'))intro.insertAdjacentHTML('afterend',daily());
  window.Mascot?.scan?.(main);
}
const ph=['Ürün test etmeyi öğren…','Renk paleti…','Ritim…','Hikâye belgeleme…','Prototip…'];let pi=0;
function rotatePlaceholder(){const s=document.getElementById('globalSearch');if(!s||reduce())return;setInterval(()=>{if(document.activeElement===s||document.hidden)return;pi=(pi+1)%ph.length;s.placeholder=ph[pi]},3500)}
function hooks(){
  const t=window.toast;if(typeof t==='function')window.toast=function(m){try{window.Mascot?.peck?.()}catch{}return t.apply(this,arguments)};
  document.addEventListener('click',e=>{if(e.target.closest?.('#nav a'))window.Mascot?.peck?.()});
}
window.Alive={greet,decorate};
document.addEventListener('DOMContentLoaded',()=>{rotatePlaceholder();hooks();decorate()});
})();
