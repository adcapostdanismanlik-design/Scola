// Çalışan sunucuya açıkça "ÖRNEK" etiketli hesaplar ve görevler ekler (sunum için).
// Anket yanıtı veya teslim UYDURMAZ: o veriler gerçek ziyaretçilerden gelmelidir.
// Kullanım: SCOLA_ADMIN_EMAILS=ornek-yonetici@ornek.test npm run dev   (bir terminalde)
//           npm run seed                                               (diğerinde)
import {randomBytes} from 'node:crypto';
const base=process.env.SCOLA_URL||'http://127.0.0.1:'+(process.env.PORT||5175);
async function call(method,url,body,cookie){const r=await fetch(base+url,{method,headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));return {status:r.status,d,cookie:(r.headers.get('set-cookie')||'').split(';')[0]}}
const people=[['Örnek Yönetici','ornek-yonetici@ornek.test'],['Örnek Görev Sahibi','ornek-gorev-sahibi@ornek.test'],['Örnek Katılımcı','ornek-katilimci@ornek.test']];
const tasks=[
 {title:'[ÖRNEK] Okul kulübü için afiş tasarla',scope:'Robotik kulübünün açılışı için A3 boyutunda, okunaklı ve renk körlüğüne uygun bir afiş taslağı hazırla. Metin bizden gelecek.',acceptance:['A3 oranında ve baskıya uygun','Metin okunaklı, kontrast yeterli','Kaynak dosya ile teslim'],reward:200,duration:'2 gün'},
 {title:'[ÖRNEK] Mahalle pazarı için kısa tanıtım yazısı',scope:'Hafta sonu kurulan mahalle pazarı için 80–120 kelimelik, samimi ve doğru bilgi içeren bir tanıtım yazısı yaz. Tarih ve saat bilgisi bizden gelecek.',acceptance:['80–120 kelime aralığında','Bilgi uydurulmamış','Okuyanı pazara davet ediyor'],reward:100,duration:'1 gün'}];
let owner=null;
for(const [i,[name,email]] of people.entries()){
  const password=randomBytes(6).toString('base64url')+'-Ornek1';
  const r=await call('POST','/api/auth/register',{name,email,password});
  if(r.status===409){console.log(`• ${email} zaten var, atlandı`);continue}
  if(r.status!==200){console.error('Kayıt başarısız',email,r.d);process.exit(1)}
  console.log(`✓ ${name} · ${email} · şifre: ${password}${r.d.user.roles.includes('admin')?'  (yönetici)':''}`);
  if(i===1)owner=r.cookie;
}
if(owner){for(const t of tasks){const r=await call('POST','/api/tasks',{...t,confirm:true},owner);console.log(r.status===200?`✓ görev açıldı: ${t.title}`:`✗ ${t.title}: ${r.d.message}`)}}
else console.log('Görev sahibi hesap zaten vardı; görevler eklenmedi (şifre bilinmiyor).');
console.log('\nUyarı: bunlar yalnızca sunum için örnek hesaplardır. Gerçek ortamda silin.');
