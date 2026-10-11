# Scola — Codex geliştirme paketi

Gençlerin insanlardan öğrendiği, kendi eğitimlerini açtığı, gerçek ürün görevlerine katkı verdiği ve dijital / fiziksel ürünlerini ekiplerle büyüttüğü platformun çalışan prototipi.

## Başlat

Node.js 18 veya üzeri ile bu klasörde:

```
npm run dev
```

Tarayıcı: http://127.0.0.1:5175

İlk yöneticiyi belirlemek için (sır değildir, yalnızca e-posta listesi):

```
SCOLA_ADMIN_EMAILS=sen@ornek.com npm run dev
```

Bu e-postayla hesap açan kişi yönetici + değerlendirici olur ve "Bağımsız inceleme" sayfasından başka kullanıcılara değerlendirici rolü verebilir. Veriler `data/scola-db.json` dosyasında tutulur (depoya girmez). Farklı dosya için `SCOLA_DB=...`, HTTPS arkasında `SCOLA_SECURE_COOKIE=1`.

Bağımlılık kurulumu gerekmez. Windows'ta BASLAT.bat da kullanılabilir. Hızlı inceleme için dist/index.html doğrudan açılabilir; kalıcı kayıt davranışı tarayıcıya göre değişebilir. Google Fonts yüklenmezse sistem yazı tipi kullanılır.

## Sunum / yarışma günü

- Yalnız bu bilgisayardan: `SCOLA_ADMIN_EMAILS=sen@ornek.com npm run dev`.
- Yarışmacıların kendi cihazından görmesi için: `SCOLA_HOST=0.0.0.0` ekle ve aynı ağdan `http://<bilgisayarın-ip-adresi>:5175` adresini paylaş. Sunucu HTTPS sunmaz; internete açacaksan TLS sonlandıran bir ters vekil (ör. Caddy / Cloudflare Tunnel) arkasına koy ve `SCOLA_SECURE_COOKIE=1` kullan. Kimlik doğrulama ve veli onayı olmadan reşit olmayanların verisini herkese açık internette toplama.
- Örnek hesap + görev: sunucu çalışırken `SCOLA_ADMIN_EMAILS=ornek-yonetici@ornek.test` ile başlat, başka bir terminalde `npm run seed`. Hesapları ve şifreleri ekrana yazar; anket veya teslim uydurmaz.

## Codex'e taşı

1. ZIP'i örneğin `D:\Scola` klasörüne çıkar. `package.json` doğrudan bu klasörde olmalı.
2. Codex'te bu klasörü çalışma projesi olarak aç.
3. `CODEX_BASLANGIC.md` içeriğini ilk talimat olarak kullan.
4. Codex önce `AGENTS.md`, `PRODUCT_MODEL.md` ve `ROADMAP.md` dosyalarını okusun.

## Yerel pilot: ilk gerçek dikey akış (v0.4)

Sunucuyla açıldığında (`npm run dev`) çalışır; dosya olarak açılırsa demo aynen sürer.

- Hesap: kayıt / giriş / çıkış, scrypt ile şifre özeti, HttpOnly + SameSite=Strict oturum çerezi, giriş deneme sınırı.
- Roller: üretici, değerlendirici, yönetici. Değerlendirici rolünü yalnız yönetici verir; her rol değişikliği denetim kaydına yazılır.
- Görev sözleşmesi sunucuda: kapsam, süre, kabul ölçütleri, ücret durumu, lisans, katkı payı, deneme hakkı.
- Teslim → kör bağımsız inceleme (yazar adı gizli) → kabul / revizyon / ret, her kararda en az 40 karakter geri bildirim.
- Kabul için bütün ölçütler işaretlenmeli. XP yalnızca kabulde, kullanıcı + görev başına tek olay olarak sunucuda yazılır; istemcinin gönderdiği puan yok sayılır.
- Engeller: kendi teslimini değerlendirme, aynı teslimi ikinci kez değerlendirme, beyan edilen çıkar çatışması, 30 gün içinde karşılıklı kabul halkası, deneme sınırı aşımı.
- Ret kararına bir kez itiraz; itiraz ilk kararı vermeyen değerlendiriciye gider.
- Portfolyo: kabul edilen kanıt, doğrulanmış XP ve geri bildirim. Demo XP doğrulanmış XP'ye çevrilmez.
- Denetim kaydı (auditLog) her durum değişikliği için.

### Topluluk görevleri ve TEST MODU emanet (hackathon demosu)

- Giriş yapan herkes görev açabilir (ücret 50–5000 ₺, en fazla 5 açık görev, 2–6 kabul ölçütü). Ücret açılırken **simüle** emanete alınır; açık onay kutusu gerekir.
- Başka bir kullanıcı teslim eder; bağımsız değerlendirici kabul ederse ücret tek kazanana komisyon düşülerek serbest bırakılır, diğer bekleyen teslimler kapanır. Teslim beklemiyorsa görev sahibi iptal edip iade alabilir.
- Görev sahibi kendi görevine teslim yapamaz ve kendi görevinin değerlendiricisi olamaz. Komisyon oranı `SCOLA_COMMISSION_PCT` (varsayılan 10) ile ayarlanır; bu oran demo değeridir, ürün kararı değildir.
- Herkese açık, anonim **emanet defteri** (`/api/ledger`): emanet, serbest bırakma ve iade kayıtları.
- **Gerçek para yoktur.** Arayüz ve API her yerde TEST MODU yazar. Gerçek para için lisanslı ödeme sağlayıcısı (bloke/pazaryeri), hukuki inceleme, kimlik doğrulama ve reşit olmayanlar için veli onayı gerekir. Açık kaynak kod güveni tek başına sağlamaz; para sağlayıcıda tutulmalıdır.

### Alan çeşitliliği ve "Seni tanıyalım" anketi (hackathon)

- Test ve tasarımın yanında sanat, müzik, kültür, ticaret ve oyun tasarımı için 5 yeni deneme görevi (sunucuda sözleşmeli, 3 ölçütlü). Görev meydanında alana göre sekmeler var.
- **Seni tanıyalım** sayfası (`#survey`, giriş gerekmez): yaş aralığı, 8 alan için ilgi + uygulama düzeyi, haftalık süre, Scola'da ne yapmak istediği, öğrenmek / öğretmek istedikleri, siteye puan ve not. Ad, e-posta, telefon, okul sorulmaz; kişi başına IP başına saatte 10 yanıt sınırı vardır.
- **Topluluk nabzı**: en az 3 yanıttan sonra yalnızca toplam sayılar ve ortalamalar gösterilir (serbest metin açık özette yok).
- Yöneticiler ham yanıtları görür ve CSV indirir (formül enjeksiyonuna karşı hücreler güvenli hazırlanır). Yanıt verileri `data/` altında, depo dışındadır.
- Reşit olmayanlar için: yaş yalnız aralık olarak alınır. Gerçek yayında açık rıza metni, veli bilgilendirmesi ve saklama süresi (KVKK) hukuken gözden geçirilmelidir.

### Yaşayan arayüz (`dist/assets/fun.js`)

- **Şu an Scola'da** paneli (ana sayfa): üye, açık görev, test emaneti, kabul edilen katkı ve anket sayacı; 8 saniyede bir yenilenen anonim olay akışı (`/api/pulse`, kişi kimliği içermez).
- **Keşif çarkı**: dönen çark bir alan seçer ve o alandan bir görev önerir.
- **Maskot**: gözler imleci izler, sayfaya göre ipucu balonu çıkar.
- XP kazanınca yüzen "+N XP", seviye atlayınca kutlama; kartlarda imleçle eğim, kademeli giriş, dönen hero kelimesi, kıvılcım patlamaları, paralaks.
- `prefers-reduced-motion` açıkken tüm hareketler kapanır (çark sonucu anında verir, otomatik balon çıkmaz). Bu katman yalnız süstür; XP, ödeme veya hak kararı vermez.

### Gelişim sistemi: Tohum → Fidan → Ağaç → Orman (v0.8)

- Sitenin Level sistemi oyundan **bağımsızdır** (ayrıntı: PRODUCT_MODEL.md). Hesap `dist/assets/growth.js` ile hem sunucuda (doğrulanmış) hem tarayıcıda (demo gösterimi) yapılır; kenar çubuğu, ana sayfa kartı ve "Aşamalar nasıl işler?" penceresi bunu kullanır.
- **Gelişim yolum** sayfası: aşama yolu, sıradaki adımın gereksinim çubukları, başlangıç rotası, mentör dizini ve talebi, mentörlük notları (puan vermez), çırak mentörlük, Ağaç adaylığı ve kör bağımsız değerlendirme kuyruğu, Ormanlar ve metrikleri.
- Sunucu: `server/growth.mjs`. Uç noktalar: `/api/me/growth`, `/api/me/route`, `/api/mentors`, `/api/mentorships`, `/api/tree-applications`, `/api/forests`, `/api/admin/users/:id/founding-tree`. Aşama olayları ve yönetici işlemleri denetim kaydına yazılır.
- Testler: `tests/growth.test.mjs` (eşikler, zaman, oyundan bağımsızlık, kapasite, bağımsız değerlendirme, Orman). Tarayıcıda tam akış (Tohum → Fidan başvurusu → iki bağımsız Ağaç onayı → Orman) betikle doğrulandı; zaman şartları geriye çekilmiş kayıtlarla hazırlandı.
- İlk Ağaçlar için yönetici, "Bağımsız inceleme" sayfasından **Kurucu Ağaç** atar.
- Sınırlar: eşikler pilot hipotezidir; Ağaçlar etkinlik dışı kalınca düşmez (ceza yok); sahte hesap halkasına karşı çırak mentörlüğün gerçek öğrenci katkısı şartı ve kör değerlendirme var ama kimlik doğrulama yoktur; mentörlük mesajlaşması yok (yalnız notlar).

### Scola Meydanı 3B (v0.7)

- **3B dünya (Three.js r170, MIT, `dist/assets/vendor/` içinde, internetsiz çalışır):** alçak poligonlu pastel stil, gerçek 3B binalar / ağaçlar / çeşme / portal / sandık, gündün-gece döngüsü (7 dk; gece pencereler yanar), bulutlar, 3B karakterler (yürüme, el sallama, dans emojileri), isim etiketi ve konuşma balonu. Kamera: fareyle sürükle / parmakla sürükle, tekerlek veya çimdikle yakınlaştır; WASD kameraya göre yürütür. Kamera engel arkasına geçince yaklaşır, bir binanın üstündeyken o bina kesit olarak gizlenir.
- "Basit görünüm" düğmesi 2B yedeğe geçer (WebGL yoksa otomatik). Aynı sunucu protokolü her iki görselleştiriciyi besler; sunucu 2B (x, y) tutar.
- **Tıkla-yürü yol bulur:** sunucuda A* (20 px ızgara + düzleştirme); ağaç, bina ve kapalı kapıları dolaşır, hedef binanın içindeyse en yakın serbest noktaya gider.
- **Yeni ekip odaları:** 🖌️ Renk Atölyesi (kırmızı/sarı/mavi pedler; iki kişi aynı anda doğru ikiliye basınca turuncu, yeşil, mor karışır; yanlış karışımda öğretici mesaj, 25 sn takılırsan ipucu) ve 🥁 Ritim Sahnesi (davullar sırayla çalınır, art arda aynı kişi çalamaz, 3 kalıp). **Hepsi en az 2 kişi ister**; tek kişi tamamlayamaz (testlerle doğrulandı).
- **Tanışma:** yakındaki 3 farklı kişiye "Merhaba" (cümle ya da 👋) dersen 🦋 Sosyal Kelebek damgası. 🤖 Rehber Pusula ilerlemene göre yön gösterir. 📒 Keşif Defteri damgaları ve ipuçlarını listeler.
- Damgalar: İlk Adım, Sosyal Kelebek, Ada Kaşifi, Renk Ustası, Ritim Ustası (XP vermez; kayıtlı üyelerde kalıcı).
- Testler: `tests/hub.test.mjs`, `tests/hub-rooms.test.mjs` (motor + SSE). Tarayıcıda yazılım WebGL ile iki oyunculu uçtan uca akış (3B Meydan, her oda, kamera, telefon) betikle doğrulandı; betik depoya eklenmedi. Gerçek GPU performansı bu ortamda ölçülemedi (yazılım çizimi yavaştır).

### Scola Meydanı: çok oyunculu hub (v0.6)

- Gerçek zamanlı 2B alan (`#hub`): giriş yapmadan misafir olarak da girilir; herkes aynı Meydan'da yürür, birbirini görür. Altyapı bağımlılıksız (SSE + POST); sunucu otoriterdir (konum, hız sınırı, çarpışma, kapı, damga kararları `server/hub.mjs`'de).
- **Binalar gerçek görevlere açılır:** Sanat Atölyesi, Kültür Müzesi, Müzik Sahnesi, Oyun Salonu, Pazar → yaklaşıp E'ye (ya da dokun) basınca ilgili görev açılır. Görev Panosu → Görev meydanı.
- **Gizemli Ada (iş birliği):** Kaşif Kapısı'ndan geçilir. Kapı, iki kişinin aynı anda iki plakaya (1,5 sn) basmasıyla açılır; tek başına açılamaz. Sonra 3 ipucu bulunur, sandık açılınca odadaki herkes **Ada Kaşifi** damgası alır. Oda 15 sn sonra yeniden kurulur. Damga XP değildir (oyunla XP farm edilmesin).
- **Güvenli sohbet:** serbest metin ve özel mesaj YOKTUR; yalnız 12 hazır cümle ve 8 emoji. Oyuncuya tıklayıp sessize alabilir ya da bildirebilirsin; bildirimler `/api/admin/hub-reports` ile yöneticiye gider. Misafirlere rastgele ad verilir; üyeler hesap adıyla görünür. Karakter: 8 renk × 10 yüz.
- Kontroller: WASD / ok tuşları, tıkla-git, telefonda sanal joystick, E ile etkileşim. "Yerler & kişiler" paneli klavye ile de kullanılabilir. Kapasite: Meydan 60, Ada 20 kişi; 3 dk hareketsiz oyuncu atılır.
- Sınırlar (3B dâhil): düşük donanımda 3B yavaş olabilir, "Basit görünüm" vardır; tek süreçli sunucu için tasarlandı (yatay ölçek için ortak durum/Redis gerekir); canvas oyunu ekran okuyucuya tam erişilebilir değildir (yedek: Yerler & kişiler listesi); hesapsız misafir damgaları sayfa yenilenince kaybolur; sunucu tarafı küfür/uygunsuz ad denetimi yoktur (serbest metin olmadığı için yalnız hesap adları risklidir).

## Çalışan özellikler (demo)

- Altı bölüm: keşif, görev meydanı, akademi, üretim alanı, topluluk, etki ve destek.
- Eğitim oluşturma / önizleme, uygulama çıktısı, yerel değerlendirme kaydı.
- Tester görevleri: kasıtlı hatalı oyun ve sepet prototipleri, etkileşim şartı, hata raporu teslimi.
- Her seviyeye açık büyük proje denemesi.
- XP, 6 seviye, tek seferlik ödüller, kendi eğitiminden XP kazanmayı engelleme.
- Proje görevleri, günlük, maliyet simülasyonu, plan ve ilerleme verisi indirme.
- Fon hazırlık haritası ve başvuru taslağı; seviye bağımsız erişim.
- Topluluk profilleri, çember ilgisi, profil düzenleme, etkinlik akışı.
- Oynanabilir devre bulmacası, kısa sürpriz görev, keşif rehberi, başarı kutlamaları.
- İndirilebilir ve yazdırılabilir A4 planlayıcı.
- Dokunmatik / mobil uyum, klavye erişimi, azaltılmış hareket tercihi.

## Mevcut sınır

Yerel pilot tek süreçli bir JSON dosya deposu kullanır; çok kullanıcılı canlı yayın için PostgreSQL gibi benzersiz kısıtlı bir veritabanına, e-posta doğrulamasına, şifre sıfırlamaya, reşit olmayanlar için veli onayına ve moderasyona geçilmelidir. Görevler eğitim amaçlı ücretsiz denemelerdir; ödeme sağlayıcısı, ücretli görev, eşleşme, eğitmen yayın onayı ve fon transferi yoktur. Eğitim, proje ve fon modülleri hâlâ `localStorage` demosudur. Örnek profiller gerçek kullanıcı değildir. Fon puanı kendi beyanına dayalı hazırlık göstergesidir; kişi / şirket değerlemesi değildir. Bu sınırlar arayüzde de belirtilir.

Kasıtlı test hataları: oyun sıfırlama zıplama sayısını sıfırlamaz; sepet sıfırlama toplamı güncellemez. Bunlar eğitim amaçlı senaryolardır; gerçek ürün hatası diye düzeltilmemelidir.

Önceki KIVILCIM tarayıcı verileri otomatik aktarılmaz. Yeni sürüm `scola-state` anahtarını kullanır. Gerçek backend'e geçerken veri alma / dışa aktarma ve onaylı göç tasarlanmalıdır.

## Kontroller

```
npm test
npm run check
```

`npm test` iki dosya çalıştırır. `tests/api.test.mjs`: hesap, rol, sözleşme, kör inceleme, revizyon, idempotent XP, halka engeli, itiraz, çıkar çatışması, CSRF ve kalıcılık. Smoke testleri: sayfa üretimi, çözülebilir oyun, XP tekilleştirme, tester çıktısı, eğitim uygulaması, kendi dersten XP engeli, maliyet sınırları, yeni başlayan fon hazırlığı, veri kaydı ve metin kaçışları.

v0.4'te Playwright (Chromium) ile 1440×900, 820×1180 ve 390×844 boyutlarında yatay taşma, kayıt → teslim → kör inceleme → kabul → doğrulanmış XP → portfolyo akışı ve Esc ile diyalog kapatma elle betiklenerek doğrulandı. Bu tarayıcı betiği depoya eklenmedi; ekran okuyucu testi yapılmadı.

## Dosya yapısı

- dist/index.html: uygulama kabuğu.
- dist/assets/scola.css: responsive tasarım.
- dist/assets/scola.js: örnek veri, yerel durum, görünüm ve etkileşimler.
- dist/assets/odak-haftasi.svg: çalışan örnek dijital ürün.
- scripts/server.mjs: bağımlılıksız yerel HTTP sunucusu (statik + /api).
- server/app.mjs: API, yetki ve XP kuralları.
- server/db.mjs: atomik JSON dosya deposu.
- server/missions.mjs: görev sözleşmeleri.
- tests/api.test.mjs: dikey akış testleri.
- tests/smoke.cjs: anlamlı akış kontrolleri.
- PRODUCT_MODEL.md: ürün ve topluluk ekonomisi.
- ROADMAP.md: gerçek platforma geçiş planı.
- AGENTS.md: Codex'in koruyacağı kurallar.

Geliştirme paketi sır, erişim anahtarı, Git kimlik bilgisi veya özel kullanıcı verisi içermez. Yayındaki Sites projesinin sahiplik manifesti taşınabilir pakete dahil edilmedi; bu paket bağımsız geliştirme içindir.
