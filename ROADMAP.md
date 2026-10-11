# Gerçek Scola'ya geçiş

## Aşama 1 — İlk gerçek katkı döngüsü

**Durum (v0.4):** yerel pilotta hesap, roller, görev sözleşmesi, teslim, kör bağımsız inceleme, revizyon, itiraz, çıkar çatışması, idempotent sunucu XP'si ve denetim kaydı çalışıyor. Kalan: kalıcı veritabanı seçimi, e-posta doğrulama / şifre sıfırlama, veli onayı, moderasyon paneli, localStorage içe aktarma.

- Mevcut UI ve oyunları tarayıcıda QA.
- Hesap, oturum, profil; üretici / eğitmen / değerlendirici / yönetici rolleri.
- Veritabanı: User, Skill, Mission, Submission, Review, XPEvent, AuditLog.
- Görev sözleşmesi: kapsam, süre, kabul, ücret, içerik hakkı.
- Taslak → teslim → bağımsız inceleme → kabul / revizyon / itiraz.
- Sunucuda idempotent XP defteri; istemci puanı hak kazandırmasın.
- LocalStorage verisini kullanıcının onayıyla içe aktarma; demo XP'yi doğrulanmış XP'ye çevirmeme.

## Aşama 2 — İnsanlardan eğitim

- Course, Lesson, Enrollment, LearningOutput, TeacherReview.
- Eğitim içerik kontrolü, örnek çıktı, uygulama rubriği.
- Katılımcı çıktısı ve eğitmen geribildirimi.
- Kendi kursundan XP, sahte kayıt ve karşılıklı şişirmeye karşı kontroller.
- Video / dosya depolama ihtiyaçları geldiğinde güvenli yükleme altyapısı.

## Aşama 3 — Ekip ve ürün

- Project, Team, Role, Milestone, Evidence, ManufacturingQuote.
- Konu / beceri / müsaitlik eşleşmesi; LLM şart değil.
- Yeni başlayan açık deneme ve mentor yolu.
- Dijital teslim ve fiziksel üretici teklifi / numune / kalite / paketleme akışı.

## Aşama 4 — Etki ve keşif

- Deneyim, alan itibarı ve proje hazırlığını ayır.
- Katkı kalitesi ve yeni üretici keşif kontenjanı.
- İtiraz ve moderasyon paneli.
- İzlenme, takipçi veya para harcamadan etkiyi şişirmeme.

## Aşama 5 — Gerçek destek

- Sponsor / kaynak, bütçe, inceleme, sözleşme, teslim hedefi.
- Bağımsız çıkar çatışmasız değerlendirme.
- Gerçek ödeme sağlayıcısı ve gerekli hukuki / ticari şartlar belirlendikten sonra para akışı.
- Yeni başlayan açık başvuru; seviye tek başına eleme kriteri değil.
- Hazırlık puanı yatırım / kişi değeri gibi sunulmasın.

## Önerilen ilk kabul ölçütleri

Bir kullanıcı ücret ve kabul koşulları açık gerçek bir görev görür → çıktıyı teslim eder → başka yetkili değerlendirici inceleyebilir → kabul edilirse tek XP olayı doğar → kullanıcı kanıtını portfolyoda görür. Aynı teslimin ikinci kez kabulü ikinci ödül üretmez. Eğitmen kendi öğrencisi yerine kendisini değerlendiremez. Yeni katılımcı büyük görev denemesini açabilir.

Teknoloji değişimi aşamalı yapılmalı. Mevcut prototip statik JS; backend için kullanıcının ortamını öğrenip tek bir sürdürülebilir mimari seç. Ödeme veya özel servis bilgisi uydurma.
