// Scola yerel pilot API'si: hesap → görev teslimi → bağımsız değerlendirme → sunucu XP.
// Bağımlılıksızdır (yalnız Node yerleşik modülleri). Hak, XP ve rol kontrollerinin
// tamamı burada yapılır; istemci yalnızca istek gönderir.
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {openDb} from './db.mjs';
import {missions,missionById} from './missions.mjs';
import {createHub,MAPS} from './hub.mjs';
import {createGrowth} from './growth.mjs';
import {createMarket} from './market.mjs';

const AGE_BANDS=['13-15','16-17','18-24','25+'],AREAS=['art','culture','music','game','trade','tech','craft','content'],HOURS=['0-1','2-4','5-8','9+'],ROLES=['do','post','teach','team'],SURVEY_PER_HOUR=10,TASK_XP=100,MIN_REWARD=50,MAX_REWARD=5000,MAX_OPEN_TASKS=5,SESSION_DAYS=14,MAX_BODY=64*1024,FEEDBACK_MIN=40,RING_DAYS=30;
const now=()=>new Date().toISOString();
const id=()=>randomBytes(9).toString('base64url');
const sha=s=>createHash('sha256').update(s).digest('hex');

class HttpError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}
const fail=(status,code,message)=>{throw new HttpError(status,code,message)};

function hashPassword(pw){const salt=randomBytes(16);return 'scrypt$'+salt.toString('hex')+'$'+scryptSync(pw,salt,32).toString('hex')}
function checkPassword(pw,stored){const [,salt,hash]=String(stored).split('$');if(!salt||!hash)return false;const a=scryptSync(pw,Buffer.from(salt,'hex'),32),b=Buffer.from(hash,'hex');return a.length===b.length&&timingSafeEqual(a,b)}

const str=(v,min,max,label)=>{const s=typeof v==='string'?v.trim():'';if(s.length<min||s.length>max)fail(400,'invalid_'+label,`${label}: ${min}–${max} karakter olmalı.`);return s};

export function createApi({dbFile=null,adminEmails=[],secureCookie=false,commissionPct=10,marketCommissionPct=8,clock=Date.now}={}){
  const db=openDb(dbFile);
  // TEST MODU: gerçek para hareketi yok. Emanet defteri, ödeme sağlayıcısı bağlandığında
  // onun bloke/serbest bırakma çağrılarının yerini alacak sunucu tarafı kayıttır.
  const taskContract=t=>({id:t.id,title:t.title,area:'task',xp:TASK_XP,maxAttempts:1,community:true,posterId:t.posterId,scope:t.scope,duration:t.duration,acceptance:t.acceptance,
    payment:{type:'escrow-test',amount:t.reward,currency:'TRY',label:`${t.reward} ₺ emanette · TEST MODU`,detail:'Ücret görev açılırken emanete alınır (gerçek para yok). Kabulde katılımcıya komisyon düşülerek serbest bırakılır; kimseye ödenmeden iptal edilirse iade edilir.'},
    license:'Kabul edilen teslimin kullanım hakkı, ödeme serbest bırakılınca görevi açan kişiye geçer. Kabul edilmeyen teslimin hakları sende kalır.',
    share:`Tek kazanan. Scola komisyonu %${commissionPct}, ödemeden düşülür.`});
  const contract=cid=>missionById(cid)||(()=>{const t=db.data.tasks.find(t=>t.id===cid);return t?taskContract(t):null})();
  const admins=new Set(adminEmails.map(e=>e.trim().toLowerCase()).filter(Boolean));
  const loginFailures=new Map(),surveyHits=new Map();
  const hub=createHub({db});

  const audit=(d,actor,action,target,detail={})=>d.auditLog.push({id:id(),at:now(),actor,action,target,detail});
  const publicUser=u=>({id:u.id,name:u.name,email:u.email,interest:u.interest,roles:u.roles,stamps:u.stamps||[],createdAt:u.createdAt});
  const xpOf=userId=>db.data.xpEvents.filter(e=>e.userId===userId).reduce((s,e)=>s+e.points,0);
  const applyAdminRole=(d,u)=>{if(admins.has(u.email)&&!u.roles.includes('admin')){u.roles.push('admin');if(!u.roles.includes('reviewer'))u.roles.push('reviewer');audit(d,'system','role.bootstrap',u.id,{roles:u.roles})}};

  function startSession(d,user){
    const token=randomBytes(32).toString('base64url');
    d.sessions=d.sessions.filter(s=>s.expiresAt>now());
    d.sessions.push({tokenHash:sha(token),userId:user.id,createdAt:now(),expiresAt:new Date(Date.now()+SESSION_DAYS*864e5).toISOString()});
    return `scola_sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS*86400}${secureCookie?'; Secure':''}`;
  }
  function currentUser(req){
    const m=/(?:^|;\s*)scola_sid=([^;]+)/.exec(req.headers.cookie||'');if(!m)return null;
    const s=db.data.sessions.find(s=>s.tokenHash===sha(m[1])&&s.expiresAt>now());
    return s?db.data.users.find(u=>u.id===s.userId)||null:null;
  }
  const need=(user,role)=>{if(!user)fail(401,'auth_required','Önce giriş yap.');if(role&&!user.roles.includes(role))fail(403,'forbidden','Bu işlem için yetkin yok.');return user};

  const growth=createGrowth({db,need,fail,str,id,now,audit,contract,clock});
  const market=createMarket({db,need,fail,str,id,audit,clock,commissionPct:marketCommissionPct});
  const submissionView=(s,{forAuthor=false}={})=>{
    const m=contract(s.missionId);
    const reviews=db.data.reviews.filter(r=>r.submissionId===s.id).map(r=>({id:r.id,decision:r.decision,checks:r.checks,feedback:r.feedback,createdAt:r.createdAt,reviewer:forAuthor?'Bağımsız değerlendirici':r.reviewerId}));
    const xpEvent=db.data.xpEvents.find(e=>e.sourceId===s.id);
    return {id:s.id,missionId:s.missionId,missionTitle:m?.title,title:s.title,output:s.output,impact:s.impact,status:s.status,attempt:s.attempt,createdAt:s.createdAt,updatedAt:s.updatedAt,appeal:s.appeal||null,reviews,xpAwarded:xpEvent?.points||0};
  };
  const blindAuthor=(s)=>'Katılımcı #'+sha(s.userId+':'+s.id).slice(0,6);

  // Bir değerlendirici bu teslimi inceleyebilir mi? Kendi teslimi, daha önce incelediği
  // teslim, beyan edilmiş çıkar çatışması ve karşılıklı kabul halkası engellenir.
  function reviewBlock(reviewer,s){
    if(s.userId===reviewer.id)return 'Kendi teslimini değerlendiremezsin.';
    if(contract(s.missionId)?.posterId===reviewer.id)return 'Kendi açtığın görevin tesliminde değerlendirici olamazsın (çıkar çatışması).';
    if(db.data.reviews.some(r=>r.submissionId===s.id&&r.reviewerId===reviewer.id))return 'Bu teslimi daha önce değerlendirdin; itiraz başka bir değerlendiriciye gider.';
    if(db.data.conflicts.some(c=>c.submissionId===s.id&&c.reviewerId===reviewer.id))return 'Bu teslim için çıkar çatışması beyan ettin.';
    const since=new Date(Date.now()-RING_DAYS*864e5).toISOString();
    const ring=db.data.reviews.some(r=>r.reviewerId===s.userId&&r.decision==='accept'&&r.createdAt>since&&db.data.submissions.find(x=>x.id===r.submissionId)?.userId===reviewer.id);
    if(ring)return `Bu katılımcı son ${RING_DAYS} günde senin bir teslimini kabul etti; karşılıklı değerlendirme engellenir.`;
    return null;
  }

  const routes=[
    ['GET','/api/health',()=>({ok:true,mode:'local-pilot',payments:false})],

    ['POST','/api/auth/register',({body,res})=>db.tx(d=>{
      const name=str(body.name,2,40,'name'),email=str(body.email,5,120,'email').toLowerCase(),password=typeof body.password==='string'?body.password:'';
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'invalid_email','Geçerli bir e-posta yaz.');
      if(password.length<8||password.length>200)fail(400,'weak_password','Şifre en az 8 karakter olmalı.');
      if(d.users.some(u=>u.email===email))fail(409,'email_taken','Bu e-posta ile bir hesap var.');
      const user={id:id(),name,email,interest:typeof body.interest==='string'?body.interest.trim().slice(0,100):'',passwordHash:hashPassword(password),roles:['producer'],createdAt:now()};
      d.users.push(user);applyAdminRole(d,user);audit(d,user.id,'user.register',user.id);
      res.setHeader('Set-Cookie',startSession(d,user));
      return {user:publicUser(user),xp:0};
    })],

    ['POST','/api/auth/login',({body,res,req})=>{
      const email=String(body.email||'').trim().toLowerCase(),key=email+'|'+(req.socket.remoteAddress||'');
      const f=loginFailures.get(key);if(f&&f.count>=10&&Date.now()-f.first<15*60e3)fail(429,'rate_limited','Çok fazla deneme. 15 dakika sonra tekrar dene.');
      const user=db.data.users.find(u=>u.email===email);
      if(!user||!checkPassword(String(body.password||''),user.passwordHash)){
        const cur=f&&Date.now()-f.first<15*60e3?f:{count:0,first:Date.now()};cur.count++;loginFailures.set(key,cur);
        fail(401,'bad_credentials','E-posta veya şifre hatalı.');
      }
      loginFailures.delete(key);
      return db.tx(d=>{const u=d.users.find(x=>x.id===user.id);applyAdminRole(d,u);res.setHeader('Set-Cookie',startSession(d,u));return {user:publicUser(u),xp:xpOf(u.id)}});
    }],

    ['POST','/api/auth/logout',({req,res})=>{
      const m=/(?:^|;\s*)scola_sid=([^;]+)/.exec(req.headers.cookie||'');
      if(m)db.tx(d=>{d.sessions=d.sessions.filter(s=>s.tokenHash!==sha(m[1]))});
      res.setHeader('Set-Cookie','scola_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
      return {ok:true};
    }],

    ['GET','/api/me',({user})=>{
      if(!user)return {user:null};
      const subs=db.data.submissions.filter(s=>s.userId===user.id);
      const earned=db.data.escrow.filter(e=>e.status==='released'&&e.payeeId===user.id).reduce((t,e)=>t+e.net,0),held=db.data.escrow.filter(e=>e.status==='held'&&e.posterId===user.id).reduce((t,e)=>t+e.amount,0);
      const stg=growth.stageOf(db.data,user),meta=growth.STAGES.find(x=>x.id===stg);
      const qk=growth.quick(db.data,user);
      return {stage:stg,stageName:meta.name,stageEmoji:meta.emoji,stageProgress:qk.progress,nextStage:qk.next,user:publicUser(user),xp:xpOf(user.id),accepted:subs.filter(s=>s.status==='accepted').length,pending:subs.filter(s=>['submitted','appealed'].includes(s.status)).length,earned:earned/100,held:held/100,testMode:true};
    }],

    ['GET','/api/missions',({user})=>({missions:missions.map(m=>{
      const mine=user?db.data.submissions.filter(s=>s.userId===user.id&&s.missionId===m.id):[];
      const latest=mine.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
      return {...m,attemptsUsed:mine.length,myStatus:latest?.status||null};
    })})],

    ['POST','/api/missions/:id/submissions',({user,params,body})=>{
      need(user);
      const m=contract(params.id)||fail(404,'mission_not_found','Görev bulunamadı.');
      if(m.community){if(m.posterId===user.id)fail(403,'own_task','Kendi görevine teslim yapamazsın.');if(db.data.tasks.find(t=>t.id===m.id).status!=='open')fail(409,'task_closed','Bu görev artık açık değil.')}
      const title=str(body.title,4,120,'title'),output=str(body.output,100,5000,'output'),impact=typeof body.impact==='string'?body.impact.slice(0,60):'';
      return db.tx(d=>{
        const mine=d.submissions.filter(s=>s.userId===user.id&&s.missionId===m.id);
        if(mine.some(s=>s.status==='accepted'))fail(409,'already_accepted','Bu görevdeki katkın zaten kabul edildi.');
        const open=mine.find(s=>['submitted','appealed'].includes(s.status));
        if(open)fail(409,'already_pending','Bu görev için incelemede bekleyen bir teslimin var.');
        const revising=mine.find(s=>s.status==='revision');
        if(revising){
          Object.assign(revising,{title,output,impact,status:'submitted',updatedAt:now()});
          audit(d,user.id,'submission.revise',revising.id);
          return {submission:submissionView(revising,{forAuthor:true})};
        }
        if(mine.length>=m.maxAttempts)fail(409,'attempt_limit',`Bu deneme görevi için ${m.maxAttempts} teslim sınırına ulaştın.`);
        const s={id:id(),missionId:m.id,userId:user.id,title,output,impact,status:'submitted',attempt:mine.length+1,createdAt:now(),updatedAt:now()};
        d.submissions.push(s);audit(d,user.id,'submission.create',s.id,{missionId:m.id});
        return {submission:submissionView(s,{forAuthor:true})};
      });
    }],

    ['GET','/api/me/submissions',({user})=>{need(user);return {submissions:db.data.submissions.filter(s=>s.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(s=>submissionView(s,{forAuthor:true}))}}],

    ['POST','/api/submissions/:id/appeal',({user,params,body})=>{
      need(user);const reason=str(body.reason,20,1000,'reason');
      return db.tx(d=>{
        const s=d.submissions.find(s=>s.id===params.id&&s.userId===user.id)||fail(404,'not_found','Teslim bulunamadı.');
        if(s.status!=='rejected')fail(409,'not_appealable','Yalnızca reddedilen teslime itiraz edilebilir.');
        if(s.appeal)fail(409,'already_appealed','Bu teslim için itiraz hakkını kullandın.');
        Object.assign(s,{status:'appealed',appeal:{reason,createdAt:now()},updatedAt:now()});
        audit(d,user.id,'submission.appeal',s.id);
        return {submission:submissionView(s,{forAuthor:true})};
      });
    }],

    ['GET','/api/reviews/queue',({user})=>{
      need(user,'reviewer');
      const items=db.data.submissions.filter(s=>['submitted','appealed'].includes(s.status)&&!reviewBlock(user,s)).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
      return {queue:items.map(s=>{const m=contract(s.missionId);return {id:s.id,missionId:s.missionId,missionTitle:m.title,acceptance:m.acceptance,xp:m.xp,reward:m.community?m.payment.amount:0,author:blindAuthor(s),title:s.title,output:s.output,impact:s.impact,status:s.status,appeal:s.appeal||null,previousReviews:db.data.reviews.filter(r=>r.submissionId===s.id).map(r=>({decision:r.decision,feedback:r.feedback})),submittedAt:s.updatedAt}})};
    }],

    ['POST','/api/submissions/:id/conflict',({user,params,body})=>{
      need(user,'reviewer');const reason=str(body.reason||'Çıkar çatışması beyanı',3,300,'reason');
      return db.tx(d=>{
        d.submissions.find(s=>s.id===params.id)||fail(404,'not_found','Teslim bulunamadı.');
        if(!d.conflicts.some(c=>c.submissionId===params.id&&c.reviewerId===user.id))d.conflicts.push({submissionId:params.id,reviewerId:user.id,reason,createdAt:now()});
        audit(d,user.id,'review.conflict',params.id,{reason});return {ok:true};
      });
    }],

    ['POST','/api/submissions/:id/reviews',({user,params,body})=>{
      need(user,'reviewer');
      const decision=body.decision;if(!['accept','revise','reject'].includes(decision))fail(400,'invalid_decision','Karar: kabul, revizyon veya ret.');
      const feedback=str(body.feedback,FEEDBACK_MIN,2000,'feedback');
      return db.tx(d=>{
        const s=d.submissions.find(s=>s.id===params.id)||fail(404,'not_found','Teslim bulunamadı.');
        if(!['submitted','appealed'].includes(s.status))fail(409,'not_reviewable','Bu teslim şu anda incelemeye açık değil.');
        const block=reviewBlock(user,s);if(block)fail(403,'review_blocked',block);
        const m=contract(s.missionId);
        const checks=Array.isArray(body.checks)?m.acceptance.map((_,i)=>body.checks[i]===true):m.acceptance.map(()=>false);
        if(decision==='accept'&&!checks.every(Boolean))fail(400,'criteria_unmet','Kabul için bütün kabul ölçütleri karşılanmış olmalı.');
        const review={id:id(),submissionId:s.id,reviewerId:user.id,decision,checks,feedback,createdAt:now()};
        d.reviews.push(review);
        s.status={accept:'accepted',revise:'revision',reject:'rejected'}[decision];s.updatedAt=now();
        let xpAwarded=0;
        if(decision==='accept'){
          // İdempotent XP defteri: kullanıcı + görev başına tek olay.
          const key=`mission:${m.id}:${s.userId}`;
          if(!d.xpEvents.some(e=>e.key===key)){d.xpEvents.push({id:id(),key,userId:s.userId,points:m.xp,sourceType:'submission',sourceId:s.id,reviewId:review.id,createdAt:now()});xpAwarded=m.xp}
        }
        if(decision==='accept'){const mentee=d.users.find(x=>x.id===s.userId);if(mentee)growth.syncStage(d,mentee)}
        let payout=null;
        if(decision==='accept'&&m.community){
          const t=d.tasks.find(t=>t.id===m.id),e=d.escrow.find(e=>e.taskId===t.id&&e.status==='held');
          if(e){const commission=Math.round(e.amount*commissionPct/100);Object.assign(e,{status:'released',payeeId:s.userId,commission,net:e.amount-commission,releasedAt:now(),submissionId:s.id});t.status='paid';
            d.submissions.filter(x=>x.missionId===t.id&&x.id!==s.id&&['submitted','appealed','revision'].includes(x.status)).forEach(x=>{x.status='closed';x.updatedAt=now()});
            payout={gross:e.amount/100,commission:commission/100,net:e.net/100};audit(d,user.id,'escrow.release',t.id,{...payout,payee:s.userId,testMode:true})}
        }
        audit(d,user.id,'review.'+decision,s.id,{reviewId:review.id,xpAwarded});
        return {review:{id:review.id,decision,checks,feedback},status:s.status,xpAwarded,payout};
      });
    }],

    ['GET','/api/tasks',({user})=>({commissionPct,testMode:true,tasks:db.data.tasks.filter(t=>t.status==='open').sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(t=>{const c=taskContract(t);const mine=user?db.data.submissions.find(s=>s.userId===user.id&&s.missionId===t.id):null;return {...c,posterName:db.data.users.find(u=>u.id===t.posterId)?.name,createdAt:t.createdAt,own:user?.id===t.posterId,myStatus:mine?.status||null,attemptsUsed:mine?1:0}})})],

    ['POST','/api/tasks',({user,body})=>{
      need(user);
      const title=str(body.title,6,120,'title'),scope=str(body.scope,40,1500,'scope'),duration=str(body.duration||'Belirtilmedi',2,40,'duration');
      const reward=Number(body.reward);if(!Number.isInteger(reward)||reward<MIN_REWARD||reward>MAX_REWARD)fail(400,'invalid_reward',`Ücret ${MIN_REWARD}–${MAX_REWARD} ₺ arasında tam sayı olmalı.`);
      const acceptance=(Array.isArray(body.acceptance)?body.acceptance:[]).map(a=>typeof a==='string'?a.trim():'').filter(Boolean);
      if(acceptance.length<2||acceptance.length>6||acceptance.some(a=>a.length<5||a.length>160))fail(400,'invalid_acceptance','2–6 kabul ölçütü yaz (her biri 5–160 karakter).');
      if(body.confirm!==true)fail(400,'confirm_required','Ücretin emanete alınacağını onaylaman gerekir.');
      return db.tx(d=>{
        if(d.tasks.filter(t=>t.posterId===user.id&&t.status==='open').length>=MAX_OPEN_TASKS)fail(409,'task_limit',`Aynı anda en fazla ${MAX_OPEN_TASKS} açık görevin olabilir.`);
        const t={id:'t-'+id(),posterId:user.id,title,scope,duration,acceptance,reward,status:'open',createdAt:now()};
        d.tasks.push(t);
        d.escrow.push({id:id(),taskId:t.id,posterId:user.id,amount:reward*100,status:'held',createdAt:now(),testMode:true});
        audit(d,user.id,'escrow.hold',t.id,{gross:reward,testMode:true});
        return {task:taskContract(t)};
      });
    }],

    ['GET','/api/me/tasks',({user})=>{need(user);return {tasks:db.data.tasks.filter(t=>t.posterId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(t=>{const e=db.data.escrow.find(e=>e.taskId===t.id);const subs=db.data.submissions.filter(s=>s.missionId===t.id);return {id:t.id,title:t.title,reward:t.reward,status:t.status,escrow:e.status,commission:e.commission!=null?e.commission/100:null,net:e.net!=null?e.net/100:null,submissions:subs.length,pending:subs.filter(s=>['submitted','appealed','revision'].includes(s.status)).length}})}}],

    ['POST','/api/tasks/:id/cancel',({user,params})=>{
      need(user);
      return db.tx(d=>{
        const t=d.tasks.find(t=>t.id===params.id&&t.posterId===user.id)||fail(404,'not_found','Görev bulunamadı.');
        if(t.status!=='open')fail(409,'not_cancellable','Bu görev artık iptal edilemez.');
        if(d.submissions.some(s=>s.missionId===t.id&&['submitted','appealed','revision'].includes(s.status)))fail(409,'has_pending','İncelemede bekleyen teslim varken iptal edilemez; önce sonuçlanmasını bekle.');
        const e=d.escrow.find(e=>e.taskId===t.id&&e.status==='held');
        Object.assign(e,{status:'refunded',refundedAt:now()});t.status='cancelled';
        audit(d,user.id,'escrow.refund',t.id,{gross:e.amount/100,testMode:true});
        return {ok:true,refunded:e.amount/100};
      });
    }],

    // Herkese açık, anonim emanet defteri: açık kaynak güven modelinin görünür kısmı.
    ['GET','/api/ledger',()=>({testMode:true,commissionPct,entries:db.data.auditLog.filter(a=>a.action.startsWith('escrow.')).slice(-50).reverse().map(a=>({at:a.at,type:a.action.slice(7),task:db.data.tasks.find(t=>t.id===a.target)?.title||(()=>{const o=(db.data.orders||[]).find(o=>o.id===a.target);return o?'Pazar: '+(db.data.listings.find(l=>l.id===o.listingId)?.title||'ürün'):a.target})(),gross:a.detail.gross,commission:a.detail.commission,net:a.detail.net}))})],

    // Anket: yarışmacı / ziyaretçi ilgi alanı verisi. Ad, e-posta, telefon, okul sorulmaz;
    // yaş yalnız aralık olarak alınır. Açık özet yalnız en az 3 yanıt varken gösterilir.
    ['POST','/api/survey',({user,body,req})=>{
      if(body.consent!==true)fail(400,'consent_required','Devam etmek için bilgilendirmeyi onaylaman gerekir.');
      if(!AGE_BANDS.includes(body.ageBand))fail(400,'invalid_age','Yaş aralığını seç.');
      if(!HOURS.includes(body.hours))fail(400,'invalid_hours','Haftalık süreyi seç.');
      const areas={};for(const k of AREAS){const a=body.areas?.[k]||{};const i=Number(a.interest),p=Number(a.practice);if(!Number.isInteger(i)||i<0||i>3||!Number.isInteger(p)||p<0||p>3)fail(400,'invalid_areas','Her alan için ilgi ve uygulama düzeyini seç.');areas[k]={interest:i,practice:p}}
      const roles=(Array.isArray(body.roles)?body.roles:[]).filter(r=>ROLES.includes(r));
      const txt=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
      const rating=body.siteRating==null||body.siteRating===''?null:Number(body.siteRating);if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))fail(400,'invalid_rating','Puan 1–5 arası olmalı.');
      const ip=req.socket.remoteAddress||'',hits=(surveyHits.get(ip)||[]).filter(t=>Date.now()-t<36e5);
      if(hits.length>=SURVEY_PER_HOUR)fail(429,'rate_limited','Bu bağlantıdan çok fazla yanıt geldi. Biraz sonra dene.');
      hits.push(Date.now());surveyHits.set(ip,hits);
      return db.tx(d=>{
        const rec={id:id(),at:now(),userId:user?.id||null,ageBand:body.ageBand,hours:body.hours,areas,roles,learn:txt(body.learn,300),teach:txt(body.teach,300),expect:txt(body.expect,300),siteRating:rating,siteNote:txt(body.siteNote,400),nickname:txt(body.nickname,30)};
        const prev=user?d.surveys.findIndex(x=>x.userId===user.id):-1;
        if(prev>=0){d.surveys[prev]=rec}else d.surveys.push(rec);
        return {ok:true,updated:prev>=0};
      });
    }],

    ['GET','/api/survey/summary',()=>{
      const S=db.data.surveys,n=S.length;if(n<3)return {n,hidden:true,message:'Anonimlik için özet en az 3 yanıttan sonra gösterilir.'};
      const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*100)/100:0,count=(list,key)=>Object.fromEntries(list.map(k=>[k,S.filter(x=>Array.isArray(x[key])?x[key].includes(k):x[key]===k).length]));
      const ratings=S.map(x=>x.siteRating).filter(x=>x!=null);
      return {n,hidden:false,ageBands:count(AGE_BANDS,'ageBand'),hours:count(HOURS,'hours'),roles:count(ROLES,'roles'),
        areas:Object.fromEntries(AREAS.map(k=>[k,{avgInterest:avg(S.map(x=>x.areas[k].interest)),interested:S.filter(x=>x.areas[k].interest>=2).length,practicing:S.filter(x=>x.areas[k].practice>=2).length}])),
        siteRating:{n:ratings.length,avg:avg(ratings)}};
    }],

    // Canlı nabız: yalnız anonim sayaçlar ve son olay başlıkları; kişi kimliği içermez.
    ['GET','/api/pulse',()=>{
      const D=db.data,title=cid=>contract(cid)?.title||'bir görev';
      const events=[];
      for(const a of D.auditLog.slice(-60).reverse()){
        let kind=null,text=null;
        if(a.action==='escrow.hold'){kind='task';text='Yeni görev açıldı: '+(D.tasks.find(t=>t.id===a.target)?.title||'görev')+' · '+a.detail.gross+' ₺ test emanetinde'}
        else if(a.action==='escrow.release'){kind='paid';text='Ödeme serbest kaldı (test): '+(D.tasks.find(t=>t.id===a.target)?.title||'görev')}
        else if(a.action==='submission.create'){kind='submit';text='Yeni bir teslim geldi: '+title(a.detail.missionId)}
        else if(a.action==='review.accept'){const sub=D.submissions.find(x=>x.id===a.target);if(sub&&!contract(sub.missionId)?.community){kind='accept';text='Bir katkı kabul edildi: '+title(sub.missionId)}}
        if(kind)events.push({at:a.at,kind,text});
        if(events.length>=10)break;
      }
      return {hubOnline:hub.counts().total,stages:growth.counts(D),market:market.counts(D),users:D.users.length,openTasks:D.tasks.filter(t=>t.status==='open').length,heldTL:D.escrow.filter(e=>e.status==='held').reduce((t,e)=>t+e.amount,0)/100,
        submissions:D.submissions.length,accepted:D.submissions.filter(x=>x.status==='accepted').length,surveys:D.surveys.length,events};
    }],

    // ---- Meydan (hub) ----
    ['GET','/api/hub/info',()=>hub.info()],
    ['POST','/api/hub/input',({body})=>({ok:hub.input(String(body.tok||''),{dx:body.dx,dy:body.dy,tx:body.tx,ty:body.ty})})],
    ['POST','/api/hub/say',({body})=>hub.say(String(body.tok||''),body.k,body.i)],
    ['POST','/api/hub/interact',({body})=>hub.interact(String(body.tok||''),String(body.id||''))],
    ['POST','/api/hub/report',({body})=>hub.report(String(body.tok||''),String(body.target||''),body.reason)],
    ['GET','/api/admin/hub-reports',({user})=>{need(user,'admin');return {reports:(db.data.hubReports||[]).slice().reverse()}}],

    ...growth.routes,
    ...market.routes,

    ['GET','/api/admin/survey',({user})=>{need(user,'admin');return {responses:db.data.surveys.map(({userId,...r})=>r)}}],

    ['GET','/api/admin/users',({user})=>{need(user,'admin');return {users:db.data.users.map(u=>({...publicUser(u),xp:xpOf(u.id),stage:growth.stageOf(db.data,u),founding:!!u.foundingTree}))}}],

    ['POST','/api/admin/users/:id/roles',({user,params,body})=>{
      need(user,'admin');
      if(!['reviewer','admin'].includes(body.role))fail(400,'invalid_role','Rol: reviewer veya admin.');
      return db.tx(d=>{
        const u=d.users.find(u=>u.id===params.id)||fail(404,'not_found','Kullanıcı bulunamadı.');
        if(u.id===user.id&&body.role==='admin'&&!body.enabled)fail(400,'self_demote','Kendi yönetici rolünü kaldıramazsın.');
        u.roles=u.roles.filter(r=>r!==body.role);if(body.enabled)u.roles.push(body.role);
        audit(d,user.id,'role.'+(body.enabled?'grant':'revoke'),u.id,{role:body.role});
        return {user:publicUser(u)};
      });
    }],
  ].map(([method,pattern,handler])=>({method,handler,keys:[...pattern.matchAll(/:(\w+)/g)].map(m=>m[1]),re:new RegExp('^'+pattern.replace(/:(\w+)/g,'([^/]+)')+'$')}));

  async function readBody(req){
    let size=0;const chunks=[];
    for await(const c of req){size+=c.length;if(size>MAX_BODY)fail(413,'too_large','İstek çok büyük.');chunks.push(c)}
    if(!chunks.length)return {};
    try{const v=JSON.parse(Buffer.concat(chunks).toString('utf8'));return v&&typeof v==='object'?v:{}}catch{fail(400,'bad_json','Geçersiz JSON.')}
  }

  function streamHub(req,res){
    const user=currentUser(req),q=new URL(req.url,'http://x').searchParams;
    res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'});
    res.write('retry: 3000\n\n');
    const r=hub.join({userId:user?.id||null,name:user?.name||null,stamps:user?.stamps||[],avatar:{c:Number(q.get('c')),e:Number(q.get('e'))},room:q.get('room')},res);
    if(r.error){res.write('event: full\ndata: {}\n\n');return res.end()}
    req.on('close',()=>hub.leave(r.tok));
  }

  async function handle(req,res){
    const send=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))};
    try{
      const {pathname}=new URL(req.url,'http://localhost');
      if(req.method==='GET'&&pathname==='/api/hub/stream')return streamHub(req,res);
      let route,params={};
      for(const r of routes){const m=r.re.exec(pathname);if(m&&r.method===req.method){route=r;r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]));break}}
      if(!route)fail(404,'not_found','Uç nokta bulunamadı.');
      let body={};
      if(req.method!=='GET'){
        // CSRF savunması: SameSite=Strict çerez + JSON zorunluluğu + Origin eşleşmesi.
        if(!String(req.headers['content-type']||'').startsWith('application/json'))fail(415,'json_required','JSON gönder.');
        const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)fail(403,'bad_origin','Başka siteden istek kabul edilmez.');
        body=await readBody(req);
      }
      send(200,await route.handler({req,res,body,params,user:currentUser(req)}));
    }catch(e){
      if(e instanceof HttpError)return send(e.status,{error:e.code,message:e.message});
      console.error(e);send(500,{error:'server_error',message:'Sunucu hatası.'});
    }
  }
  return {handle,db,hub,close:()=>hub.close()};
}
