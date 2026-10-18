import pg from 'pg';import crypto from 'node:crypto';
const dbUrl=process.env.DATABASE_URL;const email=(process.env.WILS_ADMIN_EMAIL||'').trim().toLowerCase(),password=process.env.WILS_ADMIN_INITIAL_PASSWORD||'';
if(!dbUrl||!email.includes('@')||password.length<12){console.error('Set DATABASE_URL, WILS_ADMIN_EMAIL and WILS_ADMIN_INITIAL_PASSWORD (12+ characters), then rerun.');process.exit(1)}
const salt=crypto.randomBytes(16).toString('hex');
const password_hash=await new Promise((resolve,reject)=>{
 crypto.scrypt(password,Buffer.from(salt,'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(err,b)=>{
  if(err)reject(err);else resolve(b.toString('hex'));
 });
});
const client=new pg.Client({connectionString:dbUrl,ssl:dbUrl.includes('localhost')?false:{rejectUnauthorized:true}});
try{await client.connect();const r=await client.query('insert into wils_admins(email,password_salt,password_hash) values($1,$2,$3) on conflict(email) do nothing returning id',[email,salt,password_hash]);if(r.rowCount)console.log('Admin account initialized. Remove WILS_ADMIN_INITIAL_PASSWORD from environment settings.');else console.log('Admin already exists; password not modified. Change password in the protected dashboard.')}finally{await client.end()}
