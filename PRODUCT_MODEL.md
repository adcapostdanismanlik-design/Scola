# Scola ürün modeli

## Amaç

Gencin ilgi duyduğu alanda gelişmesi, somut üretime katılması, insanlardan öğrenmesi ve üretimin gelir fırsatına dönüşmesi. Platform ekip kurma, prototip, test, üretici koordinasyonu, teslim ve katkı kaydını kolaylaştırır. Gerçek üretimin hepsini otomatik üstlenebildiği iddia edilmez.

## Çekirdek döngü

İlgi seç → küçük faydalı görev → uygulamalı eğitim → katkı çıktısı → bağımsız değerlendirme → XP / alan itibarı → ekip ve ürün → test / satış planı → destek başvurusu.

Başlangıç: 10–20 dakikalık kontrollü görevler. Tekrarlanabilir hata raporu, üç ekranlık kullanılabilirlik denemesi, klavye erişim testi, anlaşılır metin, basit ölçülü çizim gibi işe yarayan çıktılar. Ücretsiz deneme açıkça sınırlandırılır; gerçek iş için ücret ve lisans önceden belirlenir.

## Üç ayrı ölçü

1. Deneyim seviyesi: doğrulanmış görev ve eğitim uygulamalarından alınan XP. Deneme prototipinde kişisel demo XP.
2. Alan itibarı: örneğin test, tasarım, eğitim. Bağımsız kalite, işe yarayan geri bildirim, katkı sürekliliği. Her alanda aynı uzmanlık varsayılmaz.
3. Proje hazırlığı: prototip, ihtiyaç, maliyet, ekip ve katkı kanıtı. İnsanların parasal değeri değildir.

## Gelişim sistemi: Tohum → Fidan → Ağaç → Orman

Sitenin Level sistemi **oyundan (Meydan, damgalar) bağımsızdır**. Yalnız bağımsız incelemede kabul edilen katkılar, zaman ve mentörlük kayıtları sayılır; takipçi, para harcama, ziyaret süresi, kendi kendine tamamlama ve oyun etkinliği sayılmaz. Tek doğruluk kaynağı `dist/assets/growth.js`'tir (sunucu ve tarayıcı aynı dosyayı kullanır). Eşikler **pilot hipotezidir**.

1. **🌰 Tohum:** başlangıç. Rota belirlenir (en fazla 2 alan + hedef; kilometre taşları doğrulanmış katkıdan ölçülür), isteyen bir mentör ister. Mentör şart değildir; mentörsüz yeni başlayan engellenmez.
2. **🌱 Fidan:** otomatik ve ölçülebilir yetkinlikle gelir: 200 XP, 3 kabul edilen katkı, 2 farklı alan, %60 kabul oranı (en az 3 karar), 7 günlük hesap. Bir kez Fidan olan geri düşmez. Fidan, çırak mentör olarak başkalarının yetişmesini izler.
3. **🌳 Ağaç ("Mentörler Birliği"):** sayılar tek başına yetmez. 700 XP, 8 kabul, 3 alan, %70 oran, 45 gün, en az 14 gün süren çırak mentörlük (öğrencisi o sürede gerçek bir kabul edilen katkı üretmiş olmalı) ve **iki bağımsız Ağaç**ın dört ölçütlü rubrikle onayı. Değerlendirme kördür; mentörlük bağı olan, çıkar çatışması beyan eden ve yakın zamanda karşılıklı onay vermiş kişiler değerlendiremez; bölünürse üçüncü Ağaç karar verir. Reddedilirse 30 gün sonra yeniden başvurulur. Ağaç, yeni tohumlara mentörlük eder (aynı anda en çok 5 öğrenci; tükenmişliği önler).
4. **🌲 Orman (topluluk):** kişisel seviye değil, en az 3 Ağacın kurduğu topluluktur (bir Ağaç en çok 2 ormanda). Metrikler: ağaç sayısı, barınan tohum, yetişen Fidan / Ağaç, son 30 günde aktif öğrenci oranı, en yüklü mentör, kapsanan alanlar. Durum: Filiz (<3 ağaç) / Gelişen / Sağlıklı (barınma, bağlılık ve yük dengesi). **Kişiler sıralanmaz, puanlanmaz, insanlara değer biçilmez.**

İlk Ağaçlar yokken **Kurucu Ağaç** yöneticice atanır (kayıtlı, şeffaf, geçici bir önyükleme; zamanla topluluğun yetiştirdiği Ağaçlar yerini alır). Hiçbir aşama eğitim açmanın, proje kurmanın, büyük işlere deneme başvurusunun ya da fon başvurusunun ön koşulu değildir. Meydan damgaları (İlk Adım, Sosyal Kelebek, Ada Kaşifi…) eğlence ve sosyal keşif içindir, seviyeyi etkilemez.

Önerilen keşif ağırlıkları: %40 kalite, %25 konu uyumu, %20 yeni üretici keşfi, %15 güncellik. Henüz uygulanmayan deneysel modeldir; gerçek sistemde içerik güvenliği ve kullanıcı tercihi gerekir. Düşük aşamalı kaliteli katkılar görünür kalır.

## Eğitim veren kullanıcılar

Seviye şartı yerine örnek beceri çıktısı, dar öğrenme hedefi, açık uygulama görevi, içerik / telif kontrolü. Öğrenci tamamlaması uygulama çıktısıyla değerlendirilir. Öğretmen itibarı yıldız ortalamasına indirgenmez; öğrencinin kazanımı, faydalı geri bildirim ve inceleme önemlidir. Kendi kursu, sahte öğrenci veya karşılıklı puan halkası ödül oluşturmaz.

## Yeni başlayan için büyük iş yolu

Daha büyük işler için isim / seviye gizlenebilen kısa ilk deneme; şeffaf kalite ölçütü; sınırlı çalışma süresi; gerçek üretim ise ödeme. Başarılı örnek katkı → destekli ilk rol → mentorluk → daha büyük sorumluluk. Eğitim veya fon başvurusunu yüksek seviye şartına bağlama.

## Fon ve değerleme

Örnek hazırlık haritası: prototip 30, kullanıcı ihtiyacı 25, maliyet / teslim 20, ekip 15, katkı kanıtı 10 puan. Yeni başlayan katkı geçmişi olmadan 90'a ulaşabilir. Demo kendi beyanıyla işaretlenir; canlı sistemde belge ve inceleme gerekir. 70 bir öneri eşiği, otomatik fon onayı değildir.

Destek: ilk numune, üretici kredisi, test / dağıtım desteği, proje bütçesi. Gerçek bütçe sponsor ve sözleşmeye bağlıdır. Aşamalı ödeme, teslim hedefi ve gelir / hak paylaşımı tanımlanmalı.

Şirket / ürün değerlemesi ayrı inceleme gerektirir: doğrulanmış talep, ürün, gelir, maliyet, fikri haklar ve risk. XP'nin paraya çevrilen sabit fiyatı yoktur. İnsanların değeri puanlanmaz.

## Platforma fayda

Görevler gerçek ürün geliştirme ve içerik kalitesine katkı sağlar. Katkı sahibi bunu açıkça bilir; ödeme / lisans şartı anlaşılır. Önerilen gelir seçenekleri: gerçek üretim koordinasyon hizmeti, eğitim / satış aracılık payı, sponsorlu görev programı. Oranlar ve ücretler belirlenmedi; uydurulmaz.

## Güven

Kanıt temelli onay, çıkar çatışması kaydı, itiraz, değerlendirici rotasyonu, öz değerlendirmeyi etki hesabından çıkarma, düşük maliyetli çoklu hesap ödül istismarı önleme. Reşit olmayan kullanıcılar, iletişim ve ödeme düzeni için uygun onay ve moderasyon tasarlanmalı; prototipte gerçek ödeme yok.
