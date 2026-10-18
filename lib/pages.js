import fs from 'node:fs/promises';import path from 'node:path';
export async function legacyPage(segments=[]){
 const slugs=segments.filter(Boolean); const supported=new Set(['services','about','gallery','contact','guide','showcase','privacy','success','book','booking-status','admin']);
 if(slugs.length>1 && !(slugs.length===2&&slugs[0]==='office'))return new Response('Not found',{status:404});
 let page=slugs[0]||'index';
 if(page==='office'){
   if(!process.env.ADMIN_PATH_SEGMENT || slugs[1]!==process.env.ADMIN_PATH_SEGMENT)return new Response('Not found',{status:404});
   page='admin';
 } else if(page==='admin')return new Response('Not found',{status:404});
 if(page!=='index'&&!supported.has(page))return new Response('Not found',{status:404});
 if(page==='showcase')page='gallery';
 const f=page==='admin'?path.join(process.cwd(),'private-pages','admin.html'):path.join(process.cwd(),'public',page==='index'?'index.html':page+'/index.html');
 try {let html=await fs.readFile(f,'utf8'); if(page==='admin')html=html.replace('Booking administration.','WILS private office.');
 return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})
 }catch{return new Response('Page not available',{status:404})}
}
