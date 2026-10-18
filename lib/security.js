import crypto from 'node:crypto';
const COOKIE='wils_adm';
export {COOKIE};
export function clean(v,max=255){return typeof v==='string'?v.trim().replace(/[\u0000-\u001F\u007F]/g,' ').slice(0,max):''}
export function idToken(bytes=32){return crypto.randomBytes(bytes).toString('hex')}
export function hash(v){return crypto.createHash('sha256').update(String(v)).digest('hex')}
export function ipHash(req){const key=process.env.APP_SECRET;if(!key||key.length<32)throw Error('APP_SECRET must be configured securely');const raw=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';return crypto.createHmac('sha256',key).update(raw.slice(0,80)).digest('hex')}
export function makeReference(){return 'WILS-'+new Date().getUTCFullYear()+'-'+crypto.randomBytes(6).toString('hex').toUpperCase()}
export function safePhone(p){const raw=clean(p,35).replace(/[\s()-]/g,'');if(!/^\+?\d{9,15}$/.test(raw))return null;let digits=raw.replace(/^\+/,'');if(digits.startsWith('0')&&digits.length===10)digits='255'+digits.slice(1);return digits.length>=11&&digits.length<=15?digits:null;}
export function safeEmail(s){const v=clean(s,190).toLowerCase();return /^(?!.*\s)[^@]{1,64}@[^@]{1,120}\.[^@.]{2,}$/.test(v)?v:null}
export function eqSafe(a,b){const A=Buffer.from(a||''),B=Buffer.from(b||'');return A.length===B.length&&crypto.timingSafeEqual(A,B)}
export async function derivePassword(password,salt){
 return new Promise((resolve,reject)=>{
  crypto.scrypt(password,Buffer.from(salt,'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(err,buf)=>{
   if(err) reject(err); else resolve(buf.toString('hex'));
  });
 });
}
export async function createPassword(password){const salt=idToken(16);return {salt,digest:await derivePassword(password,salt)}}
export function cookieValue(req){return req.cookies?.get?.(COOKIE)?.value||req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.split('=')[1]||''}
export function checkOrigin(req){const origin=req.headers.get('origin');if(!origin)return false;try{const url=new URL(origin),host=req.headers.get('host')||req.headers.get('x-forwarded-host');return (url.protocol==='https:'||(process.env.NODE_ENV!=='production'&&url.protocol==='http:'))&&url.host===host}catch{return false}}
export const noStore={'cache-control':'private,no-store,max-age=0','x-content-type-options':'nosniff'};
export function respond(body,status=200,headers={}){return Response.json(body,{status,headers:{...noStore,...headers}})}
export function fail(message,status=400){return respond({ok:false,error:message},status)}
export async function input(req){if(Number(req.headers.get('content-length')||0)>16000)throw new Error('Request is too large');const s=await req.text();if(s.length>16000)throw Error('Request is too large');return JSON.parse(s)}
export function setSessionCookie(res,token){res.headers.append('set-cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200; ${process.env.NODE_ENV==='production'?'Secure; ':''}Priority=High`);return res}
export function clearSessionCookie(res){res.headers.append('set-cookie',`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${process.env.NODE_ENV==='production'?'Secure; ':''}`);return res}
