import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApi} from '../server/app.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const port=Number(process.env.PORT||5175);
// Varsayılan yalnız bu bilgisayar. Yarışmacıların ağdan görmesi için SCOLA_HOST=0.0.0.0 (HTTPS arkasında + SCOLA_SECURE_COOKIE=1).
const host=process.env.SCOLA_HOST||'127.0.0.1';
// Veri dosyası depoya girmez (.gitignore: data/). SCOLA_ADMIN_EMAILS, ilk yöneticiyi
// belirlemek için virgülle ayrılmış e-posta listesidir; sır değildir.
const dbFile=process.env.SCOLA_DB||fileURLToPath(new URL('../data/scola-db.json',import.meta.url));
const api=createApi({dbFile,adminEmails:(process.env.SCOLA_ADMIN_EMAILS||'').split(','),secureCookie:process.env.SCOLA_SECURE_COOKIE==='1',commissionPct:Number(process.env.SCOLA_COMMISSION_PCT??10),marketCommissionPct:Number(process.env.SCOLA_MARKET_COMMISSION_PCT??8)});
http.createServer(async(req,res)=>{res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');if(req.url.startsWith('/api/'))return api.handle(req,res);try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}const s=await stat(file);if(!s.isFile())throw new Error('not-file');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}}).listen(port,host,()=>console.log(`Scola: http://${host==='0.0.0.0'?'127.0.0.1':host}:${port}${host==='0.0.0.0'?' (ağdan da erişilebilir)':''}\nVeri: ${dbFile}\nStop: Ctrl+C`));
