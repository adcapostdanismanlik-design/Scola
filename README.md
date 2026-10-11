# Scola — Codex geliştirme paketi

Gençlerin insanlardan öğrendiği, kendi eğitimlerini açtığı, gerçek ürün görevlerine katkı verdiği ve dijital / fiziksel ürünlerini ekiplerle büyüttüğü platformun çalışan prototipi.

## Başlat

Node.js 18 veya üzeri ile bu klasörde:

```
npm run dev
```

Tarayıcı: http://127.0.0.1:5175

Bağımlılık kurulumu gerekmez. Windows'ta BASLAT.bat da kullanılabilir. Hızlı inceleme için dist/index.html doğrudan açılabilir; kalıcı kayıt davranışı tarayıcıya göre değişebilir. Google Fonts yüklenmezse sistem yazı tipi kullanılır.

## Codex'e taşı

1. ZIP'i örneğin `D:\Scola` klasörüne çıkar. `package.json` doğrudan bu klasörde olmalı.
2. Codex'te bu klasörü çalışma projesi olarak aç.
3. `CODEX_BASLANGIC.md` içeriğini ilk talimat olarak kullan.
4. Codex önce `AGENTS.md`, `PRODUCT_MODEL.md` ve `ROADMAP.md` dosyalarını okusun.

## Çalışan özellikler

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

Bu bir çalışan ön yüz prototipidir. `localStorage` verileri yalnızca mevcut tarayıcıda tutar. Gerçek hesap, eşleşme, bağımsız doğrulama, eğitmen yayın onayı, ödeme, fon transferi veya sunucu veritabanı yoktur. Örnek profiller gerçek kullanıcı değildir. Fon puanı kendi beyanına dayalı hazırlık göstergesidir; kişi / şirket değerlemesi değildir. Bu sınırlar arayüzde de belirtilir.

Kasıtlı test hataları: oyun sıfırlama zıplama sayısını sıfırlamaz; sepet sıfırlama toplamı güncellemez. Bunlar eğitim amaçlı senaryolardır; gerçek ürün hatası diye düzeltilmemelidir.

Önceki KIVILCIM tarayıcı verileri otomatik aktarılmaz. Yeni sürüm `scola-state` anahtarını kullanır. Gerçek backend'e geçerken veri alma / dışa aktarma ve onaylı göç tasarlanmalıdır.

## Kontroller

```
npm test
npm run check
```

Smoke testleri: sayfa üretimi, çözülebilir oyun, XP tekilleştirme, tester çıktısı, eğitim uygulaması, kendi dersten XP engeli, maliyet sınırları, yeni başlayan fon hazırlığı, veri kaydı ve metin kaçışları.

Testler DOM taklidiyle işlev düzeyinde çalışır. Gerçek tarayıcı görsel QA yapılmadı. Masaüstü, iPad ve telefon boyutlarında Playwright veya mevcut tarayıcı araçlarıyla QA sonraki adımdır.

## Dosya yapısı

- dist/index.html: uygulama kabuğu.
- dist/assets/scola.css: responsive tasarım.
- dist/assets/scola.js: örnek veri, yerel durum, görünüm ve etkileşimler.
- dist/assets/odak-haftasi.svg: çalışan örnek dijital ürün.
- scripts/server.mjs: bağımlılıksız yerel HTTP sunucusu.
- tests/smoke.cjs: anlamlı akış kontrolleri.
- PRODUCT_MODEL.md: ürün ve topluluk ekonomisi.
- ROADMAP.md: gerçek platforma geçiş planı.
- AGENTS.md: Codex'in koruyacağı kurallar.

Geliştirme paketi sır, erişim anahtarı, Git kimlik bilgisi veya özel kullanıcı verisi içermez. Yayındaki Sites projesinin sahiplik manifesti taşınabilir pakete dahil edilmedi; bu paket bağımsız geliştirme içindir.
