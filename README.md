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
