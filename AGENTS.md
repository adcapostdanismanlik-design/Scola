# Scola geliştirme yönergesi

Önce README.md, PRODUCT_MODEL.md ve ROADMAP.md oku. Kullanıcının amacı basit tanıtım sayfası değil, yaşayan üretim ve öğrenme topluluğu platformudur. Mevcut çalışan akışları incele, sonra aşamalı geliştir.

## Korunacak kararlar

- Marka adı Scola. Arayüz Türkçe ve dokunmatik uyumlu.
- Hem dijital hem fiziksel ürünler; insanlardan öğrenme ve kullanıcıların eğitim açması temel işlev.
- LLM veya zorunlu uzun kişilik testi ekleme. Önce kural / beceri / tercih tabanlı eşleşme; gerekirse kullanıcı onaylı, LLM içermeyen ML.
- Eğitim sadece video izlemek değildir: uygulama çıktısı ve faydalı geri bildirim gerekir.
- Başlangıç görevleri işe yaramalı: test raporu, kullanılabilirlik bulgusu, erişilebilirlik denemesi, içerik düzeltmesi. Canlı görevlerde ücret, kapsam, kabul ve lisans koşulları önceden gösterilmeli.
- Yüksek seviye gerçek katkı geçmişini temsil etmeli; para harcama, takipçi sayısı veya kendi kendine eğitim tamamlama etki üretmemeli.
- Yeni başlayanlar büyük işlere çıktı / açık deneme üzerinden erişebilmeli. Seviye tek başına eğitim açma, proje kurma veya fon başvurusu engeli olmasın.
- İnsanlara parasal değer atama. Proje hazırlığı ile şirket / ürün değerlemesini ayrı tut.
- Fon ve görünürlükte bağımsız kalite incelemesi, yeni üretici keşfi ve çıkar çatışması kontrolü gerekli.
- Yerel demo ile gerçek işlemleri açık ayır. Sunucu yokken gerçek kullanıcı, gerçek fon, doğrulanmış katkı veya yayın iddiası üretme.
- Tekrarlı XP, kendi dersinden XP, değerlendirme halkası ve sınırsız ücretsiz deneme işi engellenmeli.
- Kullanıcı içeriklerini HTML'e kaçışlı aktar. Gerçek backend'e geçince bütün hak, XP ve para kontrolleri sunucu tarafına taşınmalı.
- Kasıtlı tester örneği hatalarını koru: bunlar öğrenme senaryolarıdır.

## Çalışma

Node 18+, bağımlılıksız statik prototip. `npm run dev` → 127.0.0.1:5175. `npm test`, `npm run check`. Tasarım değişikliğinde gerçek tarayıcıyla desktop/iPad/telefon ve klavye QA yap. Araç yoksa sınırı açık yaz.

Yeni mimariyi mevcut deneyimi silerek kurma. Önce küçük bir gerçek dikey akış: kimlik → görev → teslim → bağımsız değerlendirme → sunucu XP. Sonra eğitim, ekip ve fonlama.
