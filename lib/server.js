import {db,tx} from './db.js';
import {COOKIE,clean,idToken,hash,ipHash,makeReference,safePhone,safeEmail,eqSafe,derivePassword,createPassword,cookieValue,checkOrigin,respond,fail,input,setSessionCookie,clearSessionCookie} from './security.js';
import {whatsappHref,queueAndDeliver} from './notices.js';
const services=['SPSS / statistics','Research proposal','Research report / thesis','Business research','Community survey','Presentation / academic editing','Other research consultation'];
const statuses=['awaiting_payment','payment_submitted','confirmed','rejected','in_progress','completed'];
function dateOrNull(s){if(!s)return null;const v=clean(s,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Enter a valid date');return v;}
function safeBooking(b){const {id,tracking_hash,ip_hash,payment_reference,payment_sender,payer_phone,...rest}=b;return rest}
function errorWrap(e){if(e?.code==='23505')return fail('These payment details are already recorded, or this booking reference already exists.',409);if(e instanceof SyntaxError)return fail('Invalid data format');if(/DATABASE_URL|APP_SECRET|configured|wils_bookings does not exist|wils_admins does not exist|relation .* does not exist/i.test(String(e?.message||''))){console.error('Server configuration problem:',e.message);return fail('Booking system is not fully configured yet. Please contact WILS Research.',503)}console.error('WILS backend:',e?.code||'error',e?.message);return fail('We could not complete your request. Please try again or contact WILS.',500)}
async function authenticated(req){const token=cookieValue(req);if(!/^[a-f0-9]{64}$/.test(token))return null;const r=await db(`select a.id,a.email,a.display_name,s.id as session_id from wils_admin_sessions s join wils_admins a on a.id=s.admin_id where s.token_hash=$1 and s.expires_at>now() limit 1`,[hash(token)]);return r.rows[0]||null;}
async function login(req){const d=await input(req),email=safeEmail(d.email),pw=typeof d.password==='string'?d.password:'';
 if(!email||pw.length>256||pw.length<1)return fail('Invalid credentials',401);
 const ip=ipHash(req);const attempts=await db(`select count(*)::int as count from wils_auth_attempts where ip_hash=$1 and created_at>now()-interval '15 minutes'`,[ip]);if(attempts.rows[0].count>=10)return fail('Too many attempts. Wait 15 minutes.',429);
 await db('insert into wils_auth_attempts(ip_hash) values($1)',[ip]);const r=await db('select * from wils_admins where email=$1',[email]);const a=r.rows[0];
 // Derive a decoy password even if no user exists to reduce account enumeration timing.
 const salt=a?.password_salt||'0123456789abcdef0123456789abcdef';const expected=a?.password_hash||'0'.repeat(128);
 const actual=await derivePassword(pw,salt);if(!a||!eqSafe(actual,expected))return fail('Invalid credentials',401);
 await db('delete from wils_auth_attempts where ip_hash=$1',[ip]);
 const token=idToken();await db(`insert into wils_admin_sessions(admin_id,token_hash,expires_at) values($1,$2,now()+interval '12 hours')`,[a.id,hash(token)]);
 return setSessionCookie(respond({ok:true,email:a.email,display_name:a.display_name}),token);
}
async function book(req){const d=await input(req);if(d.website)return respond({ok:true,message:'Request received'},202);
 if(d.agree!==true)return fail('Please accept the booking and privacy terms');
 const name=clean(d.full_name,100),phone=safePhone(d.phone),email=safeEmail(d.email),service=clean(d.service,100),priority=d.priority==='VIP'?'VIP':'Standard';
 const title=clean(d.project_title,180)||null,level=clean(d.level,80)||null,notes=clean(d.notes,1500)||null;
 if(name.length<3||!phone||!email||!services.includes(service))return fail('Enter your full name, phone, valid email and service');
 const start=dateOrNull(d.start_date),deadline=dateOrNull(d.deadline);if(start&&deadline&&start>deadline)return fail('Your deadline cannot be earlier than the proposed start date');
 const ip=ipHash(req),rate=await db(`select count(*)::int as n from wils_bookings where ip_hash=$1 and created_at>now()-interval '1 hour'`,[ip]);if(rate.rows[0].n>=5)return fail('Too many bookings in one hour. Contact WILS if you need help.',429);
 const ref=makeReference(),token=idToken(24),fee=priority==='VIP'?10000:0;
 const r=await db(`insert into wils_bookings (reference,tracking_hash,full_name,phone,email,service,project_title,project_level,start_date,requested_deadline,notes,priority,amount_total,deposit_due,priority_fee,balance_due,ip_hash) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,100000,20000,$13,80000,$14) returning *`,[ref,hash(token),name,phone,email,service,title,level,start,deadline,notes,priority,fee,ip]);
 const b=r.rows[0];
 // Independent notification attempts. A notification failure must never cancel a valid booking.
 const results=await Promise.allSettled(['admin_received','client_received','whatsapp_admin'].map(k=>queueAndDeliver(b,[k])));
 const notify={};for(let i=0;i<results.length;i++){let key=['admin_received','client_received','whatsapp_admin'][i];notify[key]=results[i].status==='fulfilled'?results[i].value[key]:'failed';}
 return respond({ok:true,reference:ref,tracking_token:token,status:b.status,priority,amount_to_pay:20000+fee,amount_total:100000,priority_fee:fee,deposit_due:20000,balance_due:80000,notifications:notify,whatsapp_url:whatsappHref(b)});
}
async function bookingForToken(d){const ref=clean(d.reference,48),token=clean(d.token,96);if(!/^WILS-\d{4}-[A-F0-9]{12}$/.test(ref)||!/^[a-f0-9]{48}$/.test(token))return null;
 const r=await db('select * from wils_bookings where reference=$1 and tracking_hash=$2 limit 1',[ref,hash(token)]);return r.rows[0]||null;}
async function status(req){const b=await bookingForToken(await input(req));if(!b)return fail('Booking not found or private tracking key is invalid.',404);return respond({ok:true,booking:safeBooking(b)});}
async function payment(req){const d=await input(req),b=await bookingForToken(d);if(!b)return fail('Booking not found or private tracking key is invalid.',404);
 if(!['awaiting_payment','rejected'].includes(b.status))return fail('Payment has already been submitted or confirmed. Check your booking status.',409);
 const channel=clean(d.payment_method,30),ref=clean(d.payment_reference,80),sender=clean(d.payment_sender,100),phone=safePhone(d.payer_phone);
 if(!['Airtel Money','M-Pesa','CRDB bank'].includes(channel)||ref.length<5||sender.length<3||!phone)return fail('Enter payment channel, transaction reference, sender name and phone');
 const r=await db(`update wils_bookings set status='payment_submitted',payment_method=$2,payment_reference=$3,payment_sender=$4,payer_phone=$5,payment_claimed_at=now(),updated_at=now() where id=$1 and status in ('awaiting_payment','rejected') returning *`,[b.id,channel,ref,sender,phone]);if(!r.rowCount)return fail('Booking changed before submission. Refresh your status.',409);
 // Admin gets notification; does NOT automatically verify payment.
 const notice=await queueAndDeliver(r.rows[0],['admin_payment_claim']);
 return respond({ok:true,status:'payment_submitted',notification:notice.admin_payment_claim});
}
async function me(req){const a=await authenticated(req);return a?respond({ok:true,email:a.email,display_name:a.display_name}):fail('Sign-in required',401)}
async function adminBookings(req){const a=await authenticated(req);if(!a)return fail('Sign-in required',401);
 const r=await db('select * from wils_bookings order by created_at desc limit 1000');const summary=await db(`select count(*)::int as total,count(*) filter(where status='awaiting_payment')::int as unpaid,count(*) filter(where status='payment_submitted')::int as awaiting_verification,count(*) filter(where status in('confirmed','in_progress'))::int as active,count(*) filter(where status='completed')::int as completed,count(*) filter(where priority='VIP')::int as vip from wils_bookings`);
 return respond({ok:true,rows:r.rows.map(({tracking_hash,ip_hash,...rest})=>rest),metrics:summary.rows[0],email:a.email});}
async function action(req){const a=await authenticated(req);if(!a)return fail('Sign-in required',401);const d=await input(req),id=Number(d.id),act=clean(d.action,25);if(!Number.isSafeInteger(id)||id<1)return fail('Invalid booking number');
 const allowed={approve:['payment_submitted','confirmed'],reject:['payment_submitted','rejected'],start:['confirmed','in_progress'],complete:['in_progress','completed']};if(!allowed[act])return fail('Unknown action');
 const out=await tx(async c=>{
  const r=await c.query('select * from wils_bookings where id=$1 for update',[id]);const b=r.rows[0];if(!b)return {error:'Not found'};
  if(!allowed[act].includes(b.status))return {error:'Booking is not at the correct stage'};
  if(['confirmed','rejected','in_progress','completed'].includes(b.status)&&allowed[act][1]===b.status)return {booking:b,already:true};
  let result;
  if(act==='approve'){
   // Serialized database counter ensures Project 1 / 1..7; Project 2 / 1..7 across every client and every Vercel instance.
   const q=await c.query('update wils_queue set last_position=last_position+1 where singleton=true returning last_position');
   const seq=Number(q.rows[0].last_position),group=Math.floor((seq-1)/7)+1,place=((seq-1)%7)+1;
   result=await c.query(`update wils_bookings set status='confirmed',project_group=$2,group_place=$3,approved_at=now(),updated_at=now() where id=$1 returning *`,[id,group,place]);
  }else{let status=act==='reject'?'rejected':act==='start'?'in_progress':'completed';result=await c.query('update wils_bookings set status=$2,updated_at=now() where id=$1 returning *',[id,status]);}
  await c.query('insert into wils_admin_audit(admin_id,booking_id,action) values($1,$2,$3)',[a.id,id,act]);return {booking:result.rows[0],already:false};
 });if(out.error)return fail(out.error,409);
 if(!out.already&&['approve','reject'].includes(act)){try{await queueAndDeliver(out.booking,[act==='approve'?'client_confirmed':'client_rejected'])}catch(e){console.error('Notification could not be queued:',e.message)}}
 return respond({ok:true,booking:{reference:out.booking.reference,status:out.booking.status,group_number:out.booking.project_group,within_group:out.booking.group_place}});
}
async function changePassword(req){const a=await authenticated(req);if(!a)return fail('Sign-in required',401);
 const d=await input(req),old=typeof d.current_password==='string'?d.current_password:'',next=typeof d.new_password==='string'?d.new_password:'';
 if(next.length<12||next.length>128)return fail('Choose a new password between 12 and 128 characters');if(old===next)return fail('New password must differ');
 const r=await db('select password_salt,password_hash from wils_admins where id=$1',[a.id]),stored=r.rows[0];if(!stored||!eqSafe(await derivePassword(old,stored.password_salt),stored.password_hash))return fail('Current password is incorrect',401);
 const pass=await createPassword(next);
 await tx(async c=>{await c.query('update wils_admins set password_salt=$2,password_hash=$3,updated_at=now() where id=$1',[a.id,pass.salt,pass.digest]);await c.query('delete from wils_admin_sessions where admin_id=$1',[a.id]);await c.query('insert into wils_admin_audit(admin_id,action) values($1,$2)',[a.id,'change_password']);});
 return clearSessionCookie(respond({ok:true,message:'Password changed. Sign in again.'}));}
async function logout(req){const a=await authenticated(req);if(a){await db('delete from wils_admin_sessions where id=$1',[a.session_id]);}
 return clearSessionCookie(respond({ok:true}));}
async function notifications(req){const a=await authenticated(req);if(!a)return fail('Sign-in required',401);
 const d=await input(req),id=Number(d.id),kind=clean(d.kind,30);if(!Number.isInteger(id)||!['admin_received','admin_payment_claim','client_received','client_confirmed','client_rejected','whatsapp_admin'].includes(kind))return fail('Invalid notice');
 const r=await db('select * from wils_bookings where id=$1',[id]);if(!r.rowCount)return fail('Booking not found',404);
 const result=await queueAndDeliver(r.rows[0],[kind]);return respond({ok:true,notifications:result});}
export async function handleApi(req,slug,method){const route=Array.isArray(slug)?slug.join('/'):'',safeGet=method==='GET';
 try{
  if(safeGet){if(route==='health')return respond({ok:true,service:'WILS booking API',database_configured:!!process.env.DATABASE_URL,email_configured:!!(process.env.RESEND_API_KEY&&process.env.RESEND_FROM)});if(route==='admin-me')return me(req);if(route==='admin-bookings')return adminBookings(req);return fail('Not found',404)}
  if(method!=='POST')return fail('Method not allowed',405);
  if(!checkOrigin(req))return fail('Invalid request origin',403);
  switch(route){case 'booking-create':return await book(req);case 'booking-status':return await status(req);case 'payment-submit':return await payment(req);case 'admin-login':return await login(req);case 'admin-logout':return await logout(req);case 'admin-action':return await action(req);case 'admin-change-password':return await changePassword(req);case 'admin-notifications':return await notifications(req);default:return fail('Not found',404)}
 }catch(e){if(e instanceof SyntaxError)return fail('Invalid JSON data',400);if(/(Enter a valid date|Your deadline cannot|Request is too large)/.test(e?.message||''))return fail(e.message,400);return errorWrap(e)}
}
