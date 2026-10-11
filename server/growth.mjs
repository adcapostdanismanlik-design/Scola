// Gelişim (Level) sistemi sunucu tarafı: Tohum → Fidan → Ağaç, mentörlük, Mentörler Birliği değerlendirmesi, Ormanlar.
// Seviye yalnız DOĞRULANMIŞ verilerden hesaplanır (bağımsız incelemede kabul edilen teslimler, zaman, mentörlük kayıtları).
// Meydan / damgalar / demo XP seviyeye ETKİ ETMEZ.
import {createRequire} from 'node:module';
const G=createRequire(import.meta.url)('../dist/assets/growth.js');
const {RULES,AREAS,ROUTE_AREAS,computeGrowth,forestStatus,routeProgress,STAGES,FOREST}=G;
const DAY=864e5;
const RUBRIC=['bilgi','geriBildirim','guvenilirlik','paylasim'];

export function createGrowth({db,need,fail,str,id,now,audit,contract,clock}){
  const isTree=u=>!!(u&&(u.foundingTree||u.treeAt));
  const byId=(d,uid)=>d.users.find(u=>u.id===uid);
  const person=(d,uid)=>{const u=byId(d,uid);return u?{id:u.id,name:u.name,tree:isTree(u),founding:!!u.foundingTree}:{id:uid,name:'Silinmiş üye'}};
  const iso=()=>new Date(clock()).toISOString();
  const ensure=d=>{for(const k of ['mentorships','treeApps','forests','stageEvents','treeConflicts'])d[k]=d[k]||[]};

  function stats(d,u){
    ensure(d);
    const xp=d.xpEvents.filter(e=>e.userId===u.id).reduce((t,e)=>t+e.points,0);
    const subs=d.submissions.filter(s=>s.userId===u.id),accepted=subs.filter(s=>s.status==='accepted');
    const decided=accepted.length+subs.filter(s=>s.status==='rejected').length;
    const areaAccepted={};let communityAccepted=0;
    for(const s of accepted){const a=contract(s.missionId)?.area||'?';areaAccepted[a]=(areaAccepted[a]||0)+1;if(a==='task')communityAccepted++}
    const mentorNotes=d.mentorships.filter(m=>m.menteeId===u.id).reduce((t,m)=>t+m.notes.filter(n=>n.by==='mentor').length,0);
    // Çırak mentörlük: en az 14 gün sürmüş ve öğrencisi o sırada gerçek bir kabul edilen katkı üretmiş olmalı (sahte hesap halkasına karşı)
    const apprenticeSeeds=d.mentorships.filter(m=>m.apprentice?.userId===u.id&&m.apprentice.status==='active'&&['active','ended'].includes(m.status)&&clock()-m.apprentice.since>=RULES.agac.apprenticeDays*DAY
      &&d.submissions.some(s=>s.userId===m.menteeId&&s.status==='accepted'&&Date.parse(s.updatedAt)>=m.acceptedAt)).length;
    const app=d.treeApps.filter(a=>a.userId===u.id).sort((a,b)=>b.createdAt-a.createdAt)[0];
    const evalPasses=app&&app.status!=='failed'?app.evals.filter(e=>e.pass).length:0;
    return {xp,accepted:accepted.length,areas:new Set(accepted.map(s=>contract(s.missionId)?.area)).size,decided,tenureDays:(clock()-Date.parse(u.createdAt))/DAY,
      apprenticeSeeds,evalPasses,areaAccepted,communityAccepted,mentorNotes};
  }
  const growthFor=(d,u)=>{const s=stats(d,u);return {s,g:computeGrowth({...s,founding:u.foundingTree,fidanAt:u.fidanAt,treeAt:u.treeAt})}};
  function recordStage(d,u,stage){
    ensure(d);if(d.stageEvents.some(e=>e.userId===u.id&&e.stage===stage))return;
    d.stageEvents.push({userId:u.id,stage,at:clock(),mentorIds:d.mentorships.filter(m=>m.menteeId===u.id&&m.status==='active').map(m=>m.mentorId)});
    audit(d,'system','stage.'+stage,u.id,{});
  }
  // Kalıcı, tek yönlü ilerleme: bir kez Fidan olan geri düşmez (zamanla gelişim; ceza yok)
  function syncStage(d,u){
    const {g}=growthFor(d,u);
    if(g.reachedFidan&&!u.fidanAt){u.fidanAt=clock();recordStage(d,u,'fidan')}
    if(isTree(u)){if(!u.fidanAt)u.fidanAt=clock();recordStage(d,u,'agac')}
    return growthFor(d,u).g.stage;
  }
  const serReq=r=>({key:r.key,label:r.label,have:r.have,need:r.need,met:r.met,pct:r.pct,display:r.fmt(r.have),gate:r.gate||null});
  const loadOf=(d,uid)=>d.mentorships.filter(m=>m.mentorId===uid&&m.status==='active').length;

  function mentorshipView(d,m,viewer){
    return {id:m.id,status:m.status,message:m.message,area:m.area,createdAt:m.createdAt,acceptedAt:m.acceptedAt||null,endedAt:m.endedAt||null,
      mentor:person(d,m.mentorId),mentee:person(d,m.menteeId),notes:m.notes.map(n=>({by:n.by,text:n.text,at:n.at})),
      apprentice:m.apprentice?{...person(d,m.apprentice.userId),status:m.apprentice.status,since:m.apprentice.since||null}:null,
      role:viewer===m.mentorId?'mentor':viewer===m.menteeId?'mentee':'apprentice'};
  }
  function view(d,u){
    const {s,g}=growthFor(d,u);ensure(d);
    const mine=d.mentorships.filter(m=>m.mentorId===u.id||m.menteeId===u.id||m.apprentice?.userId===u.id).sort((a,b)=>b.createdAt-a.createdAt);
    const app=d.treeApps.filter(a=>a.userId===u.id).sort((a,b)=>b.createdAt-a.createdAt)[0];
    const retryAt=app?.status==='failed'?app.decidedAt+RULES.retryDays*DAY:0;
    return {stage:g.stage,meta:g.meta,founding:!!u.foundingTree,progress:g.progress,next:g.next,requirements:g.requirements.map(serReq),canApplyTree:g.canApplyTree&&!(app&&app.status==='open')&&clock()>=retryAt,
      retryAt:retryAt>clock()?retryAt:null,
      stats:{xp:s.xp,accepted:s.accepted,areas:s.areas,decided:s.decided,tenureDays:Math.floor(s.tenureDays),apprenticeSeeds:s.apprenticeSeeds,mentorNotes:s.mentorNotes},
      route:u.route||null,routeProgress:routeProgress(u.route,s),
      mentorships:mine.map(m=>mentorshipView(d,m,u.id)),load:isTree(u)?loadOf(d,u.id):null,cap:RULES.mentorCap,
      application:app?{id:app.id,status:app.status,createdAt:app.createdAt,evals:app.evals.map((e,i)=>({label:'Değerlendirici '+(i+1),pass:e.pass,feedback:e.feedback,rubric:e.rubric}))}:null,
      independentOfGame:true};
  }
  const mentorAreas=(d,uid)=>[...new Set(d.submissions.filter(s=>s.userId===uid&&s.status==='accepted').map(s=>contract(s.missionId)?.area).filter(Boolean))];

  /* ---------- Orman metrikleri ---------- */
  function forestMetrics(d,f){
    ensure(d);const members=f.members.filter(m=>m.status==='member').map(m=>m.userId);
    const ms=d.mentorships.filter(m=>members.includes(m.mentorId)&&['active','ended'].includes(m.status)&&m.acceptedAt);
    const active=ms.filter(m=>m.status==='active'),mentees=new Map();for(const m of ms){const c=mentees.get(m.menteeId);if(!c||m.acceptedAt<c)mentees.set(m.menteeId,m.acceptedAt)}
    const grown=stage=>d.stageEvents.filter(e=>e.stage===stage&&mentees.has(e.userId)&&e.at>=mentees.get(e.userId)).length;
    const recent=clock()-30*DAY,activeIds=[...new Set(active.map(m=>m.menteeId))];
    const alive=activeIds.filter(uid=>d.submissions.some(s=>s.userId===uid&&Date.parse(s.updatedAt)>=recent)).length;
    const loads=members.map(uid=>loadOf(d,uid));
    const areas=new Set(members.flatMap(uid=>mentorAreas(d,uid)));
    const m={trees:members.length,seeds:activeIds.length,totalMentored:mentees.size,saplingsGrown:grown('fidan'),treesGrown:grown('agac'),
      retention:activeIds.length?alive/activeIds.length:null,overloaded:loads.filter(l=>l>=RULES.mentorCap).length,loadMax:Math.max(0,...loads),areas:areas.size,ageDays:Math.floor((clock()-f.createdAt)/DAY)};
    return {...m,status:forestStatus(m)};
  }
  const forestView=(d,f,viewer)=>({id:f.id,name:f.name,mission:f.mission,area:f.area,areaLabel:AREAS[f.area]||f.area,createdAt:f.createdAt,
    members:f.members.map(m=>({...person(d,m.userId),status:m.status})),metrics:forestMetrics(d,f),
    me:viewer?(f.members.find(m=>m.userId===viewer.id)?.status||null):null,founderId:f.founderId});
  const forestCount=(d,uid)=>d.forests.filter(f=>f.members.some(m=>m.userId===uid&&m.status==='member')).length;

  /* ---------- Ağaç adaylığı: bağımsız değerlendirme ---------- */
  function evalBlock(d,ev,app){
    if(!isTree(ev))return 'Yalnızca Ağaç düzeyindeki mentörler değerlendirebilir.';
    if(ev.id===app.userId)return 'Kendi adaylığını değerlendiremezsin.';
    if(app.evals.some(e=>e.evaluatorId===ev.id))return 'Bu adaylığı zaten değerlendirdin.';
    if(d.treeConflicts.some(c=>c.appId===app.id&&c.evaluatorId===ev.id))return 'Bu adaylık için çıkar çatışması beyan ettin.';
    if(d.mentorships.some(m=>(m.mentorId===ev.id&&(m.menteeId===app.userId||m.apprentice?.userId===app.userId))||(m.menteeId===ev.id&&m.mentorId===app.userId)||(m.apprentice?.userId===ev.id&&(m.mentorId===app.userId||m.menteeId===app.userId))))
      return 'Mentörlük bağın olan birini değerlendiremezsin (bağımsızlık).';
    const since=clock()-90*DAY;
    if(d.treeApps.some(a=>a.userId===ev.id&&a.evals.some(e=>e.evaluatorId===app.userId&&e.pass&&e.at>=since)))return 'Bu kişi yakın zamanda senin adaylığını onayladı; karşılıklı değerlendirme engellenir.';
    return null;
  }

  const routes=[
    ['GET','/api/me/growth',({user})=>{need(user);return db.tx(d=>{const u=byId(d,user.id);syncStage(d,u);return view(d,u)})}],

    ['POST','/api/me/route',({user,body})=>{
      need(user);const areas=[...new Set(Array.isArray(body.areas)?body.areas:[])].filter(a=>ROUTE_AREAS.includes(a));
      if(!areas.length||areas.length>2)fail(400,'invalid_areas','1–2 alan seç.');
      const goal=str(body.goal,5,200,'goal');
      return db.tx(d=>{const u=byId(d,user.id);u.route={areas,goal,at:clock()};audit(d,u.id,'route.set',u.id,{areas});return view(d,u)});
    }],

    // Çırak seçebilmeleri için yalnız Ağaçlar görür: Fidan dizini (e-posta yok)
    ['GET','/api/saplings',({user})=>{need(user);const d=db.data;ensure(d);if(!isTree(byId(d,user.id)))fail(403,'forbidden','Bu dizini yalnız Ağaç düzeyindeki mentörler görür.');
      const busy=new Set(d.mentorships.filter(m=>m.apprentice&&['invited','active'].includes(m.apprentice.status)&&['active','pending'].includes(m.status)).map(m=>m.apprentice.userId));
      return {saplings:d.users.filter(u=>!isTree(u)&&growthFor(d,u).g.stage==='fidan'&&!busy.has(u.id)).map(u=>{const s=stats(d,u);return {id:u.id,name:u.name,accepted:s.accepted,areas:s.areas,tenureDays:Math.floor(s.tenureDays)}})}}],

    ['GET','/api/mentors',({user,body,req})=>{
      const area=new URL(req.url,'http://x').searchParams.get('area');const d=db.data;ensure(d);
      return {cap:RULES.mentorCap,mentors:d.users.filter(isTree).filter(u=>!user||u.id!==user.id).map(u=>({id:u.id,name:u.name,founding:!!u.foundingTree,areas:mentorAreas(d,u.id).map(a=>({id:a,label:AREAS[a]||a})),load:loadOf(d,u.id),cap:RULES.mentorCap,
        mentored:new Set(d.mentorships.filter(m=>m.mentorId===u.id&&['active','ended'].includes(m.status)&&m.acceptedAt).map(m=>m.menteeId)).size}))
        .filter(m=>!area||m.areas.some(a=>a.id===area)).sort((a,b)=>a.load-b.load)};
    }],

    ['POST','/api/mentorships',({user,body})=>{
      need(user);const message=str(body.message,20,500,'message');
      return db.tx(d=>{
        ensure(d);const me=byId(d,user.id),mentor=byId(d,String(body.mentorId||''));
        if(!mentor||!isTree(mentor))fail(404,'mentor_not_found','Bu kişi mentör (Ağaç) değil.');
        if(mentor.id===me.id)fail(400,'self','Kendine mentör olamazsın.');
        if(isTree(me))fail(409,'tree_no_mentee','Ağaç düzeyindeki üyeler mentör olur; mentörlük talebi gönderemez.');
        if(d.mentorships.some(m=>m.menteeId===me.id&&m.status==='active'))fail(409,'already_mentored','Zaten bir mentörün var. Önce onu sonlandır.');
        if(d.mentorships.some(m=>m.menteeId===me.id&&m.mentorId===mentor.id&&['pending','active'].includes(m.status)))fail(409,'duplicate','Bu mentöre zaten bir talebin var.');
        if(d.mentorships.filter(m=>m.menteeId===me.id&&m.status==='pending').length>=3)fail(409,'too_many_requests','En fazla 3 bekleyen talebin olabilir.');
        if(loadOf(d,mentor.id)>=RULES.mentorCap)fail(409,'mentor_full',`Bu mentör şu an dolu (en fazla ${RULES.mentorCap} öğrenci).`);
        const m={id:id(),mentorId:mentor.id,menteeId:me.id,message,area:me.route?.areas?.[0]||null,status:'pending',createdAt:clock(),notes:[],apprentice:null};
        d.mentorships.push(m);audit(d,me.id,'mentorship.request',m.id,{mentor:mentor.id});return {mentorship:mentorshipView(d,m,me.id)};
      });
    }],

    ['POST','/api/mentorships/:id/respond',({user,params,body})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const m=d.mentorships.find(x=>x.id===params.id&&x.mentorId===user.id)||fail(404,'not_found','Talep bulunamadı.');
        if(m.status!=='pending')fail(409,'not_pending','Bu talep artık beklemede değil.');
        if(body.accept===true){
          if(loadOf(d,user.id)>=RULES.mentorCap)fail(409,'mentor_full',`En fazla ${RULES.mentorCap} öğrenciye mentörlük yapabilirsin.`);
          if(d.mentorships.some(x=>x.menteeId===m.menteeId&&x.status==='active'))fail(409,'already_mentored','Bu kişi başka bir mentörle eşleşti.');
          Object.assign(m,{status:'active',acceptedAt:clock()});
        }else Object.assign(m,{status:'declined',endedAt:clock()});
        audit(d,user.id,'mentorship.'+(body.accept===true?'accept':'decline'),m.id,{});return {mentorship:mentorshipView(d,m,user.id)};
      });
    }],

    ['POST','/api/mentorships/:id/end',({user,params,body})=>{
      need(user);const reason=str(body.reason,5,300,'reason');
      return db.tx(d=>{
        ensure(d);const m=d.mentorships.find(x=>x.id===params.id&&(x.mentorId===user.id||x.menteeId===user.id))||fail(404,'not_found','Mentörlük bulunamadı.');
        if(!['active','pending'].includes(m.status))fail(409,'not_active','Bu mentörlük zaten bitti.');
        Object.assign(m,{status:m.status==='pending'?'declined':'ended',endedAt:clock(),endReason:reason,endedBy:user.id});audit(d,user.id,'mentorship.end',m.id,{});return {ok:true};
      });
    }],

    ['POST','/api/mentorships/:id/note',({user,params,body})=>{
      need(user);const text=str(body.text,10,600,'text');
      return db.tx(d=>{
        ensure(d);const m=d.mentorships.find(x=>x.id===params.id&&(x.mentorId===user.id||x.menteeId===user.id))||fail(404,'not_found','Mentörlük bulunamadı.');
        if(m.status!=='active')fail(409,'not_active','Notlar yalnız etkin mentörlükte yazılır.');
        if(m.notes.filter(n=>n.at>clock()-DAY).length>=10)fail(429,'note_limit','Bugün çok not yazdın.');
        m.notes.push({by:m.mentorId===user.id?'mentor':'mentee',text,at:clock()});return {mentorship:mentorshipView(d,m,user.id)};
      });
    }],

    ['POST','/api/mentorships/:id/apprentice',({user,params,body})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const m=d.mentorships.find(x=>x.id===params.id&&x.mentorId===user.id)||fail(404,'not_found','Mentörlük bulunamadı.');
        if(m.status!=='active')fail(409,'not_active','Çırak yalnız etkin mentörlüğe eklenir.');
        if(m.apprentice&&m.apprentice.status!=='declined')fail(409,'has_apprentice','Bu mentörlükte zaten bir çırak var.');
        const ap=byId(d,String(body.userId||''));if(!ap)fail(404,'not_found','Üye bulunamadı.');
        if([m.mentorId,m.menteeId].includes(ap.id))fail(400,'invalid_apprentice','Bu kişi çırak olamaz.');
        if(isTree(ap)||growthFor(d,ap).g.stage!=='fidan')fail(409,'not_sapling','Çırak mentör Fidan düzeyinde olmalı.');
        if(d.mentorships.some(x=>x.apprentice?.userId===ap.id&&['active','invited'].includes(x.apprentice.status)&&['active','pending'].includes(x.status)))fail(409,'apprentice_busy','Bu Fidan zaten bir mentörlükte çırak.');
        m.apprentice={userId:ap.id,status:'invited',invitedAt:clock()};audit(d,user.id,'apprentice.invite',m.id,{apprentice:ap.id});return {mentorship:mentorshipView(d,m,user.id)};
      });
    }],

    ['POST','/api/mentorships/:id/apprentice/accept',({user,params,body})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const m=d.mentorships.find(x=>x.apprentice?.userId===user.id&&x.id===params.id&&x.apprentice.status==='invited')||fail(404,'not_found','Davet bulunamadı.');
        if(body.accept===true){m.apprentice.status='active';m.apprentice.since=clock()}else m.apprentice.status='declined';
        audit(d,user.id,'apprentice.'+(body.accept===true?'accept':'decline'),m.id,{});return {mentorship:mentorshipView(d,m,user.id)};
      });
    }],

    /* ----- Mentörler Birliği: Ağaç adaylığı ----- */
    ['POST','/api/tree-applications',({user,body})=>{
      need(user);const statement=str(body.statement,100,1500,'statement');
      return db.tx(d=>{
        ensure(d);const u=byId(d,user.id),{g}=growthFor(d,u);
        if(g.stage!=='fidan')fail(409,'not_sapling','Ağaç adaylığı için önce Fidan olmalısın.');
        if(!g.canApplyTree)fail(409,'not_ready','Önkoşullar (XP, katkı, alan, oran, süre, çırak mentörlük) henüz tamamlanmadı.');
        const last=d.treeApps.filter(a=>a.userId===u.id).sort((a,b)=>b.createdAt-a.createdAt)[0];
        if(last?.status==='open')fail(409,'already_open','Açık bir adaylığın var.');
        if(last?.status==='failed'&&clock()<last.decidedAt+RULES.retryDays*DAY)fail(409,'retry_later',`Tekrar başvurmak için ${RULES.retryDays} gün beklemelisin.`);
        const a={id:id(),userId:u.id,statement,status:'open',createdAt:clock(),evals:[]};d.treeApps.push(a);audit(d,u.id,'tree.apply',a.id,{});return {ok:true,id:a.id};
      });
    }],

    ['GET','/api/tree-applications/queue',({user})=>{
      need(user);const d=db.data;ensure(d);const u=byId(d,user.id);if(!isTree(u))fail(403,'forbidden','Bu kuyruğu yalnız Ağaç düzeyindeki mentörler görür.');
      return {need:RULES.agac.evalPasses,rubric:RUBRIC,queue:d.treeApps.filter(a=>a.status==='open'&&!evalBlock(d,u,a)).map(a=>{
        const au=byId(d,a.userId),{s}=growthFor(d,au);
        return {id:a.id,candidate:'Fidan #'+a.id.slice(0,5),statement:a.statement,stats:{xp:s.xp,accepted:s.accepted,areas:s.areas,tenureDays:Math.floor(s.tenureDays),apprenticeSeeds:s.apprenticeSeeds},
          contributions:d.submissions.filter(x=>x.userId===au.id&&x.status==='accepted').map(x=>contract(x.missionId)?.title).filter(Boolean).slice(0,12),evaluated:a.evals.length}})};
    }],

    ['POST','/api/tree-applications/:id/conflict',({user,params,body})=>{
      need(user);const reason=str(body.reason||'Çıkar çatışması beyanı',3,300,'reason');
      return db.tx(d=>{ensure(d);if(!isTree(byId(d,user.id)))fail(403,'forbidden','Yetkin yok.');d.treeApps.find(a=>a.id===params.id)||fail(404,'not_found','Adaylık bulunamadı.');
        if(!d.treeConflicts.some(c=>c.appId===params.id&&c.evaluatorId===user.id))d.treeConflicts.push({appId:params.id,evaluatorId:user.id,reason});audit(d,user.id,'tree.conflict',params.id,{reason});return {ok:true}});
    }],

    ['POST','/api/tree-applications/:id/evaluate',({user,params,body})=>{
      need(user);const feedback=str(body.feedback,40,1500,'feedback');
      const rubric=Object.fromEntries(RUBRIC.map(k=>[k,body.rubric?.[k]===true]));
      return db.tx(d=>{
        ensure(d);const ev=byId(d,user.id),a=d.treeApps.find(x=>x.id===params.id)||fail(404,'not_found','Adaylık bulunamadı.');
        if(a.status!=='open')fail(409,'not_open','Bu adaylık artık açık değil.');
        const block=evalBlock(d,ev,a);if(block)fail(403,'eval_blocked',block);
        const pass=RUBRIC.every(k=>rubric[k]);a.evals.push({evaluatorId:ev.id,pass,rubric,feedback,at:clock()});
        const passes=a.evals.filter(e=>e.pass).length,fails=a.evals.length-passes;let outcome='open';
        if(passes>=RULES.agac.evalPasses){
          a.status='passed';a.decidedAt=clock();const u=byId(d,a.userId);u.treeAt=clock();if(!u.roles.includes('mentor'))u.roles.push('mentor');recordStage(d,u,'agac');outcome='passed';audit(d,ev.id,'tree.passed',a.id,{});
        }else if(fails>=RULES.agac.evalPasses){a.status='failed';a.decidedAt=clock();outcome='failed';audit(d,ev.id,'tree.failed',a.id,{})}
        else audit(d,ev.id,'tree.evaluate',a.id,{pass});
        return {ok:true,outcome};
      });
    }],

    /* ----- Ormanlar ----- */
    ['GET','/api/forests',({user})=>{const d=db.data;ensure(d);return {rules:RULES.forest,forests:d.forests.map(f=>forestView(d,f,user)).sort((a,b)=>b.metrics.trees-a.metrics.trees)}}],

    ['POST','/api/forests',({user,body})=>{
      need(user);const name=str(body.name,3,40,'name'),mission=str(body.mission,40,400,'mission');if(!AREAS[body.area])fail(400,'invalid_area','Geçerli bir alan seç.');
      return db.tx(d=>{
        ensure(d);const u=byId(d,user.id);if(!isTree(u))fail(403,'tree_only','Orman kurmak için Ağaç düzeyinde olmalısın.');
        if(forestCount(d,u.id)>=RULES.maxForestsPerTree)fail(409,'forest_limit',`En fazla ${RULES.maxForestsPerTree} ormanda yer alabilirsin.`);
        if(d.forests.some(f=>f.name.toLowerCase()===name.toLowerCase()))fail(409,'name_taken','Bu orman adı kullanılıyor.');
        const f={id:id(),name,mission,area:body.area,createdAt:clock(),founderId:u.id,members:[{userId:u.id,status:'member',at:clock()}]};
        d.forests.push(f);audit(d,u.id,'forest.create',f.id,{});return {forest:forestView(d,f,u)};
      });
    }],

    ['POST','/api/forests/:id/invite',({user,params,body})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const f=d.forests.find(x=>x.id===params.id&&x.members.some(m=>m.userId===user.id&&m.status==='member'))||fail(404,'not_found','Orman bulunamadı ya da üyesi değilsin.');
        const t=byId(d,String(body.userId||''));if(!t||!isTree(t))fail(404,'not_tree','Davet edilen kişi Ağaç düzeyinde değil.');
        if(f.members.some(m=>m.userId===t.id))fail(409,'already','Bu kişi zaten ormanda ya da davetli.');
        f.members.push({userId:t.id,status:'invited',at:clock()});audit(d,user.id,'forest.invite',f.id,{invitee:t.id});return {forest:forestView(d,f,byId(d,user.id))};
      });
    }],

    ['POST','/api/forests/:id/join',({user,params})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const f=d.forests.find(x=>x.id===params.id)||fail(404,'not_found','Orman bulunamadı.');
        const m=f.members.find(x=>x.userId===user.id&&x.status==='invited')||fail(403,'not_invited','Bu ormana davet edilmedin.');
        if(forestCount(d,user.id)>=RULES.maxForestsPerTree)fail(409,'forest_limit',`En fazla ${RULES.maxForestsPerTree} ormanda yer alabilirsin.`);
        m.status='member';m.at=clock();audit(d,user.id,'forest.join',f.id,{});return {forest:forestView(d,f,byId(d,user.id))};
      });
    }],

    ['POST','/api/forests/:id/leave',({user,params})=>{
      need(user);
      return db.tx(d=>{
        ensure(d);const f=d.forests.find(x=>x.id===params.id&&x.members.some(m=>m.userId===user.id))||fail(404,'not_found','Orman bulunamadı.');
        f.members=f.members.filter(m=>m.userId!==user.id);
        const real=f.members.filter(m=>m.status==='member');
        if(!real.length)d.forests=d.forests.filter(x=>x!==f);else if(f.founderId===user.id)f.founderId=real.sort((a,b)=>a.at-b.at)[0].userId;
        audit(d,user.id,'forest.leave',f.id,{});return {ok:true};
      });
    }],

    ['POST','/api/admin/users/:id/founding-tree',({user,params,body})=>{
      need(user,'admin');
      return db.tx(d=>{
        ensure(d);const u=byId(d,params.id)||fail(404,'not_found','Kullanıcı bulunamadı.');
        if(body.enabled===true){u.foundingTree=true;if(!u.roles.includes('mentor'))u.roles.push('mentor');recordStage(d,u,'agac')}
        else{u.foundingTree=false;if(!u.treeAt)u.roles=u.roles.filter(r=>r!=='mentor')}
        audit(d,user.id,'founding-tree.'+(body.enabled===true?'grant':'revoke'),u.id,{});return {ok:true};
      });
    }]
  ];

  const stageOf=(d,u)=>growthFor(d,u).g.stage;
  const quick=(d,u)=>{const {g}=growthFor(d,u);return {stage:g.stage,progress:g.progress,next:g.next}};
  const counts=d=>{ensure(d);const c={tohum:0,fidan:0,agac:0};for(const u of d.users)c[stageOf(d,u)]++;return {...c,forests:d.forests.length,mentorships:d.mentorships.filter(m=>m.status==='active').length}};
  return {routes,syncStage,stageOf,quick,counts,isTree,STAGES,FOREST};
}
