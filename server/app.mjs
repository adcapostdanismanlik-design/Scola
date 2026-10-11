// Scola yerel pilot API'si: hesap → görev teslimi → bağımsız değerlendirme → sunucu XP.
// Bağımlılıksızdır (yalnız Node yerleşik modülleri). Hak, XP ve rol kontrollerinin
// tamamı burada yapılır; istemci yalnızca istek gönderir.
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {openDb} from './db.mjs';
import {missions,missionById} from './missions.mjs';

const SESSION_DAYS=14,MAX_BODY=64*1024,FEEDBACK_MIN=40,RING_DAYS=30;
const now=()=>new Date().toISOString();
const id=()=>randomBytes(9).toString('base64url');
const sha=s=>createHash('sha256').update(s).digest('hex');

class HttpError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}
const fail=(status,code,message)=>{throw new HttpError(status,code,message)};

function hashPassword(pw){const salt=randomBytes(16);return 'scrypt$'+salt.toString('hex')+'$'+scryptSync(pw,salt,32).toString('hex')}
function checkPassword(pw,stored){const [,salt,hash]=String(stored).split('$');if(!salt||!hash)return false;const a=scryptSync(pw,Buffer.from(salt,'hex'),32),b=Buffer.from(hash,'hex');return a.length===b.length&&timingSafeEqual(a,b)}

const str=(v,min,max,label)=>{const s=typeof v==='string'?v.trim():'';if(s.length<min||s.length>max)fail(400,'invalid_'+label,`${label}: ${min}–${max} karakter olmalı.`);return s};

export function createApi({dbFile=null,adminEmails=[],secureCookie=false}={}){
  const db=openDb(dbFile);
  const admins=new Set(adminEmails.map(e=>e.trim().toLowerCase()).filter(Boolean));
  const loginFailures=new Map();

  const audit=(d,actor,action,target,detail={})=>d.auditLog.push({id:id(),at:now(),actor,action,target,detail});
  const publicUser=u=>({id:u.id,name:u.name,email:u.email,interest:u.interest,roles:u.roles,createdAt:u.createdAt});
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

  const submissionView=(s,{forAuthor=false}={})=>{
    const m=missionById(s.missionId);
    const reviews=db.data.reviews.filter(r=>r.submissionId===s.id).map(r=>({id:r.id,decision:r.decision,checks:r.checks,feedback:r.feedback,createdAt:r.createdAt,reviewer:forAuthor?'Bağımsız değerlendirici':r.reviewerId}));
    const xpEvent=db.data.xpEvents.find(e=>e.sourceId===s.id);
    return {id:s.id,missionId:s.missionId,missionTitle:m?.title,title:s.title,output:s.output,impact:s.impact,status:s.status,attempt:s.attempt,createdAt:s.createdAt,updatedAt:s.updatedAt,appeal:s.appeal||null,reviews,xpAwarded:xpEvent?.points||0};
  };
  const blindAuthor=(s)=>'Katılımcı #'+sha(s.userId+':'+s.id).slice(0,6);

  // Bir değerlendirici bu teslimi inceleyebilir mi? Kendi teslimi, daha önce incelediği
  // teslim, beyan edilmiş çıkar çatışması ve karşılıklı kabul halkası engellenir.
  function reviewBlock(reviewer,s){
    if(s.userId===reviewer.id)return 'Kendi teslimini değerlendiremezsin.';
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
      return {user:publicUser(user),xp:xpOf(user.id),accepted:subs.filter(s=>s.status==='accepted').length,pending:subs.filter(s=>['submitted','appealed'].includes(s.status)).length};
    }],

    ['GET','/api/missions',({user})=>({missions:missions.map(m=>{
      const mine=user?db.data.submissions.filter(s=>s.userId===user.id&&s.missionId===m.id):[];
      const latest=mine.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
      return {...m,attemptsUsed:mine.length,myStatus:latest?.status||null};
    })})],

    ['POST','/api/missions/:id/submissions',({user,params,body})=>{
      need(user);
      const m=missionById(params.id)||fail(404,'mission_not_found','Görev bulunamadı.');
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
      return {queue:items.map(s=>{const m=missionById(s.missionId);return {id:s.id,missionId:s.missionId,missionTitle:m.title,acceptance:m.acceptance,xp:m.xp,author:blindAuthor(s),title:s.title,output:s.output,impact:s.impact,status:s.status,appeal:s.appeal||null,previousReviews:db.data.reviews.filter(r=>r.submissionId===s.id).map(r=>({decision:r.decision,feedback:r.feedback})),submittedAt:s.updatedAt}})};
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
        const m=missionById(s.missionId);
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
        audit(d,user.id,'review.'+decision,s.id,{reviewId:review.id,xpAwarded});
        return {review:{id:review.id,decision,checks,feedback},status:s.status,xpAwarded};
      });
    }],

    ['GET','/api/admin/users',({user})=>{need(user,'admin');return {users:db.data.users.map(u=>({...publicUser(u),xp:xpOf(u.id)}))}}],

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

  async function handle(req,res){
    const send=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))};
    try{
      const {pathname}=new URL(req.url,'http://localhost');
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
  return {handle,db};
}
