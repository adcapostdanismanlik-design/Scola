// Scola Gelişim (Level) sistemi: Tohum → Fidan → Ağaç, topluluk düzeyinde Orman.
// Tek doğruluk kaynağı: hem tarayıcı (demo gösterimi) hem sunucu (doğrulanmış hesap) bu dosyayı kullanır.
// Eşikler PİLOT HİPOTEZİDİR; gerçek veriyle dengelenmelidir. Bu sistem oyundan (Meydan, damgalar) BAĞIMSIZDIR:
// yalnız bağımsız incelemede kabul edilen katkılar, zaman ve mentörlük kayıtları sayılır.
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SCOLA_GROWTH=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const STAGES=[
    {id:'tohum',name:'Tohum',emoji:'🌰',tag:'Başlangıç rotanı belirle; yoldaşın olacak bir mentörle ilk katkılarını ver.'},
    {id:'fidan',name:'Fidan',emoji:'🌱',tag:'Yetkinlik kazandın. Şimdi çırak mentör olarak başkalarının büyümesine yardım etmeyi öğren.'},
    {id:'agac',name:'Ağaç',emoji:'🌳',tag:'Mentörler Birliği üyesisin: yeni tohumlara yoldaşlık eder, ormanlar kurarsın.'}];
  const FOREST={id:'orman',name:'Orman',emoji:'🌲',tag:'En az üç ağacın birlikte kurduğu, yeni nesilleri sürdürülebilir biçimde yetiştiren topluluk.'};
  const RULES={
    fidan:{xp:200,accepted:3,areas:2,rate:.6,minDecided:3,tenureDays:7},
    agac:{xp:700,accepted:8,areas:3,rate:.7,minDecided:6,tenureDays:45,apprenticeDays:14,apprenticeSeeds:1,evalPasses:2},
    mentorCap:5,maxForestsPerTree:2,retryDays:30,
    forest:{minTrees:3,healthySeeds:3,retention:.5}
  };
  const AREAS={test:'Ürün & oyun testi',design:'Yaratıcı katkı',art:'Sanat',music:'Müzik',culture:'Kültür',trade:'Ticaret',game:'Oyun tasarımı',big:'Büyük proje denemesi',task:'Topluluk görevi'};
  // Başlangıç rotası: seçilen alan için kilometre taşları (hepsi doğrulanmış katkıdan ölçülür; mentör puan vermez)
  const ROUTE_AREAS=['art','music','culture','game','trade','test','design'];
  const ROUTE_STEPS=[
    {key:'first',label:'İlk katkın bağımsız incelemede kabul edilsin',need:1},
    {key:'second',label:'Aynı alanda ikinci kabul edilen katkı',need:2},
    {key:'mentor',label:'Mentörünle ilk gözlem notunu al',need:1},
    {key:'community',label:'Bir topluluk görevinde kabul edilen katkı',need:1}];

  const pct=(have,need)=>need>0?Math.max(0,Math.min(1,have/need)):1;
  const req=(key,label,have,need,fmt,extra={})=>({key,label,have,need,met:have!==null&&have>=need,pct:have===null?0:pct(have,need),fmt:fmt||(v=>String(v)),...extra});
  const rateOf=(s,min)=>s.decided>=min?s.accepted/s.decided:null;

  function fidanReqs(s,R=RULES){const r=R.fidan;return [
    req('xp','Doğrulanmış XP',s.xp,r.xp),
    req('accepted','Bağımsız incelemede kabul edilen katkı',s.accepted,r.accepted),
    req('areas','Farklı alanda katkı',s.areas,r.areas),
    req('rate',`Kabul oranı (en az ${r.minDecided} karar)`,rateOf(s,r.minDecided),r.rate,v=>v===null?'—':Math.round(v*100)+'%'),
    req('tenure','Hesap yaşı (gün)',Math.floor(s.tenureDays||0),r.tenureDays)]}
  function agacReqs(s,R=RULES){const r=R.agac;return [
    req('xp','Doğrulanmış XP',s.xp,r.xp),
    req('accepted','Bağımsız incelemede kabul edilen katkı',s.accepted,r.accepted),
    req('areas','Farklı alanda katkı',s.areas,r.areas),
    req('rate',`Kabul oranı (en az ${r.minDecided} karar)`,rateOf(s,r.minDecided),r.rate,v=>v===null?'—':Math.round(v*100)+'%'),
    req('tenure','Hesap yaşı (gün)',Math.floor(s.tenureDays||0),r.tenureDays),
    req('apprentice',`Çırak mentörlük (${r.apprenticeDays}+ gün, ${r.apprenticeSeeds} tohum)`,s.apprenticeSeeds||0,r.apprenticeSeeds,null,{gate:'apprentice'}),
    req('eval',`Mentörler Birliği değerlendirmesi (${r.evalPasses} bağımsız onay)`,s.evalPasses||0,r.evalPasses,null,{gate:'eval'})]}

  // stats: {xp,accepted,areas,decided,tenureDays,apprenticeSeeds,evalPasses,founding,fidanAt,treeAt}
  function computeGrowth(s,R=RULES){
    const f=fidanReqs(s,R),meetsFidan=f.every(x=>x.met);
    const isTree=!!(s.founding||s.treeAt),isFidan=isTree||!!s.fidanAt||meetsFidan;
    const stage=isTree?'agac':isFidan?'fidan':'tohum';
    let requirements=[],next=null;
    if(stage==='tohum'){requirements=f;next='fidan'}
    else if(stage==='fidan'){requirements=agacReqs(s,R);next='agac'}
    const metricsOk=requirements.filter(x=>!x.gate).every(x=>x.met);
    const progress=requirements.length?requirements.reduce((t,x)=>t+x.pct,0)/requirements.length:1;
    return {stage,next,requirements,progress,reachedFidan:isFidan,meetsFidan,
      canApplyTree:stage==='fidan'&&metricsOk&&requirements.filter(x=>x.gate==='apprentice').every(x=>x.met),
      meta:STAGES.find(x=>x.id===stage),founding:!!s.founding};
  }

  // Orman: kişisel seviye değil, topluluk metriği. stats: {trees,seeds,totalMentored,saplingsGrown,treesGrown,retention,overloaded,loadMax,areas,ageDays}
  function forestStatus(m,R=RULES){
    if(m.trees<R.forest.minTrees)return {id:'filiz',label:'Filiz (en az 3 ağaç gerekir)',healthy:false};
    const healthy=(m.seeds>=R.forest.healthySeeds||m.totalMentored>=R.forest.healthySeeds)&&(m.retention===null||m.retention>=R.forest.retention)&&m.overloaded===0;
    return healthy?{id:'saglikli',label:'Sağlıklı orman',healthy:true}:{id:'gelisiyor',label:'Gelişen orman',healthy:false};
  }
  function routeProgress(route,s){
    // route: {areas:[..],goal}; s: {areaAccepted:{area:n},mentorNotes:n,communityAccepted:n}
    if(!route||!route.areas?.length)return null;
    return route.areas.map(a=>{
      const n=s.areaAccepted?.[a]||0,steps=[
        {...ROUTE_STEPS[0],have:Math.min(n,1)},{...ROUTE_STEPS[1],have:Math.min(n,2)},
        {...ROUTE_STEPS[2],have:Math.min(s.mentorNotes||0,1)},{...ROUTE_STEPS[3],have:Math.min(s.communityAccepted||0,1)}];
      steps.forEach(x=>x.done=x.have>=x.need);
      return {area:a,label:AREAS[a]||a,steps,done:steps.filter(x=>x.done).length,total:steps.length};
    });
  }
  return {STAGES,FOREST,RULES,AREAS,ROUTE_AREAS,ROUTE_STEPS,computeGrowth,fidanReqs,agacReqs,forestStatus,routeProgress};
});
