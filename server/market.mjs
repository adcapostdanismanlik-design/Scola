// Scola Pazar: gençlerin ürünlerini satışa çıkardığı güvenli pazar yeri (TEST MODU: gerçek para yoktur).
// Akış: ilan → bağımsız değerlendirme → yayın → satın alma (test emaneti) → teslim → alıcı onayı → komisyonlu serbest bırakma.
// Güvenlik: serbest metin yorum yok (hazır etiketler), adres / telefon alınmaz, yasaklı ürün ve dış iletişim denetimi,
// uyuşmazlıkta yönetici kararı, sıralamada para / takipçi / satış sayısı kullanılmaz.
const DAY=864e5,AUTO_RELEASE_DAYS=3,DISPUTE_DAYS=3;
export const CATEGORIES={dijital:'Dijital ürün',fiziksel:'Fiziksel ürün'};
export const AREAS={art:'Sanat',music:'Müzik',culture:'Kültür',game:'Oyun',craft:'El işi',writing:'Yazı',tech:'Teknoloji',other:'Diğer'};
export const EMOJIS=['🎨','🧵','📚','🎧','🎮','🧩','✂️','🕯️','🪴','🖍️','📷','🧶','🍪','🎁','💡','🧸'];
export const COVER_COLORS=['#f0e3fb','#f7e4d3','#e1ecf8','#dcefe6','#f6edd3','#e8efd9','#f9dde6','#e5f1de'];
export const TAGS=['Anlatıldığı gibiydi','Hızlı teslim','Kaliteli','Fiyatına değer','Yaratıcı'];
export const DISPUTE_REASONS=['Ürün teslim edilmedi','Ürün anlatıldığı gibi değil','Ürün hasarlı / çalışmıyor','Diğer'];
export const REPORT_REASONS=['Yasaklı ürün','Yanıltıcı açıklama','Uygunsuz içerik','Dış iletişime yönlendirme','Diğer'];
export const MOD_CHECKS=['Ürün güvenli ve yasal (yasaklı değil)','Açıklama doğru ve abartısız','Fiyat makul','Kişisel bilgi ya da dış yönlendirme yok'];
export const LIMITS={minPrice:10,maxPrice:2000,maxStock:50,maxQty:5,maxListings:10,maxOpenOrders:5,dailyBuyTL:3000,autoReleaseDays:AUTO_RELEASE_DAYS,disputeDays:DISPUTE_DAYS};
const PROHIBITED=['silah','tabanca','mermi','patlayıcı','alkol','sigara','tütün','uyuşturucu','esrar','bahis','kumar','reçete','ilaç','cinsel','çıplak','canlı hayvan','sahte','taklit'];
const CONTACT=/\d{10,}|\d{3}[\s.\-]?\d{3}[\s.\-]?\d{2}[\s.\-]?\d{2}|@|whatsapp|instagram|telegram|snapchat|discord|http|www\.|\.com|\.net/i;
const CONTACT_NOTE=/\d{10,}|\d{3}[\s.\-]?\d{3}[\s.\-]?\d{2}[\s.\-]?\d{2}|@|whatsapp|instagram|telegram|snapchat/i;
const tr=s=>String(s).toLocaleLowerCase('tr-TR');

export function createMarket({db,need,fail,str,id,audit,clock,commissionPct}){
  const byId=(d,uid)=>d.users.find(u=>u.id===uid);
  const ensure=d=>{for(const k of ['listings','orders','marketReports'])d[k]=d[k]||[]};
  const name=(d,uid)=>byId(d,uid)?.name||'Silinmiş üye';
  const tl=k=>k/100;
  const salesOf=(d,sid)=>d.orders.filter(o=>o.sellerId===sid&&o.status==='completed').length;
  const rating=(l)=>{const r=l.reviews||[];return {count:r.length,avg:r.length?Math.round(r.reduce((t,x)=>t+x.rating,0)/r.length*10)/10:null,tags:Object.fromEntries(TAGS.map(t=>[t,r.filter(x=>x.tags.includes(t)).length]).filter(([,n])=>n>0))}};

  // 3 gün içinde alıcı yanıtsız kalan teslimler otomatik serbest kalır
  function sweep(d){
    ensure(d);let n=0;
    for(const o of d.orders)if(o.status==='delivered'&&clock()-o.deliveredAt>=AUTO_RELEASE_DAYS*DAY){complete(d,o,'auto');n++}
    return n;
  }
  function complete(d,o,by){
    o.status='completed';o.completedAt=clock();
    audit(d,by==='auto'?'system':o.buyerId,'escrow.release',o.id,{gross:tl(o.amount),commission:tl(o.commission),net:tl(o.net),payee:o.sellerId,testMode:true,market:true,by});
  }
  function refund(d,o,by,reason){
    o.status='refunded';o.refundedAt=clock();const l=d.listings.find(x=>x.id===o.listingId);
    if(l&&l.category==='fiziksel'){l.stock+=o.qty;if(l.status==='soldout')l.status='active'}
    audit(d,by,'escrow.refund',o.id,{gross:tl(o.amount),testMode:true,market:true,reason});
  }
  const listingView=(d,l,viewer)=>{
    const r=rating(l);return {id:l.id,title:l.title,desc:l.desc,category:l.category,categoryLabel:CATEGORIES[l.category],area:l.area,areaLabel:AREAS[l.area],price:l.price,stock:l.category==='fiziksel'?l.stock:null,cover:l.cover,
      status:l.status,createdAt:l.createdAt,seller:{id:l.sellerId,name:name(d,l.sellerId),sales:salesOf(d,l.sellerId)},newSeller:salesOf(d,l.sellerId)<3,rating:r,own:viewer?.id===l.sellerId,
      moderation:viewer&&(viewer.id===l.sellerId)?(l.moderation||[]).map(m=>({decision:m.decision,feedback:m.feedback,at:m.at})):undefined};
  };
  const orderView=(d,o,viewer)=>{
    const l=d.listings.find(x=>x.id===o.listingId);const mine=viewer.id===o.buyerId?'buyer':'seller';
    return {id:o.id,listingId:o.listingId,title:l?.title||'Kaldırılmış ilan',cover:l?.cover,qty:o.qty,price:tl(o.amount),commission:mine==='seller'?tl(o.commission):undefined,net:mine==='seller'?tl(o.net):undefined,status:o.status,role:mine,
      counterpart:{id:mine==='buyer'?o.sellerId:o.buyerId,name:name(d,mine==='buyer'?o.sellerId:o.buyerId)},createdAt:o.createdAt,deliveredAt:o.deliveredAt||null,
      deliveryNote:mine==='buyer'&&!['paid','cancelled'].includes(o.status)?o.deliveryNote:(mine==='seller'?o.deliveryNote:null),dispute:o.dispute?{reason:o.dispute.reason,at:o.dispute.at,resolution:o.dispute.resolution||null}:null,
      autoReleaseAt:o.status==='delivered'?o.deliveredAt+AUTO_RELEASE_DAYS*DAY:null,review:o.review||null,canReview:mine==='buyer'&&o.status==='completed'&&!o.review,category:l?.category};
  };
  const checkText=(txt,label,pattern=CONTACT)=>{if(pattern.test(tr(txt)))fail(400,'contact_info',`${label}: telefon, e-posta, adres ya da sosyal medya bilgisi yazma. Konuşmalar platform üzerinde kalır.`);const t=tr(txt);for(const w of PROHIBITED)if(t.includes(w))fail(400,'prohibited',`${label}: "${w}" içeren ürünler Scola Pazar'da satılamaz.`)};

  // Önerilen sıralama: %40 kalite, %25 konu uyumu, %20 yeni üretici keşfi, %15 güncellik. Para, takipçi, satış sayısı KULLANILMAZ.
  function score(d,l,viewer){
    const r=rating(l),quality=r.count?(r.avg-1)/4:.5,topic=viewer?.route?.areas?.includes(l.area)?1:0,fresh=Math.exp(-(clock()-l.createdAt)/DAY/30),newSeller=1/(1+salesOf(d,l.sellerId));
    let h=0;for(const ch of l.id+Math.floor(clock()/DAY))h=(h*31+ch.charCodeAt(0))%1000;
    return .40*quality+.25*topic+.20*newSeller+.15*fresh+h/1000*.04;
  }

  const routes=[
    ['GET','/api/market/info',()=>({testMode:true,commissionPct,categories:CATEGORIES,areas:AREAS,emojis:EMOJIS,colors:COVER_COLORS,tags:TAGS,disputeReasons:DISPUTE_REASONS,reportReasons:REPORT_REASONS,modChecks:MOD_CHECKS,limits:LIMITS})],

    ['GET','/api/market/listings',({user,req})=>{
      const d=db.data;ensure(d);const sp=new URL(req.url,'http://x').searchParams,q=tr(sp.get('q')||''),cat=sp.get('cat'),area=sp.get('area'),sort=sp.get('sort')||'oneri';
      const viewer=user?byId(d,user.id):null;
      let list=d.listings.filter(l=>['active','soldout'].includes(l.status)&&(!cat||l.category===cat)&&(!area||l.area===area)&&(!q||tr(l.title+' '+l.desc).includes(q)));
      const sorters={oneri:(a,b)=>score(d,b,viewer)-score(d,a,viewer),yeni:(a,b)=>b.createdAt-a.createdAt,'fiyat-artan':(a,b)=>a.price-b.price,'fiyat-azalan':(a,b)=>b.price-a.price};
      list=list.sort(sorters[sort]||sorters.oneri).sort((a,b)=>(a.status==='soldout')-(b.status==='soldout'));
      return {testMode:true,sort,listings:list.map(l=>listingView(d,l,user))};
    }],

    ['GET','/api/market/listings/:id',({user,params})=>{
      const d=db.data;ensure(d);const l=d.listings.find(x=>x.id===params.id)||fail(404,'not_found','İlan bulunamadı.');
      const u=user?byId(d,user.id):null,staff=u&&(u.roles.includes('reviewer')||u.roles.includes('admin'));
      if(!['active','soldout'].includes(l.status)&&l.sellerId!==u?.id&&!staff)fail(404,'not_found','İlan bulunamadı.');
      return {listing:listingView(d,l,user)};
    }],

    ['POST','/api/market/listings',({user,body})=>{
      need(user);const title=str(body.title,4,60,'title'),desc=str(body.desc,30,800,'desc');
      if(!CATEGORIES[body.category])fail(400,'invalid_category','Kategori seç.');if(!AREAS[body.area])fail(400,'invalid_area','Alan seç.');
      const price=Number(body.price);if(!Number.isInteger(price)||price<LIMITS.minPrice||price>LIMITS.maxPrice)fail(400,'invalid_price',`Fiyat ${LIMITS.minPrice}–${LIMITS.maxPrice} ₺ arasında tam sayı olmalı.`);
      let stock=null;if(body.category==='fiziksel'){stock=Number(body.stock);if(!Number.isInteger(stock)||stock<1||stock>LIMITS.maxStock)fail(400,'invalid_stock',`Stok 1–${LIMITS.maxStock} arası olmalı.`)}
      const cover={e:Number.isInteger(body.cover?.e)&&body.cover.e>=0&&body.cover.e<EMOJIS.length?body.cover.e:0,c:Number.isInteger(body.cover?.c)&&body.cover.c>=0&&body.cover.c<COVER_COLORS.length?body.cover.c:0};
      checkText(title,'Başlık');checkText(desc,'Açıklama');
      return db.tx(d=>{
        ensure(d);if(d.listings.filter(l=>l.sellerId===user.id&&['pending','active','paused','soldout'].includes(l.status)).length>=LIMITS.maxListings)fail(409,'listing_limit',`En fazla ${LIMITS.maxListings} açık ilanın olabilir.`);
        if(d.listings.some(l=>l.sellerId===user.id&&tr(l.title)===tr(title)&&l.status!=='rejected'))fail(409,'duplicate','Aynı başlıkla bir ilanın var.');
        const l={id:id(),sellerId:user.id,title,desc,category:body.category,area:body.area,price,stock,cover,status:'pending',createdAt:clock(),moderation:[],reviews:[]};
        d.listings.push(l);audit(d,user.id,'listing.create',l.id,{});return {listing:listingView(d,l,user)};
      });
    }],

    ['POST','/api/market/listings/:id/pause',({user,params,body})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const l=d.listings.find(x=>x.id===params.id&&x.sellerId===user.id)||fail(404,'not_found','İlan bulunamadı.');
        if(body.paused===true){if(!['active','soldout'].includes(l.status))fail(409,'invalid_state','Yalnız yayındaki ilan duraklatılır.');l.status='paused'}
        else{if(l.status!=='paused')fail(409,'invalid_state','İlan duraklatılmış değil.');l.status=(l.category==='fiziksel'&&l.stock<1)?'soldout':'active'}
        return {listing:listingView(d,l,user)};
      });
    }],

    ['POST','/api/market/listings/:id/stock',({user,params,body})=>{
      need(user);const stock=Number(body.stock);if(!Number.isInteger(stock)||stock<0||stock>LIMITS.maxStock)fail(400,'invalid_stock',`Stok 0–${LIMITS.maxStock} arası olmalı.`);
      return db.tx(d=>{
        ensure(d);const l=d.listings.find(x=>x.id===params.id&&x.sellerId===user.id)||fail(404,'not_found','İlan bulunamadı.');
        if(l.category!=='fiziksel')fail(409,'digital','Dijital ürünlerde stok yoktur.');
        l.stock=stock;if(l.status==='soldout'&&stock>0)l.status='active';if(l.status==='active'&&stock<1)l.status='soldout';return {listing:listingView(d,l,user)};
      });
    }],

    /* ----- Satın alma (TEST emaneti) ----- */
    ['POST','/api/market/listings/:id/buy',({user,params,body})=>{
      need(user);const qty=body.qty==null?1:Number(body.qty);if(!Number.isInteger(qty)||qty<1||qty>LIMITS.maxQty)fail(400,'invalid_qty',`Adet 1–${LIMITS.maxQty} arası olmalı.`);
      if(body.confirm!==true)fail(400,'confirm_required','Ücretin test emanetine alınacağını onaylaman gerekir.');
      return db.tx(d=>{
        ensure(d);sweep(d);const l=d.listings.find(x=>x.id===params.id)||fail(404,'not_found','İlan bulunamadı.');
        if(l.status!=='active')fail(409,'not_available','Bu ilan şu an satışta değil.');
        if(l.sellerId===user.id)fail(403,'own_listing','Kendi ürününü satın alamazsın.');
        if(l.category==='dijital'&&qty!==1)fail(400,'invalid_qty','Dijital üründen bir adet alınır.');
        if(l.category==='fiziksel'&&l.stock<qty)fail(409,'out_of_stock','Yeterli stok yok.');
        const open=d.orders.filter(o=>o.buyerId===user.id&&['paid','delivered','disputed'].includes(o.status));
        if(open.length>=LIMITS.maxOpenOrders)fail(409,'order_limit',`En fazla ${LIMITS.maxOpenOrders} açık siparişin olabilir.`);
        const amount=l.price*qty*100,today=d.orders.filter(o=>o.buyerId===user.id&&clock()-o.createdAt<DAY&&o.status!=='refunded').reduce((t,o)=>t+o.amount,0);
        if(today+amount>LIMITS.dailyBuyTL*100)fail(409,'daily_limit',`Günlük alışveriş sınırın ${LIMITS.dailyBuyTL} ₺ (test).`);
        if(l.category==='fiziksel'){l.stock-=qty;if(l.stock<1)l.status='soldout'}
        const commission=Math.round(amount*commissionPct/100),o={id:id(),listingId:l.id,buyerId:user.id,sellerId:l.sellerId,qty,amount,commission,net:amount-commission,status:'paid',createdAt:clock()};
        d.orders.push(o);audit(d,user.id,'escrow.hold',o.id,{gross:tl(amount),testMode:true,market:true});return {order:orderView(d,o,user)};
      });
    }],

    ['GET','/api/me/market',({user})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);sweep(d);const mine=d.listings.filter(l=>l.sellerId===user.id).sort((a,b)=>b.createdAt-a.createdAt);
        const ord=d.orders.filter(o=>o.buyerId===user.id||o.sellerId===user.id).sort((a,b)=>b.createdAt-a.createdAt);
        const earned=d.orders.filter(o=>o.sellerId===user.id&&o.status==='completed').reduce((t,o)=>t+o.net,0),held=d.orders.filter(o=>o.buyerId===user.id&&['paid','delivered','disputed'].includes(o.status)).reduce((t,o)=>t+o.amount,0);
        return {testMode:true,earned:tl(earned),held:tl(held),listings:mine.map(l=>listingView(d,l,user)),buying:ord.filter(o=>o.buyerId===user.id).map(o=>orderView(d,o,user)),selling:ord.filter(o=>o.sellerId===user.id).map(o=>orderView(d,o,user))};
      });
    }],

    ['POST','/api/market/orders/:id/deliver',({user,params,body})=>{
      need(user);const note=str(body.note,5,300,'note');
      return db.tx(d=>{
        ensure(d);const o=d.orders.find(x=>x.id===params.id&&x.sellerId===user.id)||fail(404,'not_found','Sipariş bulunamadı.');
        if(o.status!=='paid')fail(409,'invalid_state','Bu sipariş teslim edilemez durumda.');
        const l=d.listings.find(x=>x.id===o.listingId);checkText(note,'Teslim notu',l?.category==='dijital'?CONTACT_NOTE:CONTACT);
        o.status='delivered';o.deliveredAt=clock();o.deliveryNote=note;audit(d,user.id,'order.deliver',o.id,{});return {order:orderView(d,o,user)};
      });
    }],

    ['POST','/api/market/orders/:id/confirm',({user,params})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const o=d.orders.find(x=>x.id===params.id&&x.buyerId===user.id)||fail(404,'not_found','Sipariş bulunamadı.');
        if(o.status!=='delivered')fail(409,'invalid_state','Yalnız teslim edilmiş sipariş onaylanır.');
        complete(d,o,'buyer');return {order:orderView(d,o,user),payout:{gross:tl(o.amount),commission:tl(o.commission),net:tl(o.net)}};
      });
    }],

    ['POST','/api/market/orders/:id/cancel',({user,params})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const o=d.orders.find(x=>x.id===params.id&&(x.buyerId===user.id||x.sellerId===user.id))||fail(404,'not_found','Sipariş bulunamadı.');
        if(o.status!=='paid')fail(409,'invalid_state','Teslimden sonra iptal edilemez; sorun varsa uyuşmazlık aç.');
        refund(d,o,user.id,'cancel');return {order:orderView(d,o,user)};
      });
    }],

    ['POST','/api/market/orders/:id/dispute',({user,params,body})=>{
      need(user);const reason=Number(body.reason);if(!Number.isInteger(reason)||reason<0||reason>=DISPUTE_REASONS.length)fail(400,'invalid_reason','Bir neden seç.');
      return db.tx(d=>{
        ensure(d);const o=d.orders.find(x=>x.id===params.id&&x.buyerId===user.id)||fail(404,'not_found','Sipariş bulunamadı.');
        if(!['paid','delivered'].includes(o.status))fail(409,'invalid_state','Bu sipariş için uyuşmazlık açılamaz.');
        if(o.status==='delivered'&&clock()-o.deliveredAt>DISPUTE_DAYS*DAY)fail(409,'too_late',`Uyuşmazlık için teslimden sonra ${DISPUTE_DAYS} gün vardı.`);
        if(o.status==='paid'&&clock()-o.createdAt<DAY)fail(409,'too_early','Teslim süresi için satıcıya en az 1 gün tanı.');
        o.status='disputed';o.dispute={reason:DISPUTE_REASONS[reason],at:clock()};audit(d,user.id,'order.dispute',o.id,{reason:o.dispute.reason});return {order:orderView(d,o,user)};
      });
    }],

    ['POST','/api/market/orders/:id/review',({user,params,body})=>{
      need(user);const rt=Number(body.rating);if(!Number.isInteger(rt)||rt<1||rt>5)fail(400,'invalid_rating','Puan 1–5 olmalı.');
      const tags=[...new Set(Array.isArray(body.tags)?body.tags:[])].filter(t=>TAGS.includes(t)).slice(0,3);
      return db.tx(d=>{
        ensure(d);const o=d.orders.find(x=>x.id===params.id&&x.buyerId===user.id)||fail(404,'not_found','Sipariş bulunamadı.');
        if(o.status!=='completed')fail(409,'invalid_state','Yalnız tamamlanan siparişe yorum yapılır.');if(o.review)fail(409,'already','Bu sipariş için yorum yaptın.');
        o.review={rating:rt,tags,at:clock()};const l=d.listings.find(x=>x.id===o.listingId);if(l)l.reviews.push({orderId:o.id,rating:rt,tags,at:clock()});
        return {order:orderView(d,o,user)};
      });
    }],

    ['POST','/api/market/listings/:id/report',({user,params,body})=>{
      need(user);const reason=Number(body.reason);if(!Number.isInteger(reason)||reason<0||reason>=REPORT_REASONS.length)fail(400,'invalid_reason','Bir neden seç.');
      return db.tx(d=>{
        ensure(d);const l=d.listings.find(x=>x.id===params.id)||fail(404,'not_found','İlan bulunamadı.');
        if(d.marketReports.some(r=>r.listingId===l.id&&r.reporterId===user.id&&clock()-r.at<DAY))fail(429,'duplicate','Bu ilanı zaten bildirdin.');
        d.marketReports.push({id:id(),listingId:l.id,reporterId:user.id,reason:REPORT_REASONS[reason],at:clock()});d.marketReports=d.marketReports.slice(-500);return {ok:true};
      });
    }],

    /* ----- Bağımsız ilan değerlendirmesi ----- */
    ['GET','/api/market/queue',({user})=>{
      need(user,'reviewer');const d=db.data;ensure(d);
      return {checks:MOD_CHECKS,queue:d.listings.filter(l=>l.status==='pending'&&l.sellerId!==user.id&&!(l.moderation||[]).some(m=>m.reviewerId===user.id)).map(l=>({id:l.id,seller:'Satıcı #'+l.id.slice(0,5),title:l.title,desc:l.desc,category:CATEGORIES[l.category],area:AREAS[l.area],price:l.price,stock:l.stock,cover:l.cover,previous:(l.moderation||[]).map(m=>({decision:m.decision,feedback:m.feedback}))}))};
    }],

    ['POST','/api/market/listings/:id/moderate',({user,params,body})=>{
      need(user,'reviewer');const decision=body.decision;if(!['approve','reject'].includes(decision))fail(400,'invalid_decision','Karar: onay ya da ret.');
      const feedback=str(body.feedback,20,500,'feedback');
      return db.tx(d=>{
        ensure(d);const l=d.listings.find(x=>x.id===params.id)||fail(404,'not_found','İlan bulunamadı.');
        if(l.status!=='pending')fail(409,'not_pending','Bu ilan değerlendirmede değil.');
        if(l.sellerId===user.id)fail(403,'own','Kendi ilanını değerlendiremezsin.');
        const checks=MOD_CHECKS.map((_,i)=>Array.isArray(body.checks)&&body.checks[i]===true);
        if(decision==='approve'&&!checks.every(Boolean))fail(400,'criteria_unmet','Onay için bütün ölçütler karşılanmalı.');
        l.moderation.push({reviewerId:user.id,decision,checks,feedback,at:clock()});l.status=decision==='approve'?'active':'rejected';
        audit(d,user.id,'listing.'+decision,l.id,{});return {ok:true,status:l.status};
      });
    }],

    /* ----- Yönetici: uyuşmazlık, bildirim, kaldırma ----- */
    ['GET','/api/admin/market',({user})=>{
      need(user,'admin');const d=db.data;ensure(d);sweep(d);
      return {disputes:d.orders.filter(o=>o.status==='disputed').map(o=>({id:o.id,title:d.listings.find(l=>l.id===o.listingId)?.title,price:tl(o.amount),buyer:name(d,o.buyerId),seller:name(d,o.sellerId),reason:o.dispute.reason,deliveryNote:o.deliveryNote||null,at:o.dispute.at})),
        reports:d.marketReports.slice().reverse().slice(0,50).map(r=>({id:r.id,listingId:r.listingId,title:d.listings.find(l=>l.id===r.listingId)?.title,reason:r.reason,at:r.at,status:d.listings.find(l=>l.id===r.listingId)?.status}))};
    }],

    ['POST','/api/admin/orders/:id/resolve',({user,params,body})=>{
      need(user,'admin');if(!['refund','release'].includes(body.decision))fail(400,'invalid_decision','Karar: iade ya da serbest bırakma.');const note=str(body.note,10,300,'note');
      return db.tx(d=>{
        ensure(d);const o=d.orders.find(x=>x.id===params.id)||fail(404,'not_found','Sipariş bulunamadı.');
        if(o.status!=='disputed')fail(409,'invalid_state','Bu sipariş uyuşmazlıkta değil.');
        o.dispute.resolution=(body.decision==='refund'?'İade: ':'Satıcıya serbest: ')+note;if(body.decision==='refund')refund(d,o,user.id,'dispute');else complete(d,o,'admin');
        audit(d,user.id,'order.resolve',o.id,{decision:body.decision});return {ok:true};
      });
    }],

    ['POST','/api/admin/listings/:id/takedown',({user,params,body})=>{
      need(user,'admin');const reason=str(body.reason,10,300,'reason');
      return db.tx(d=>{
        ensure(d);const l=d.listings.find(x=>x.id===params.id)||fail(404,'not_found','İlan bulunamadı.');
        l.status='rejected';l.moderation.push({reviewerId:user.id,decision:'takedown',checks:[],feedback:reason,at:clock()});audit(d,user.id,'listing.takedown',l.id,{reason});return {ok:true};
      });
    }]
  ];
  const counts=d=>{ensure(d);return {listings:d.listings.filter(l=>l.status==='active').length,sales:d.orders.filter(o=>o.status==='completed').length,pending:d.listings.filter(l=>l.status==='pending').length}};
  return {routes,sweep,counts};
}
