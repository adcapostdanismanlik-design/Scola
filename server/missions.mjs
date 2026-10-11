// Sunucunun tanıdığı görev sözleşmeleri. XP miktarı ve kabul koşulları burada
// tutulur; istemcinin gönderdiği puan veya durum hiçbir zaman hak doğurmaz.
// Not: Buradaki dört görev eğitim amaçlı deneme görevleridir. Ücretli bir görev
// ancak gerçek görev sahibi, bütçe ve ödeme düzeni belirlendiğinde eklenmelidir.
const trial={type:'unpaid-trial',amount:0,currency:'TRY',label:'Ücretsiz eğitim denemesi',detail:'Bu görev gerçek bir müşteri işi değildir; ödeme yapılmaz. Kullanıcı başına deneme sayısı sınırlıdır.'};
export const missions=[
 {id:'test-game',title:'Bir oyunun ilk testçisi ol',area:'test',xp:70,maxAttempts:3,
  scope:'“Mini sıçrama” prototipinde hareket, zıplama ve sıfırlama kontrollerini dene; tekrar üretilebilir bir hata raporu yaz.',
  duration:'10–15 dk',
  acceptance:['Adımlar başka biri tarafından tekrarlanabilecek kadar açık','Beklenen ve gerçekleşen sonuç ayrı yazılmış','Etki / öncelik gerekçelendirilmiş'],
  payment:trial,
  license:'Rapor, adın gizlenerek Scola eğitim içeriklerinde örnek olarak kullanılabilir. Adınla yayın yalnızca ayrıca izin verirsen yapılır.',
  share:'Gelir üretmeyen eğitim senaryosu; katkı payı yoktur.'},
 {id:'test-cart',title:'Alışveriş akışını stres testine sok',area:'test',xp:90,maxAttempts:3,
  scope:'Örnek sepette miktar, toplam ve sıfırlama davranışlarını kontrol et; tutarsızlığı yeniden üretim adımlarıyla raporla.',
  duration:'15 dk',
  acceptance:['Hatanın oluştuğu adımlar sıralı','Beklenen ve gerçekleşen tutar açık','Kullanıcıya etkisi yazılmış'],
  payment:trial,
  license:'Rapor, adın gizlenerek Scola eğitim içeriklerinde örnek olarak kullanılabilir.',
  share:'Gelir üretmeyen eğitim senaryosu; katkı payı yoktur.'},
 {id:'copy',title:'Bir ekranı daha anlaşılır yap',area:'design',xp:60,maxAttempts:3,
  scope:'Karışık başvuru metnini kullanıcının ne olacağını ve ne yapacağını anladığı kısa bir taslağa dönüştür. Bilinmeyen süre uydurulmaz.',
  duration:'10 dk',
  acceptance:['Kullanıcının şimdi ne yapacağı açık','Bilinmeyen bilgi uydurulmamış','Gerekçe yazılmış'],
  payment:trial,
  license:'Metin taslağı Scola arayüzünde kullanılırsa katkı sahibi olarak adın (izin verirsen) anılır.',
  share:'Deneme görevi; katkı payı yoktur.'},
 {id:'big-project',title:'Büyük bir oyun projesi için açık deneme',area:'big',xp:120,maxAttempts:1,
  scope:'Örnek brif: iki oyunculu, tek elle de kullanılabilen bir kapı açma kontrol düzeni öner. Tuşlar, iş birliği kuralı ve iki test ölçütü.',
  duration:'30–45 dk',
  acceptance:['Kontrol düzeni tek elle uygulanabilir','İş birliği kuralı açık','İki ölçülebilir test ölçütü var'],
  payment:{type:'unpaid-trial',amount:0,currency:'TRY',label:'Açık deneme (seviye şartı yok)',detail:'Bu bir örnek brif; gerçek proje sahibi bağlanmadı. Gerçek projede seçilen katılımcıya ücretli rol ayrıca ve yazılı olarak teklif edilir.'},
  license:'Deneme çıktısının hakları sende kalır; Scola yalnızca değerlendirme için kullanır.',
  share:'Gerçek projede gelir / hak paylaşımı rol teklifinde ayrıca belirlenir.'}
];
export const missionById=id=>missions.find(m=>m.id===id);
