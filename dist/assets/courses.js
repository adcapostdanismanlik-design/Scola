'use strict';
// Demo eğitimler (örnek içerik): modüllü dersler, etkileşimli araçlar, kendini yoklama, uygulama çıktısı ve rubrik.
// Eğitmenler ve içerik ÖRNEKTİR; gerçek kişi değildir. XP yalnız bu tarayıcıdaki demo ilerlemedir ve Gelişim (Level) sistemini etkilemez.
(()=>{
const AREAS=[['art','Sanat'],['culture','Kültür'],['music','Müzik'],['game','Oyun'],['trade','Ticaret'],['writing','Yazı'],['mentor','Mentörlük'],['start','Başlangıç'],['test','Test & ürün']];
window.COURSE_AREAS=AREAS;

const courses=[
/* ---------------- SANAT ---------------- */
{id:'color-palette',area:'art',level:'Başlangıç',title:'Renkleri karıştır, dengeli bir palet kur',desc:'Üç ana renkten ara renkleri karıştır; bir afiş için okunaklı, dengeli bir palet seç ve nedenini anlat.',
 teacher:'Defne · örnek eğitmen',role:'Sanat & tasarım',duration:'25 dk',xp:90,tag:'Sanat',art:'design',color:'#f0e3fb',
 outcome:'Sonunda: boyayla ara renkleri karıştırabilir, bir afiş için 3–4 renkli paleti nedenleriyle seçebilirsin.',
 syllabus:['Üç ana renk, üç ara renk','Sıcak, soğuk ve karşıt renkler','Dengeli palet: 60-30-10'],
 modules:[
  {title:'Üç ana renk, üç ara renk',body:['Boyayla çalışırken kırmızı, sarı ve mavi ana renk sayılır: onları başka renkleri karıştırarak elde edemezsin. İkisini karıştırınca ara renkler doğar: kırmızı + sarı = turuncu, sarı + mavi = yeşil, kırmızı + mavi = mor.','Dikkat: ekrandaki renkler ışıkla oluşur ve kuralları farklıdır. Bu derste boyayla çalışıyoruz.'],
   widget:{type:'colorMix',goal:'Yeşil'},
   checks:[{q:'Mor elde etmek için hangi iki ana renk karıştırılır?',options:['Kırmızı + Sarı','Sarı + Mavi','Kırmızı + Mavi'],answer:2,explain:'Kırmızı + Mavi = Mor. Kırmızı + Sarı turuncu, Sarı + Mavi yeşil verir.'}]},
  {title:'Sıcak, soğuk ve karşıt renkler',body:['Kırmızı, turuncu ve sarı sıcak renklerdir: yakın ve enerjik hissettirir. Mavi, yeşil ve mor soğuk renklerdir: daha sakin ve uzak görünür.','Renk çemberinde tam karşılıklı duran renkler karşıttır: kırmızı–yeşil, mavi–turuncu, sarı–mor. Yan yana gelince birbirini daha canlı gösterir; birbirine karıştırırsan griye döner.'],
   example:{good:'Koyu mavi zemin üstüne turuncu başlık: karşıt renkler, yazı net okunur.',bad:'Açık sarı zemin üstüne beyaz başlık: ikisi de açık, yazı kaybolur.',why:'Okunurluk için zemin ile yazı arasında açıklık–koyuluk farkı ya da karşıt renk ilişkisi gerekir.'},
   checks:[{q:'Mavi bir afiş zemininde hangi başlık rengi en kolay okunur?',options:['Koyu mavi','Turuncu','Mor'],answer:1,explain:'Turuncu mavinin karşıtıdır; hem renk hem açıklık farkı vardır. Koyu mavi ve mor zeminle karışır.'}]},
  {title:'Dengeli palet: 60-30-10',body:['Çok renk kullanmak paleti dengeli yapmaz. Pratik bir başlangıç kuralı: %60 baskın renk (zemin), %30 ikincil renk (büyük alanlar), %10 vurgu rengi (başlık, düğme).','3–4 renk çoğu zaman yeter. Her renk için bir nedenin olsun: ruh hali, okunurluk ya da konu.'],
   example:{good:'Robotik kulübü afişi: %60 koyu mavi zemin, %30 beyaz, %10 turuncu vurgu. Neden: teknoloji hissi, net okunurluk, dikkat çeken tek vurgu.',bad:'Her harfi başka renkle yazmak: göz yorulur, hiçbir şey öne çıkmaz.',why:'Vurgu azdır, çünkü her şey vurgulanırsa hiçbir şey vurgulanmaz.'},
   checks:[{q:'60-30-10 kuralında %10 neye ayrılır?',options:['Zemin rengine','Vurgu rengine','Gölgelere'],answer:1,explain:'%10 küçük bir vurgu içindir: başlık, düğme ya da tek bir dikkat noktası.'}]}],
 task:'Bir okul kulübü afişi (ya da sevdiğin bir oyun / ürün) için 3–4 renkli bir palet seç. Her rengin adını, yaklaşık yüzdesini ve neden seçtiğini yaz. Sonunda yazı ile zemin arasındaki okunurluğu nasıl kontrol ettiğini anlat.',
 rubric:['Renklerin yüzdeleri (60/30/10 gibi) yazılı','Her renk için bir neden var','En az bir karşıt ya da sıcak–soğuk ilişkisi kullandım','Yazı–zemin okunurluğunu kontrol ettim'],
 mission:'art-reading',meydan:'Renk Atölyesi: arkadaşlarınla renk karıştır'},

/* ---------------- KÜLTÜR ---------------- */
{id:'culture-document',area:'culture',level:'Başlangıç',title:'Bir hikâyeyi kaynağıyla belgele',desc:'Bir gelenek, yemek, oyun ya da hikâyeyi kaynağını belirterek, izne ve saygıya dikkat ederek yaz.',
 teacher:'Selim · örnek eğitmen',role:'Kültür & arşiv',duration:'20 dk',xp:90,tag:'Kültür',art:'desk',color:'#f7e4d3',
 outcome:'Sonunda: bilgiyi kaynağıyla yazar, anlatı ile iddiayı ayırır, kişisel bilgi ve izin konusunda doğru karar verirsin.',
 syllabus:['Kaynak nedir?','Anlatı ile iddiayı ayır','İzin, güvenlik ve saygı'],
 modules:[
  {title:'Kaynak nedir?',body:['Bir kültür belgesi, bilginin nereden geldiğini söylemekle değer kazanır. "Herkes bilir" kaynak değildir; "anneannem 2024\'te anlattı" kaynaktır.','Kaynağın adını yazarken izin verdiği kadarını yaz: "anneannem (Ege, 70\'li yaşlar)" yeterlidir. Tam ad, adres ve telefon yazma.'],
   widget:{type:'sort',title:'Hangisi kaynaklı bilgi, hangisi duyum?',a:'Kaynaklı',b:'Duyum / belirsiz',items:[
     {t:'"Dedem çocukken bu oyunu sokakta oynadığını anlattı." (anlatım, 2024)',ans:'a',why:'Kimden, ne zaman ve nasıl öğrenildiği belli.'},
     {t:'"Herkes bilir ki bu gelenek 500 yıllık."',ans:'b',why:'"Herkes" bir kaynak değildir ve 500 yıl iddiası doğrulanmamış.'},
     {t:'"Okul müzesindeki etikete göre bu alet 1950\'lerden kalma."',ans:'a',why:'Kaynak (etiket) ve yeri belirtilmiş; tekrar bakılabilir.'},
     {t:'"İnternette bir yerde okudum, bu oyunu ilk Romalılar bulmuş."',ans:'b',why:'Hangi site olduğu belli değil; doğrulanamaz.'},
     {t:'"Köydeki bir usta (adını vermek istemedi) kilim motifinin anlamını böyle anlattı."',ans:'a',why:'Kaynak adı gizli olsa da kim olduğu türüyle belli ve izinli.'}]}},
  {title:'Anlatı ile iddiayı ayır',body:['"Dedem şöyle anlattı" bir anlatıdır; doğru bir kayıttır. "Bu gelenek üç yüz yıllıktır" ise bir iddiadır ve kanıt ister.','Bir şeyi bilmiyorsan "bilmiyorum" ya da "kaynağı henüz bulamadım" yaz. Uydurma bir bilgi eklemek, belgeyi değersiz yapar.'],
   example:{good:'"Annem, bu tatlının bayramda yapıldığını söyledi. Tarifin kaç yıllık olduğunu bilmiyorum."',bad:'"Bu tatlı yüzlerce yıldır bayramda yapılır ve en eski Anadolu tatlısıdır."',why:'İkincisi kanıtsız büyük iddialar içeriyor. Birincisi bildiğini ve bilmediğini ayırıyor.'},
   checks:[{q:'Hangisi iddia olduğu için kaynak ister?',options:['"Büyükannem bu oyunu çocukken oynadığını söyledi."','"Bu oyun dünyanın en eski oyunudur."','"Oyunu bahçede dört kişiyle oynarız."'],answer:1,explain:'"En eski" bir iddiadır ve kanıt gerektirir. Diğerleri gözlem ya da anlatımdır.'}]},
  {title:'İzin, güvenlik ve saygı',body:['Birinin hikâyesini yazmadan önce ondan izin iste. Fotoğraf eklemek için ayrıca izin gerekir; çocuk fotoğrafı ve kişisel bilgileri (adres, telefon) paylaşma.','Bazı konular bir topluluk için kutsal ya da özeldir. Saygıyla yaz, yanlış temsil etmemeye çalış ve emin değilsen sor.'],
   checks:[{q:'Komşunun doğum günü fotoğrafını belgene eklemek istiyorsun. Ne yaparsın?',options:['Ekler, kaynak olarak "komşu" yazarım.','Ondan (çocuksa velisinden) izin isterim; izin yoksa eklemem.','Yüzlerini bulanıklaştırıp izin istemeden eklerim.'],answer:1,explain:'Fotoğraf için açık izin gerekir. İzin yoksa eklenmez; bulanıklaştırmak izin yerine geçmez.'}]}],
 task:'Bulunduğun yerden bir gelenek, yemek, oyun ya da hikâyeyi 120–180 kelimeyle yaz. Kimden öğrendiğini belirt. Hangi cümlelerin anlatım, hangilerinin iddia olduğunu işaretle ve bilmediğin bir şeyi açıkça "bilmiyorum" diye yaz.',
 rubric:['Kaynağı (kimden / nereden) belirttim','Anlatım ile iddiayı ayırdım','Bilmediğimi uydurmadım','Kişisel bilgi (tam ad, adres, telefon) yazmadım'],
 mission:'culture-story',meydan:'Kültür Müzesi ve Pusula ile sohbet'},

/* ---------------- MÜZİK ---------------- */
{id:'rhythm-basics',area:'music',level:'Başlangıç',title:'Ritmi duy, kalıbı yaz',desc:'Vuruş, tempo ve ölçüyü kendi yaptığın 8 adımlık bir kalıpla öğren; ritmi yazıya dök ve arkadaşınla dönüşümlü çal.',
 teacher:'Mina · örnek eğitmen',role:'Müzik',duration:'20 dk',xp:80,tag:'Müzik',art:'game',color:'#e1ecf8',
 outcome:'Sonunda: 4/4 ölçüsünü tanır, 8 adımlık bir ritim kalıbını yazar ve bir arkadaşınla dönüşümlü çalacak biçimde bölüştürürsün.',
 syllabus:['Vuruş, tempo, ölçü','Kalıbı yazmak','Birlikte çalmak'],
 modules:[
  {title:'Vuruş, tempo, ölçü',body:['Vuruş, müziğin düzenli nabzıdır; ayak ucunla tutabildiğin tempodur. Tempo, bir dakikadaki vuruş sayısıdır (BPM). 4/4 ölçüde her ölçüde dört vuruş vardır ve ilki en güçlüdür.','Aşağıda bir ölçü sekiz adıma bölünmüş (her vuruş iki adım). İstediğin adımları aç, "Çal"a bas ve tempoyu değiştir.'],
   widget:{type:'rhythm'},
   checks:[{q:'4/4\'lük bir ölçüde kaç vuruş vardır?',options:['Üç','Dört','Sekiz'],answer:1,explain:'4/4: her ölçüde dört vuruş. Sekiz adım ise bu dört vuruşun ikişer parçaya bölünmüş hâlidir.'}]},
  {title:'Kalıbı yazmak',body:['Ritmi kâğıda dökmek için basit bir gösterim: "x" bir vuruş, "." sessizlik. Örneğin "x.|x.|..|x." her vuruş için iki adımı gösterir.','Kalıbı yazmanın faydası, başkasının da çalabilmesidir. İyi bir kalıp tekrar eder; tekrar, dinleyenin ritmi tanımasını sağlar.'],
   example:{good:'"x.|x.|x.|x." dört düzgün vuruş. Basit, başlamak için ideal.',bad:'"x" tek başına: kaç adım, nerede sessizlik, belirsiz.',why:'Kalıp, başkası okuyunca aynı sesi çıkarabileceği kadar açık olmalı.'},
   checks:[{q:'"x.|..|x.|.." kalıbında kaç vuruş (x) var?',options:['2','4','8'],answer:0,explain:'İki "x" var; diğerleri sessizlik. Ritimde sessizlik de kalıbın parçasıdır.'}]},
  {title:'Birlikte çalmak',body:['Birlikte çalarken en önemli beceri dinlemektir: kendi sesinden çok tempoyu duy. Dönüşümlü çalacaksanız önceden "ben 1 ve 3, sen 2 ve 4" gibi bölüşün.','Meydan\'daki Ritim Sahnesi tam bunu ister: davullar sırayla çalınır ve art arda aynı kişi çalamaz. Bu bir ekip işidir.'],
   checks:[{q:'İki kişi dönüşümlü çalacaksınız ama tempoyu kaçırıyorsunuz. İlk ne yaparsın?',options:['Daha yüksek sesle çalarım.','Dur, tempoyu birlikte ayakla/alkışla tutup yeniden başlarız.','Diğer kişiyi suçlarım.'],answer:1,explain:'Önce ortak nabzı bulun. Tempo oturunca bölüşüm kolaylaşır.'}]}],
 task:'Kendi 8 adımlık ritim kalıbını "x" ve "." ile yaz. Tempoyu ve bir ruh halini (sakin, enerjik…) belirt. Bir arkadaşınla dönüşümlü çalacak olsaydınız bölüşümü nasıl yapardınız? Neden?',
 rubric:['Kalıp 8 adım ve açık (x / .)','Tempoyu (BPM) yazdım','Bir ruh hali belirttim','İki kişi için net bir bölüşüm önerdim'],
 mission:'music-listen',meydan:'Ritim Sahnesi: gerçek davullar, gerçek ekip'},

/* ---------------- OYUN ---------------- */
{id:'one-mechanic',area:'game',level:'Orta',title:'Tek mekanikli bir oyun tasarla',desc:'Eylem, kural ve geri bildirimi tek bir mekanikte topla; kâğıt üzerinde bir arkadaşınla dene ve gözlemle.',
 teacher:'Kerem · örnek eğitmen',role:'Oyun tasarımı',duration:'25 dk',xp:100,tag:'Oyun',art:'game',color:'#dcefe6',
 outcome:'Sonunda: bir mekaniği (eylem + kural + sonuç) açıkça tanımlar, geri bildirimini tasarlar ve kâğıtta test edersin.',
 syllabus:['Mekanik nedir?','Geri bildirim ve zorluk','Kâğıt üzerinde dene'],
 modules:[
  {title:'Mekanik nedir?',body:['Mekanik, oyuncunun yaptığı bir eylem ile oyunun ona verdiği sonuçtur. "Zıpla → platforma in → puan kazan" bir mekanik döngüsüdür.','İyi oyunlar çok mekanik değil, bir mekaniği iyi yapar. Önce tek bir eylem seç ve ona bağlı bir kural yaz.'],
   checks:[{q:'Hangisi bir mekaniktir (eylem + kural + sonuç)?',options:['Oyunun kahramanı cesur bir kedidir.','Düğmeye basınca yer çekimi tersine döner; tavana değersen kaybedersin.','Oyun mor ve turuncu renklerden oluşur.'],answer:1,explain:'İkincisinde eylem (bas), kural (yer çekimi tersine döner) ve sonuç (tavana değersen kaybedersin) var. Diğerleri tema ve görünüm.'}]},
  {title:'Geri bildirim ve zorluk',body:['Oyuncu ne olduğunu hemen anlamalı: ses, ışık, sayı ya da hareketle. Geri bildirim yoksa oyuncu kuralı çözemez ve sıkılır.','Zorluk da kademeli olmalı: ilk 30 saniye öğretir, sonra yavaşça zorlaşır.'],
   example:{good:'Doğru kapıya basınca yeşil ışık yanar ve "ding" sesi çıkar; yanlışta kırmızı ve kısa bir titreme.',bad:'Doğru da yanlış da aynı sessiz ekran; oyuncu ne yaptığını bilmez.',why:'Oyuncu eyleminin sonucunu görmeli; yoksa öğrenemez.'},
   checks:[{q:'Bir bulmaca oyununda oyuncu yanlış hamle yapıyor ama hiçbir şey olmuyor. En iyi düzeltme?',options:['Oyunu daha zor yap.','Yanlış hamlede kısa bir ses ve görsel işaret ekle.','Kuralları gizle.'],answer:1,explain:'Geri bildirim, oyuncunun hatasından öğrenmesini sağlar.'}]},
  {title:'Kâğıt üzerinde dene',body:['Kod yazmadan önce kâğıtla dene: kareler çiz, kalem pul olsun, bir arkadaşın oyuncu olsun. Hiçbir şeyi açıklama; sadece izle ve not al.','Not alacakların: nerede takıldı, neyi yanlış anladı, ne zaman güldü, ne zaman bıraktı. Bunlar senin gerçek test verindir.'],
   checks:[{q:'Arkadaşın kuralı yanlış anlıyor. İlk tepkin ne olmalı?',options:['Hemen doğru kuralı anlatırım.','Sessizce izler, nerede yanlış anladığını not alırım.','Testi iptal ederim.'],answer:1,explain:'Yönlendirirsen gerçek sorunu göremezsin. Gözlemle ve sonra kuralı netleştir.'}]}],
 task:'Tek bir oyun mekaniği için bir "mekanik kartı" yaz: oyuncu eylemi, kural, kazanma/kaybetme, geri bildirim (ses / ışık / sayı) ve ilk 30 saniyede ne olduğu. Kâğıtta bir kişiyle dene ve gözlemini (nerede takıldı?) ekle.',
 rubric:['Eylem + kural + sonuç yazılı','Bir geri bildirim biçimi seçtim','İlk 30 saniyeyi anlattım','Bir kişiyle denedim ve gözlemimi yazdım'],
 mission:'game-idea',meydan:'Oyun Salonu ve Meydan\'da kuralları denemek için arkadaş bul'},

/* ---------------- TİCARET ---------------- */
{id:'small-profit',area:'trade',level:'Orta',title:'Küçük bir ürünün kâr hesabı',desc:'Maliyet, fiyat ve sabit gideri hesapla; başa baş noktasını bul ve riskini yaz.',
 teacher:'Zeynep · örnek eğitmen',role:'Girişimcilik',duration:'25 dk',xp:100,tag:'Ticaret',art:'desk',color:'#f6edd3',
 outcome:'Sonunda: bir ürün için kâr/zarar ve başa baş adedini hesaplar, fiyatını gerekçelendirir ve bir riski adlandırırsın.',
 syllabus:['Maliyet, fiyat, kâr','Başa baş noktası','Müşteri değeri ve risk'],
 modules:[
  {title:'Maliyet, fiyat, kâr',body:['Birim maliyet, bir ürünü yapmanın (malzeme + ambalaj) senden istediği paradır. Sabit gider, kaç ürün satarsan sat ödediğin şeydir (tezgâh, kalıp, baskı).','Kâr = (fiyat − birim maliyet) × satılan adet − sabit gider. Aşağıdaki hesaplayıcıyla oynayıp neyin neyi değiştirdiğini gör.'],
   widget:{type:'profit',defaults:{price:50,cost:20,qty:30,fixed:600}}},
  {title:'Başa baş noktası',body:['Başa baş, ne kâr ne zarar ettiğin adettir: sabit gider ÷ (fiyat − birim maliyet), yukarı yuvarlanır. Bu adetten az satarsan zarar edersin.','Örnek: fiyat 50 ₺, birim maliyet 20 ₺, sabit gider 600 ₺ → 600 ÷ 30 = 20 adet.'],
   widget:{type:'profit',defaults:{price:50,cost:20,qty:20,fixed:600}},
   checks:[{q:'Fiyat 40 ₺, birim maliyet 15 ₺, sabit gider 500 ₺. Başa baş kaç adet?',options:['12','20','25'],answer:1,explain:'500 ÷ (40 − 15) = 500 ÷ 25 = 20 adet.'}]},
  {title:'Müşteri değeri ve risk',body:['Fiyat yalnızca "maliyet + kâr" değildir: müşteri senin ürününe ne değer veriyor? Hedef müşterini adlandır ve fiyatını onun gözünden düşün.','Riski küçük başlat: az sayıda üret, sat, öğren. Satılmayan stok en büyük risktir. Ürün hakkında abartılı iddia yapma; dürüst ol. Gençler için satış yapmadan önce okul/veli bilgisi ve izni önemlidir.'],
   checks:[{q:'Ürünün için en akıllıca ilk adım hangisi?',options:['Hemen 500 adet üretmek.','Önce 20 adetlik küçük bir parti satıp müşteri tepkisini görmek.','Fiyatı rakibin yarısı yapmak.'],answer:1,explain:'Küçük partiyle hem riskini sınırlar hem de gerçek veri toplarsın.'}]}],
 task:'Kendi küçük ürünün (bilezik, çıkartma, ev yapımı sabun…) için hedef müşteriyi, fiyatı, birim maliyeti ve sabit gideri yaz. Başa baş adedini ve 20 adet satarsan kârını hesapla. Bir riski ve onu nasıl küçülteceğini belirt.',
 rubric:['Hedef müşteri net','Rakamlar yazılı ve hesap tutarlı','Başa baş adedini hesapladım','Bir risk ve önlemi yazdım'],
 mission:'trade-pitch',meydan:'Pazar'},

/* ---------------- YAZI ---------------- */
{id:'plain-writing',area:'writing',level:'Başlangıç',title:'Karışık metni sade yaz',desc:'Ağır cümleleri okuyanın anlayacağı kısa cümlelere çevir; bilmediğini uydurma.',
 teacher:'Burak · örnek eğitmen',role:'İçerik & yazı',duration:'15 dk',xp:70,tag:'Yazı',art:'design',color:'#e8efd9',
 outcome:'Sonunda: ağır bir metni okuyucunun ne olacağını, ne zaman olacağını ve ne yapması gerektiğini anladığı üç kısa cümleye çevirirsin.',
 syllabus:['Okuyan kim, ne yapmalı?','Ağır sözcükleri bul','Bilmediğini uydurma'],
 modules:[
  {title:'Okuyan kim, ne yapmalı?',body:['Yazmadan önce sor: bunu kim okuyacak ve okuyunca ne yapması gerekiyor? İyi metin okuyucunun üç sorusuna yanıt verir: Ne olacak? Ne zaman? Ben ne yapmalıyım?'],
   checks:[{q:'Bir başvuru ekranında en önemli bilgi hangisidir?',options:['Sürecin hukuki adı.','Başvurunun alındığı ve sonraki adım (ne olacak, ne zaman, sen ne yapacaksın).','Kurumun geçmişi.'],answer:1,explain:'Okuyucu önce kendi durumunu ve sıradaki adımını bilmek ister.'}]},
  {title:'Ağır sözcükleri bul',body:['"Müteakip", "tarafınıza", "sağlanacaktır" gibi sözcükler cümleyi uzatır ve resmî gösterir ama anlaşılmayı zorlaştırır. Günlük karşılıkları genelde daha iyidir: sonra, sana, yapacağız.','Aşağıdaki cümlede ağır bulduğun sözcüklere dokun, sonra kontrol et.'],
   widget:{type:'jargon'}},
  {title:'Bilmediğini uydurma',body:['Metin sade olurken dürüst de olmalı. Süre belli değilse "yakında" ya da uydurma bir gün yazma; "Süre henüz belli değil, belli olunca haber vereceğiz" de.','Sade yazmak, bilgiyi eksiltmek değil, onu anlaşılır kılmaktır.'],
   example:{good:'"Başvurunu aldık. İncelemeyi bitirince sana e-posta ile haber vereceğiz. Süre henüz belli değil; şimdilik bir şey yapman gerekmiyor."',bad:'"Başvurunuz 3 iş günü içinde kesinlikle sonuçlandırılacaktır." (süre bilinmiyorsa)',why:'Bilinmeyen bir süre vaat etmek okuyucuyu yanıltır.'},
   checks:[{q:'Sonuç süresini bilmiyorsun. En iyi cümle hangisi?',options:['"En geç yarın dönüş yapılacaktır."','"Süre henüz belli değil; belli olunca haber vereceğiz."','"Dönüş yapılacaktır."'],answer:1,explain:'Bilmediğini açıkça söylemek, yanlış söz vermekten daha güvenilirdir.'}]}],
 task:'Şu cümleyi sade, üç kısa cümleye çevir: "Başvurunuzun değerlendirme sürecinin tamamlanmasını müteakip tarafınıza geri dönüş sağlanacaktır." Süreyi bilmediğini varsay ve uydurma.',
 rubric:['Üç kısa cümle yazdım','Ne olacağı, ne zaman ve ne yapılacağı anlaşılıyor','Süreyi uydurmadım','Günlük sözcükler kullandım'],
 mission:'copy',meydan:null},

/* ---------------- MENTÖRLÜK ---------------- */
{id:'mentor-basics',area:'mentor',level:'Fidan için',title:'Yoldaşlık etmek: iyi mentör nasıl olur?',desc:'Fidanlar ve çırak mentörler için: yol göstermek, gözlem notu yazmak ve sınırları bilmek.',
 teacher:'Elif · örnek içerik',role:'Mentörlük',duration:'30 dk',xp:120,tag:'Fidan için',art:'design',color:'#e5f1de',
 outcome:'Sonunda: mentör ile öğretmen rolünü ayırır, yargılamayan bir gözlem notu yazar ve gençlerle çalışırken sınırları bilirsin.',
 syllabus:['Mentör ne yapar, ne yapmaz?','Gözlem notu yazmak','Sınırlar ve güvenlik'],
 modules:[
  {title:'Mentör ne yapar, ne yapmaz?',body:['Mentör yol gösterir: soru sorar, örnek verir, kaynak önerir. İşi öğrencinin yerine yapmaz, ona puan ya da XP vermez, ücret istemez.','Bir Ağaç aynı anda en fazla 5 öğrenciyle çalışır: derinlemesine ilgilenmek ve tükenmemek için.'],
   checks:[{q:'Öğrencin raporunu yazmakta zorlanıyor. Mentör olarak ne yaparsın?',options:['Raporu senin yazarsın, çünkü daha hızlı.','Sorular sorarsın: "Hangi adımları denedin? Beklediğin neydi?" ve kendi yazmasını beklersin.','"Bu işi bırak" dersin.'],answer:1,explain:'Mentörlük, öğrencinin kendi çıktısını geliştirmesine yardım etmektir; işi onun yerine yapmak büyümeyi engeller.'}]},
  {title:'Gözlem notu yazmak',body:['İyi bir not üç parça içerir: Durum (ne gördün), Etki (bu neye yol açıyor) ve Sonraki adım (bir sonraki küçük deneme). Kişiyi değil, çıktıyı değerlendir.'],
   example:{good:'"Raporunda adımlar sıralıydı. Beklenen sonuç eksikti; bunu eklersen geliştirici sorunu tekrar üretebilir. Bir sonraki raporda “beklenen” bölümünü dene."',bad:'"Rapor çok kötüydü, daha dikkatli ol."',why:'İlk not neyin iyi, neyin eksik olduğunu ve bir sonraki adımı gösterir; ikincisi yargılar ve yol göstermez.'},
   checks:[{q:'Hangi not daha iyi bir mentör notudur?',options:['"Yeterli değil."','"Başlığı net yazmışsın. Etkiyi yazmamışsın; bunu eklersen öncelik belli olur. Dene."','"Başkaları senden iyi."'],answer:1,explain:'İkincisi durum, etki ve sonraki adımı içeriyor.'}]},
  {title:'Sınırlar ve güvenlik',body:['Gençlerle mentörlükte sınırlar nettir: kişisel bilgi (adres, telefon) istenmez, özel kanala taşınmaz, hediye/para konuşulmaz. Rahatsız eden bir durum olursa dur, platformdan bildir ve bir yetişkine söyle.','Sorun yaşayan bir öğrenci sana özel bir şey anlatırsa dinle, ama tek başına çözmeye çalışma; güvenilir bir yetişkine ve platforma ulaşın.'],
   checks:[{q:'Öğrencin "telefon numaranı ver, oradan konuşalım" diyor. Ne yaparsın?',options:['Verir, konuşmak daha kolay olur.','Nazikçe platformdaki notlar ve görevler üzerinden devam edeceğimizi söylerim; ısrar ederse bildirim yaparım.','Cevap vermeden bırakırım.'],answer:1,explain:'Kişisel iletişim bilgisi paylaşılmaz. Nazik ama net ol; ısrar eden bir durum bildirilir.'},
           {q:'Yetişkin biri sana "öğrencilerine özel hediye vereyim" diyor. Doğru yaklaşım?',options:['Olur, güzel jest.','Hayır; mentörlükte hediye/para konuşulmaz. Durumu platforma bildiririm.','Kimseye söylemem.'],answer:1,explain:'Hediye ve para, güç dengesizliğini ve manipülasyon riskini artırır.'}]}],
 task:'Hayali bir öğrencinin şu raporunu düşün: "Oyunda sıfırla düğmesi çalışmıyor." Bu raporu geliştirmesi için 3–4 cümlelik bir gözlem notu yaz: durum, etki ve sonraki adım. Yargılayıcı olma.',
 rubric:['Durumu (ne gördüm) yazdım','Etkiyi açıkladım','Bir sonraki küçük adımı önerdim','Kişiyi değil çıktıyı değerlendirdim'],
 mission:null,meydan:null,growth:true},

/* ---------------- BAŞLANGIÇ ---------------- */
{id:'first-week',area:'start',level:'Başlangıç',title:'İlk hafta: rota, mentör, ilk katkı',desc:'Tohumdan Fidan\'a giden yola nasıl başlarsın? Rotanı belirle, mentörüne iyi bir mesaj yaz ve ilk katkını seç.',
 teacher:'Pusula ekibi · örnek içerik',role:'Başlangıç',duration:'15 dk',xp:60,tag:'Buradan başla',art:'desk',color:'#ece6f7',
 outcome:'Sonunda: bir rota planın, mentöre yazılacak net bir mesajın ve ilk katkı hedefin olur.',
 syllabus:['Dört aşama','Rotanı seç','Mentöre yazmak'],
 modules:[
  {title:'Dört aşama',body:['🌰 Tohum ile başlarsın, 🌱 Fidan yetkinlik kazanınca, 🌳 Ağaç Mentörler Birliği\'nde yeterlilik gösterince olur; 🌲 Orman ise Ağaçların kurduğu topluluktur.','Bu sistem oyundan bağımsızdır: Meydan\'daki damgalar seviyeni değiştirmez. Seviyen yalnız bağımsız incelemede kabul edilen katkılarından, zamandan ve mentörlük kayıtlarından gelir.'],
   checks:[{q:'Meydan\'da bir damga kazandın. Seviyen değişir mi?',options:['Evet, her damga XP verir.','Hayır; seviye yalnız doğrulanmış katkı, zaman ve mentörlük kayıtlarından oluşur.','Yalnız Ada Kaşifi damgası değiştirir.'],answer:1,explain:'Damgalar eğlence ve sosyal keşif içindir; Gelişim sisteminden bağımsızdır.'}]},
  {title:'Rotanı seç',body:['En fazla iki alan seç (ör. sanat + kültür) ve bir hedef yaz: "Resim yapıp bir sergi açmak". Rotadaki kilometre taşları doğrulanmış katkından ölçülür: ilk kabul, ikinci kabul, mentör notu, topluluk görevi.','Küçük başla: tek alanda ilk katkını ver, sonra ikinci alanı dene.'],
   checks:[{q:'İlk haftada hedefin için en uygun plan hangisi?',options:['Sekiz alanda birden görev yapmak.','İki alan seçmek, bir alanda ilk katkıyı vermek ve bir mentör istemek.','Yalnız eğitim izleyip görev yapmamak.'],answer:1,explain:'Odaklı başlamak ve uygulamak hem gelişimi hem öğrenmeyi hızlandırır.'}]},
  {title:'Mentöre yazmak',body:['Mentör dizininden bir Ağaç seç ve ona kısa, net bir mesaj gönder: kim olduğunu, hedefini ve ondan ne beklediğini yaz.'],
   example:{good:'"Merhaba, ben Ada. Sanat ve kültür alanında ilerlemek istiyorum; ilk katkımı verdim. Haftada bir kısa geri bildirim verir misin?"',bad:'"Mentör olur musun?"',why:'İlk mesaj mentörün karar vermesini kolaylaştırmalı: hedef, durum ve istek.'},
   checks:[{q:'Mentöre yazacağın ilk mesajda hangisi olmalı?',options:['Yalnız "merhaba".','Hedefin, şu anki durumun ve ondan ne istediğin.','Telefon numaran.'],answer:1,explain:'Net bir mesaj mentöre karar vermesi için yeterli bilgi verir. Telefon numarası paylaşılmaz.'}]}],
 task:'Kendi başlangıç planını yaz: hedefin, seçtiğin 1–2 alan, ilk katkı için seçeceğin görev ve mentörüne göndereceğin ilk mesaj (3–4 cümle).',
 rubric:['Hedefimi yazdım','1–2 alan seçtim','İlk görevimi seçtim','Mentör mesajım net (hedef, durum, istek)'],
 mission:'copy',meydan:null,growth:true}
];

/* mevcut örnek eğitimlere alan ve düzey bilgisi */
const meta={testing:['test','Başlangıç'],prototype:['test','Orta'],teach:['mentor','Başlangıç']};
for(const c of coursesBase)if(meta[c.id]){c.area=meta[c.id][0];c.level=meta[c.id][1]}
coursesBase.push(...courses);

/* ---------- Etkileşimli araçlar ---------- */
const $q=(s,r=document)=>r.querySelector(s);
let rhythmTimer=0,audio=null;
function stopRhythm(){clearInterval(rhythmTimer);rhythmTimer=0;$q('#rwPlay')&&($q('#rwPlay').textContent='▶ Çal')}
const modal0=document.getElementById('modal');if(modal0)modal0.addEventListener('close',stopRhythm);

const widgets={
 colorMix:{html:w=>`<div class="cw" id="cwBox"><p class="cw-goal">Hedef: <strong>${esc(w.goal)}</strong> renk elde et. Boya kaplarına dokun (en fazla üç).</p><div class="cw-pots">${[['kirmizi','Kırmızı','#e5484d'],['sari','Sarı','#f5d90a'],['mavi','Mavi','#3e63dd']].map(([k,n,c])=>`<button class="cw-pot" data-c="${k}" style="background:${c}" aria-label="${n}" aria-pressed="false">${n}</button>`).join('')}</div><div class="cw-mix"><span id="cwA" class="cw-dot"></span>+<span id="cwB" class="cw-dot"></span>=<span id="cwR" class="cw-dot big"></span></div><p id="cwMsg" class="cw-msg" role="status">Karıştırmak için iki renk seç.</p><button class="text-btn" id="cwReset">Temizle</button></div>`,
  init(w){const sel=[],map={'kirmizi,sari':['Turuncu','#f08a24'],'mavi,sari':['Yeşil','#30a46c'],'kirmizi,mavi':['Mor','#8e4ec6']},col={kirmizi:'#e5484d',sari:'#f5d90a',mavi:'#3e63dd'},nm={kirmizi:'Kırmızı',sari:'Sarı',mavi:'Mavi'};
   const paint=()=>{document.querySelectorAll('.cw-pot').forEach(b=>{const on=sel.includes(b.dataset.c);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    $q('#cwA').style.background=sel[0]?col[sel[0]]:'#eee';$q('#cwB').style.background=sel[1]?col[sel[1]]:'#eee';
    let name='',c='#eee',msg='Karıştırmak için iki renk seç.';
    if(sel.length===1){name=nm[sel[0]];c=col[sel[0]];msg=`${name}: bir ana renk, karıştırmaya gerek yok. Bir tane daha seç.`}
    else if(sel.length===2){const k=[...sel].sort().join(',');[name,c]=map[k];msg=`${nm[sel[0]]} + ${nm[sel[1]]} = ${name}.`+(name===w.goal?' ✓ Hedefi buldun!':' Hedef '+w.goal+' idi; başka bir ikili dene.');if(name===w.goal)window.LearnGame?.widget('color-found')}
    else if(sel.length===3){name='Kahverengi-gri';c='#7a6a5e';msg='Üç ana rengi karıştırınca kirli bir kahverengi-gri çıkar: iki renkle kalmak çoğu zaman daha canlıdır.'}
    $q('#cwR').style.background=c;$q('#cwMsg').textContent=msg};
   document.querySelectorAll('.cw-pot').forEach(b=>b.onclick=()=>{window.LearnGame?.used('colorMix');const k=b.dataset.c;const i=sel.indexOf(k);if(i>=0)sel.splice(i,1);else if(sel.length<3)sel.push(k);paint()});
   $q('#cwReset').onclick=()=>{sel.length=0;paint()};paint()}},
 rhythm:{html:()=>`<div class="rw"><div class="rw-grid" id="rwGrid" role="group" aria-label="Sekiz adımlık ritim kalıbı">${Array.from({length:8},(_,i)=>`<button class="rw-step ${i%2===0?'beat':''}" data-i="${i}" aria-pressed="false" aria-label="Adım ${i+1}${i%2===0?' (vuruş '+(i/2+1)+')':''}">${i%2===0?i/2+1:'·'}</button>`).join('')}</div><div class="rw-ctl"><button class="btn purple small" id="rwPlay">▶ Çal</button><label class="rw-bpm">Tempo <input type="range" min="60" max="160" value="96" id="rwBpm" aria-label="Tempo (BPM)"> <b id="rwBpmV">96</b> BPM</label></div><p class="rounded-note" id="rwTxt" role="status"></p></div>`,
  init(){const on=new Array(8).fill(false);on[0]=on[4]=true;const steps=[...document.querySelectorAll('.rw-step')];
   const txt=()=>{$q('#rwTxt').textContent='Kalıp: '+[0,2,4,6].map(i=>(on[i]?'x':'.')+(on[i+1]?'x':'.')).join('|')+' · 4/4, '+on.filter(Boolean).length+' vuruş'};
   const paint=()=>{steps.forEach((s,i)=>{s.classList.toggle('on',on[i]);s.setAttribute('aria-pressed',String(on[i]))});txt()};
   steps.forEach(s=>s.onclick=()=>{on[+s.dataset.i]=!on[+s.dataset.i];paint()});paint();
   const bpm=$q('#rwBpm');bpm.oninput=()=>{$q('#rwBpmV').textContent=bpm.value;if(rhythmTimer){stopRhythm();start()}};
   const blip=(strong)=>{try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=strong?180:240;g.gain.setValueAtTime(.35,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.18)}catch{}};
   let pos=0;function start(){window.LearnGame?.used('rhythm');if(on.filter(Boolean).length>=4)window.LearnGame?.widget('rhythm-play');pos=0;$q('#rwPlay').textContent='■ Dur';const ms=60000/Number(bpm.value)/2;rhythmTimer=setInterval(()=>{steps.forEach((s,i)=>s.classList.toggle('now',i===pos));if(on[pos])blip(pos%2===0);pos=(pos+1)%8},ms)}
   $q('#rwPlay').onclick=()=>{if(rhythmTimer){stopRhythm();steps.forEach(s=>s.classList.remove('now'))}else{if(audio&&audio.state==='suspended')audio.resume();start()}}}},
 profit:{html:w=>{const d=w.defaults;return `<div class="pw"><div class="pw-in">${[['price','Satış fiyatı (₺)',d.price],['cost','Birim maliyet (₺)',d.cost],['qty','Satılan adet',d.qty],['fixed','Sabit gider (₺)',d.fixed]].map(([k,l,v])=>`<label>${l}<input class="input" type="number" min="0" step="1" id="pw-${k}" value="${v}"></label>`).join('')}</div><div class="pw-out" id="pwOut" role="status"></div></div>`},
  init(){const g=k=>Math.max(0,Number($q('#pw-'+k).value)||0);const calc=(user)=>{const p=g('price'),c=g('cost'),q=g('qty'),f=g('fixed'),rev=p*q,tot=c*q+f,prof=rev-tot,per=p-c;if(user){window.LearnGame?.used('profit');if(per>0&&q===Math.ceil(f/per)&&f>0)window.LearnGame?.widget('break-even')}
    $q('#pwOut').innerHTML=`<div><b>${money(rev)}</b><small>gelir</small></div><div><b>${money(tot)}</b><small>toplam maliyet</small></div><div class="${prof>=0?'pos':'neg'}"><b>${money(prof)}</b><small>${prof>=0?'kâr':'zarar'}</small></div><div><b>${per>0?Math.ceil(f/per)+' adet':'—'}</b><small>başa baş</small></div>${per<=0?'<p class="error">Fiyat birim maliyetten düşük ya da eşit: her satışta zarar edersin.</p>':''}`};
   document.querySelectorAll('.pw-in input').forEach(i=>i.oninput=()=>calc(true));calc(false)}},
 sort:{html:w=>`<div class="sw"><p><strong>${esc(w.title)}</strong></p>${w.items.map((it,i)=>`<div class="sw-item" id="sw${i}"><span>${esc(it.t)}</span><div class="sw-btns"><button class="btn light small" data-i="${i}" data-a="a">${esc(w.a)}</button><button class="btn light small" data-i="${i}" data-a="b">${esc(w.b)}</button></div><small class="sw-fb" id="swf${i}"></small></div>`).join('')}<p class="rounded-note" id="swScore" role="status"></p></div>`,
  init(w){let ok=0,n=0;document.querySelectorAll('.sw-btns button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,it=w.items[i];if(b.parentNode.dataset.done)return;b.parentNode.dataset.done='1';n++;const right=b.dataset.a===it.ans;if(right)ok++;b.classList.add(right?'ok':'bad');$q('#swf'+i).textContent=(right?'✓ ':'✗ ')+it.why;window.LearnGame?.used('sort');if(n===w.items.length){$q('#swScore').textContent=`${ok}/${n} doğru. Kaynağı belli olan bilgi, tekrar bakılabilen bilgidir.`;if(ok===n)window.LearnGame?.widget('source-sleuth')}})}},
 jargon:{html:()=>{const words=['Başvurunuzun','değerlendirme','sürecinin','tamamlanmasını','müteakip','tarafınıza','geri','dönüş','sağlanacaktır.'];return `<div class="jw"><p class="jw-sent" role="group" aria-label="Ağır sözcükleri seç">${words.map((w,i)=>`<button class="jw-w" data-i="${i}" aria-pressed="false">${w}</button>`).join(' ')}</p><button class="btn light small" id="jwCheck">Kontrol et</button><div class="rounded-note" id="jwOut" role="status"></div></div>`},
  init(){const heavy=new Set([3,4,5,8]);document.querySelectorAll('.jw-w').forEach(b=>b.onclick=()=>{b.classList.toggle('on');b.setAttribute('aria-pressed',String(b.classList.contains('on')))});
   $q('#jwCheck').onclick=()=>{window.LearnGame?.used('jargon');const ws=[...document.querySelectorAll('.jw-w')];let hit=0,miss=0,extra=0;ws.forEach((b,i)=>{const on=b.classList.contains('on');b.classList.remove('ok','bad');if(heavy.has(i)){if(on){hit++;b.classList.add('ok')}else miss++}else if(on){extra++;b.classList.add('bad')}});
    $q('#jwOut').innerHTML=`<strong>${hit}/${heavy.size} ağır sözcüğü buldun${extra?`, ${extra} sözcük gereksizdi`:''}.</strong><br>Ağır olanlar: <em>tamamlanmasını, müteakip, tarafınıza, sağlanacaktır</em>.<br>Sade hâli: "Başvurunu inceleyince sana haber vereceğiz."`;if(hit===heavy.size&&!extra)window.LearnGame?.widget('jargon-hunter')}}}
};

/* ---------- Ders akışı ---------- */
const checkHtml=(c,mi)=>(c||[]).map((ch,ci)=>`<div class="ck" id="ck-${mi}-${ci}"><p><strong>Kendini yokla:</strong> ${esc(ch.q)}</p><div class="ck-opts">${ch.options.map((o,oi)=>`<button class="btn light small" data-m="${mi}" data-c="${ci}" data-o="${oi}">${esc(o)}</button>`).join('')}</div><p class="ck-fb" id="ckf-${mi}-${ci}" role="status"></p></div>`).join('');
function bindChecks(course,mi){const m=course.modules[mi];if(!m)return;document.querySelectorAll('.ck-opts button').forEach(b=>b.onclick=()=>{const ch=m.checks[+b.dataset.c],right=+b.dataset.o===ch.answer;b.parentNode.querySelectorAll('button').forEach((x,i)=>{x.disabled=true;if(i===ch.answer)x.classList.add('ok');else if(x===b)x.classList.add('bad')});$q(`#ckf-${mi}-${b.dataset.c}`).textContent=(right?'✓ Doğru. ':'Tam değil. ')+ch.explain;window.LearnGame?.onCheck(course.id,mi,+b.dataset.c,right)})}

const _open=openCourse;
openCourse=function(id,step=0){
  const c=allCourses().find(x=>x.id===id);if(!c||!c.modules)return _open(id,step);
  stopRhythm();currentCourseStep=step;const n=c.modules.length,done=state.completions[id],last=n+1;step=Math.max(0,Math.min(last,step));window.LearnGame?.onStep(c,step);
  const tabs=['Hedef',...c.modules.map((m,i)=>`${i+1}. ${m.title}`),'Uygula & paylaş'];
  let body='';
  if(step===0){
    body=`<p>${esc(c.desc)}</p><div class="result"><strong>${esc(c.outcome)}</strong><br><small>Düzey: ${esc(c.level)} · ${esc(c.duration)} · ${n} modül + uygulama</small></div>${window.LearnGame?window.LearnGame.courseGoalHtml(c):''}<div class="result"><strong>Ders akışı</strong><ol>${c.syllabus.map(s=>'<li>'+esc(s)+'</li>').join('')}</ol></div><p class="rounded-note">Örnek eğitim: eğitmen gerçek bir kişi değildir. Bir şeyi öğrenmek için okumak yetmez: her modülde kendini yoklar, sonunda kendi çıktını üretirsin.</p><button class="btn purple" onclick="openCourse('${id}',1)">Derse başla ↗</button>`;
  }else if(step<=n){
    const m=c.modules[step-1],w=m.widget,wd=w&&widgets[w.type];
    body=`<h3>${esc(m.title)}</h3>${m.body.map(p=>`<p class="lesson-p">${esc(p)}</p>`).join('')}${m.example?`<div class="ex"><div class="ex-good"><b>İyi örnek</b>${esc(m.example.good)}</div><div class="ex-bad"><b>Zayıf örnek</b>${esc(m.example.bad)}</div><p class="rounded-note">Neden? ${esc(m.example.why)}</p></div>`:''}${wd?wd.html(w):''}${checkHtml(m.checks,step-1)}<div class="modal-actions"><button class="btn light" onclick="openCourse('${id}',${step-1})">‹ Geri</button><button class="btn purple" onclick="openCourse('${id}',${step+1})">${step===n?'Uygulamaya geç ↗':'Sonraki modül ↗'}</button></div>`;
  }else{
    body=`<p>${esc(c.task)}</p><div class="fund-check"><strong>Çıktını yazmadan önce ölçütlere bak (kendi kontrolün):</strong>${c.rubric.map((r,i)=>`<label><input type="checkbox" id="rub${i}" ${done?.rubric?.[i]?'checked':''}><span>${esc(r)}</span></label>`).join('')}</div><label class="field" for="courseOutput">Uygulama çıktın</label><textarea id="courseOutput" maxlength="5000" placeholder="Somut örneğini, denemeni ve öğrendiğini yaz.">${esc(done?.output||state.notes['course-'+id]||'')}</textarea><label class="field">Bu eğitim sana ne kadar yardımcı oldu?</label><div class="rating">${[1,2,3,4,5].map(v=>`<button class="${v<=(done?.rating||0)?'selected':''}" onclick="setRating(${v})" aria-label="${v} yıldız">★</button>`).join('')}</div><input type="hidden" id="courseRating" value="${done?.rating||0}"><p class="error" id="courseError" role="alert"></p><div class="modal-actions"><button class="btn light" onclick="courseDraft('${id}')">Taslağı sakla</button><button class="btn purple" onclick="completeCourse('${id}')">Çıktımı tamamladım ✓</button></div><p class="rounded-note">Kendi beyanına dayalı demo tamamlaması. İlk tamamlamada +${c.xp} demo XP (yalnız bu tarayıcıda; Gelişim aşamasını etkilemez). Ölçütler kendi kontrolündür, bağımsız değerlendirme değildir.</p>
    <div class="result"><strong>Sıradaki adım:</strong><div class="modal-actions" style="margin-top:8px">${c.mission?`<button class="btn lime small" onclick="openMission('${c.mission}')">Bunu gerçek bir görevde dene ↗</button>`:''}${c.meydan?`<button class="btn light small" onclick="closeModal();navigate('hub')">🏙 ${esc(c.meydan)}</button>`:''}${c.growth?`<button class="btn light small" onclick="closeModal();navigate('growth')">🌱 Gelişim yolum</button>`:''}</div></div>`;
  }
  modal(`<div class="eyebrow">${esc(c.teacher)} · ${esc(c.duration||'Kendi hızında')}${done?' · ✓ tamamlandı':''}</div><h2>${esc(c.title)}</h2><div class="lesson-progress" aria-label="Ders ilerlemesi">${Array.from({length:n+2},(_,i)=>`<i class="${i<step?'done':i===step?'cur':''}"></i>`).join('')}</div><div class="lesson-steps">${tabs.map((t,i)=>`<button class="lesson-step ${i===step?'active':''}" onclick="openCourse('${id}',${i})">${t}</button>`).join('')}</div>${body}`,true);
  if(step>=1&&step<=n){const m=c.modules[step-1];bindChecks(c,step-1);const w=m.widget;if(w&&widgets[w.type])widgets[w.type].init(w)}
};
const _complete=completeCourse;
completeCourse=function(id){const c=allCourses().find(x=>x.id===id),rub=c?.rubric?c.rubric.map((_,i)=>!!document.getElementById('rub'+i)?.checked):null,len=document.getElementById('courseOutput')?.value.trim().length||0;_complete(id);if(rub&&state.completions[id]?.status){state.completions[id].rubric=rub;save();window.LearnGame?.onComplete(id,rub,len)}};

/* Akademi sayfasında alan filtresi için yeniden çiz */
if(typeof page!=='undefined'&&page==='academy')renderPage('academy');
})();
