import { randomInt, randomUUID } from 'node:crypto';
import { query, rate } from '../server/db.mjs';
import { fail, text, email, uuid, equal, hash, token, required, encrypt, decrypt, isStaff, authorizeCase, publicUrl, validateCase, fileInput, checkOrigin, cookie, getSessionToken, summarizeError, markets } from '../server/security.mjs';
import { analyzeCase, research } from '../server/ai.mjs';
import { validateResearch } from '../server/research-input.mjs';
import { sendEmail, queueMail, processMail } from '../server/mail.mjs';

export const config={maxDuration:300};
const now=()=>new Date().toISOString();
const statuses=['documents','ready','waiting_amazon','human_review','resolved'];
const caseLink=id=>`${required('APP_URL')}/#caso/${id}`;
function configured() {
 const names=['APP_URL','DATABASE_URL','AUTH_SECRET','DATA_ENCRYPTION_KEY','RESEND_API_KEY','EMAIL_FROM','CRON_SECRET','AI_GATEWAY_MODEL'];
 return names.every(k=>Boolean(process.env[k])) && Boolean(process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN);
}
function json(res,value,status=200){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));}
async function body(req) {
 if(req.body!==undefined) {
  if(Buffer.byteLength(typeof req.body==='string'?req.body:JSON.stringify(req.body))>3000000) fail(413,'La solicitud es demasiado grande.');
  try {return typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{fail(400,'Solicitud inválida.');}
 }
 let size=0,chunks=[];
 for await(const part of req){size+=part.length;if(size>3000000)fail(413,'La solicitud es demasiado grande.');chunks.push(part);}
 try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{fail(400,'Solicitud inválida.');}
}
async function user(req) {
 const t=getSessionToken(req);if(!t)fail(401,'Verifica tu correo para abrir tu expediente.');
 const [u]=await query('SELECT email FROM vcp_sessions WHERE id=$1 AND expires_at>NOW()',[hash(t)]);
 if(!u)fail(401,'Tu sesión venció. Verifica tu correo de nuevo.');return u;
}
async function rowFor(u,id,ownerOnly=false) {return authorizeCase(u,(await query('SELECT * FROM vcp_cases WHERE id=$1',[uuid(id)]))[0],ownerOnly);}
const unpack=r=>decrypt(r.payload,`case:${r.id}`);
async function caseView(u,id) {
 const r=await rowFor(u,id),p=unpack(r);
 const files=await query('SELECT id,payload,created_at FROM vcp_files WHERE case_id=$1 ORDER BY created_at',[r.id]);
 const mail=await query('SELECT status,count(*)::int AS count FROM vcp_mail WHERE case_id=$1 GROUP BY status',[r.id]);
 return {id:r.id,status:r.status,revision:r.revision,followup:r.followup,owner:r.owner_email,createdAt:r.created_at,updatedAt:r.updated_at,analyzing:Boolean(r.analyzing_until&&new Date(r.analyzing_until)>new Date()),...p,
 files:files.map(f=>{const d=decrypt(f.payload,`file:${f.id}:${r.id}`);return {id:f.id,name:d.name,size:d.size,mime:d.mime,createdAt:f.created_at};}),mail};
}
async function updateCase(r,p,status=r.status,extra={}) {
 const rows=await query(`UPDATE vcp_cases SET payload=$2,status=$3,revision=revision+1,updated_at=NOW(),followup=$5
 WHERE id=$1 AND revision=$4 AND (analyzing_until IS NULL OR analyzing_until<NOW()) RETURNING id`,[r.id,encrypt(p,`case:${r.id}`),status,r.revision,extra.followup??r.followup]);
 if(!rows.length)fail(409,'El caso se está analizando o cambió en otra pestaña. Actualiza antes de continuar.');
}
async function notifyCase(r,kind,summary='') {
 const id=`${kind}:${r.id}:${r.revision}`, url=caseLink(r.id);
 if(kind==='escalation') return queueMail(id,r.id,process.env.ESCALATION_EMAIL||'maria@vendecomopro.net','VCP · Caso complejo para revisión',
 `Un caso necesita tu revisión.\nEstudiante: ${r.owner_email}\nMercado: ${r.market}\nCategoría inicial: ${r.issue}\nFecha límite indicada: ${r.deadline||'No indicada'}\n\n${summary}\n\nExpediente privado con aviso, documentos, análisis y cronología:\n${url}\n\nVerifica tu correo autorizado para acceder. La estrategia automática queda pausada hasta tu revisión.`);
 return queueMail(id,r.id,r.owner_email,'VCP · Actualización de tu caso',`Tu caso tiene una actualización.\n${summary}\n\nConsulta el detalle y continúa aquí:\n${url}\n\nTu expediente requiere verificar tu correo. Los documentos no se adjuntan por email. Puedes desactivar los recordatorios en el portal.`);
}
async function aiQuota(key) {await rate(`ai:${key}`,12);await rate('ai:global',Math.max(1,Number(process.env.AI_DAILY_LIMIT)||150));}

export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const route=new URL(req.url,'http://localhost').pathname.replace(/\/$/,'');
 try {
  if(route==='/api/health'&&req.method==='GET')return json(res,{ready:configured(),message:configured()?'Servicio configurado':'Estamos terminando de activar el servicio. Vuelve pronto.'});
  if(route==='/api/cron'&&req.method==='GET') {
   if(!process.env.CRON_SECRET||!equal(req.headers.authorization||'',`Bearer ${process.env.CRON_SECRET}`))fail(401,'No autorizado.');
   // Reminder eligibility is rechecked immediately before queuing. A deterministic day key avoids duplicate cron runs.
   const reminders=await query(`SELECT * FROM vcp_cases WHERE followup=true AND status IN ('documents','ready','waiting_amazon')
     AND updated_at<NOW()-INTERVAL '2 days' AND (last_reminder IS NULL OR last_reminder<NOW()-INTERVAL '3 days') LIMIT 15`);
   let queued=0;
   for(const r of reminders) {
    const [eligible]=await query(`UPDATE vcp_cases SET last_reminder=NOW() WHERE id=$1 AND followup=true AND status IN ('documents','ready','waiting_amazon')
      AND (last_reminder IS NULL OR last_reminder<NOW()-INTERVAL '3 days') RETURNING id`,[r.id]);
    if(!eligible)continue;
    await queueMail(`reminder:${r.id}:${now().slice(0,10)}`,r.id,r.owner_email,'VCP · ¿Cómo avanza tu caso?',`¿Recibiste una respuesta de Amazon o reuniste los documentos pendientes?\nContinúa tu caso aquí: ${caseLink(r.id)}\n\nNo hemos recibido automáticamente ninguna respuesta de Amazon. Sube su mensaje en el portal para continuar.\nPuedes desactivar estos recordatorios desde tu caso.`);queued++;
   }
   const attempted=await processMail();
   await query('DELETE FROM vcp_sessions WHERE expires_at<NOW()');
   await query('DELETE FROM vcp_logins WHERE expires_at<NOW()');
   await query('DELETE FROM vcp_rate WHERE expires_at<NOW()');
   const retention=Math.max(30,Number(process.env.RETENTION_DAYS)||180);
   await query("DELETE FROM vcp_cases WHERE updated_at<NOW()-($1::text||' days')::interval",[retention]);
   return json(res,{queued,attempted});
  }
  checkOrigin(req);
  const ip=hash(String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0]);
  if(req.method==='POST')await rate(`request:${ip}`,100,3600);
  const b=req.method==='POST'?await body(req):{};
  if(!b || typeof b!=='object'||Array.isArray(b))fail(400,'Solicitud inválida.');
  if(route==='/api/auth/request'&&req.method==='POST') {
   const address=email(b.email);await rate(`login-ip:${ip}`,10,3600);await rate(`login-email:${hash(address)}`,4,600);
   const code=String(randomInt(100000,1000000));
   await query(`INSERT INTO vcp_logins(email,code_hash,expires_at) VALUES ($1,$2,NOW()+INTERVAL '10 minutes')
    ON CONFLICT(email) DO UPDATE SET code_hash=$2,attempts=0,expires_at=NOW()+INTERVAL '10 minutes'`,[address,hash(`${address}:${code}`)]);
   await sendEmail(address,'Tu código de acceso · VendeComoPro',`Tu código de acceso es: ${code}\n\nVence en 10 minutos. No compartas este código. Si no lo solicitaste, ignora este mensaje.`, `login:${randomUUID()}`);
   return json(res,{ok:true});
  }
  if(route==='/api/auth/verify'&&req.method==='POST') {
   const address=email(b.email),code=text(b.code,6,6);
   if(!/^\d{6}$/.test(code))fail(400,'Introduce los seis dígitos del código.');
   await rate(`verify:${ip}`,25,600);
   const [challenge]=await query(`UPDATE vcp_logins SET attempts=attempts+1 WHERE email=$1 AND attempts<5 AND expires_at>NOW() RETURNING code_hash`,[address]);
   if(!challenge||!equal(challenge.code_hash,hash(`${address}:${code}`)))fail(400,'Código inválido o vencido. Revisa tu correo o pide otro.');
   const used=await query('DELETE FROM vcp_logins WHERE email=$1 AND code_hash=$2 RETURNING email',[address,challenge.code_hash]);
   if(!used.length)fail(400,'Este código ya se usó. Solicita uno nuevo.');
   const session=token();await query("INSERT INTO vcp_sessions(id,email,expires_at) VALUES ($1,$2,NOW()+INTERVAL '7 days')",[hash(session),address]);
   res.setHeader('Set-Cookie',cookie(session));return json(res,{email:address,staff:isStaff({email:address})});
  }
  if(route==='/api/research'&&req.method==='POST') {
   const data=validateResearch(b);
   await aiQuota(ip);return json(res,await research(data));
  }
  const u=await user(req);
  if(route==='/api/me'&&req.method==='GET')return json(res,{email:u.email,staff:isStaff(u)});
  if(route==='/api/logout'&&req.method==='POST') {
   await query('DELETE FROM vcp_sessions WHERE id=$1',[hash(getSessionToken(req))]);res.setHeader('Set-Cookie',cookie('',true));return json(res,{ok:true});
  }
  if(route==='/api/cases'&&req.method==='GET') {
   const rows=isStaff(u)?await query('SELECT id,owner_email,issue,market,status,updated_at,deadline FROM vcp_cases ORDER BY updated_at DESC LIMIT 100'):await query('SELECT id,issue,market,status,updated_at,deadline FROM vcp_cases WHERE owner_email=$1 ORDER BY updated_at DESC LIMIT 50',[u.email]);
   return json(res,{cases:rows});
  }
  if(route==='/api/cases'&&req.method==='POST') {
   const data=validateCase(b),id=uuid(b.id);await rate(`new-case:${hash(u.email)}`,5);
   const payload={case:data,messages:[],reports:[],consentAt:now()};
   await query(`INSERT INTO vcp_cases(id,owner_email,issue,market,deadline,payload,followup) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`,[id,u.email,data.issue,data.market,data.deadline||null,encrypt(payload,`case:${id}`),b.followup===true]);
   await rowFor(u,id,true);return json(res,await caseView(u,id),201);
  }
  const match=/^\/api\/cases\/([a-f0-9-]+)(?:\/(files|message|analyze|status|followup|delete|review))?$/.exec(route);
  if(match) {
   const [,id,action]=match,r=await rowFor(u,id);
   if(!action&&req.method==='GET')return json(res,await caseView(u,id));
   if(req.method!=='POST')fail(405,'Método no permitido.');
   if(action==='files') {
    authorizeCase(u,r,true);const f=fileInput(b),fid=randomUUID();
    const inserted=await query(`WITH reserved AS (UPDATE vcp_cases SET file_count=file_count+1,file_bytes=file_bytes+$2,revision=revision+1,updated_at=NOW()
     WHERE id=$1 AND file_count<6 AND file_bytes+$2<=12582912 AND (analyzing_until IS NULL OR analyzing_until<NOW()) RETURNING id)
     INSERT INTO vcp_files(id,case_id,payload,size) SELECT $3,id,$4,$2 FROM reserved RETURNING id`,[id,f.size,fid,encrypt(f,`file:${fid}:${id}`)]);
    if(!inserted.length)fail(409,'Se permiten hasta 6 archivos (12 MB por caso), fuera de un análisis en curso.');
    return json(res,{id:fid,name:f.name},201);
   }
   if(action==='message') {
    authorizeCase(u,r,true);const p=unpack(r);if(p.messages.length>=80)fail(400,'El historial alcanzó su límite. Solicita revisión del equipo.');
    p.messages.push({role:'student',text:text(b.text,1,8000),at:now()});await updateCase(r,p);return json(res,await caseView(u,id));
   }
   if(action==='followup') {
    authorizeCase(u,r,true);if(typeof b.enabled!=='boolean')fail(400,'Preferencia inválida.');
    await updateCase(r,unpack(r),r.status,{followup:b.enabled});return json(res,await caseView(u,id));
   }
   if(action==='delete') {
    authorizeCase(u,r,true);if(b.confirm!==true)fail(400,'Confirma la eliminación.');
    await query('DELETE FROM vcp_cases WHERE id=$1 AND owner_email=$2',[id,u.email]);return json(res,{ok:true});
   }
   if(action==='status') {
    authorizeCase(u,r,true);
    if(!['waiting_amazon','resolved','documents'].includes(b.status)||r.status==='human_review')fail(400,'El equipo debe actualizar los casos en revisión humana.');
    const p=unpack(r),note=text(b.note,10,3000);
    p.messages.push({role:'student',text:`Estado declarado: ${b.status}. ${note}`,at:now()});await updateCase(r,p,b.status);return json(res,await caseView(u,id));
   }
   if(action==='review') {
    if(!isStaff(u))fail(403,'Esta acción corresponde al equipo de revisión.');
    if(!statuses.includes(b.status))fail(400,'Estado inválido.');
    const p=unpack(r);p.messages.push({role:'coach',text:text(b.text,10,8000),at:now()});await updateCase(r,p,b.status);
    await notifyCase(await rowFor(u,id),'review','María dejó instrucciones en tu expediente.');return json(res,await caseView(u,id));
   }
   if(action==='analyze') {
    authorizeCase(u,r,true);
    if(r.status==='human_review')fail(409,'María está revisando este caso. Puedes aportar información; la estrategia automática está pausada.');
    if(r.status==='resolved')fail(409,'El caso está marcado como resuelto. Reábrelo antes de continuar.');
    const p=unpack(r);if(p.reports.length>=20)fail(400,'Este expediente necesita revisión del equipo antes de más análisis.');
    await aiQuota(hash(u.email));const lock=randomUUID();
    const locked=await query(`UPDATE vcp_cases SET analyzing_until=NOW()+INTERVAL '5 minutes',analyzing_token=$2
     WHERE id=$1 AND revision=$3 AND (analyzing_until IS NULL OR analyzing_until<NOW()) RETURNING id`,[id,lock,r.revision]);
    if(!locked.length)fail(409,'Hay un análisis en curso o nueva información. Actualiza tu caso.');
    try {
     const rows=await query('SELECT id,payload FROM vcp_files WHERE case_id=$1 ORDER BY created_at',[id]);
     const files=rows.map(f=>({...decrypt(f.payload,`file:${f.id}:${id}`),id:f.id}));
     const input={case:p.case,messages:p.messages,reports:p.reports.slice(-2)};
     const report=await analyzeCase(input,files);p.reports.push(report);
     const status=report.needsHuman?'human_review':report.missing.length?'documents':'ready';
     const saved=await query(`UPDATE vcp_cases SET payload=$2,status=$3,revision=revision+1,analyzing_until=NULL,analyzing_token=NULL,updated_at=NOW()
      WHERE id=$1 AND analyzing_token=$4 RETURNING *`,[id,encrypt(p,`case:${id}`),status,lock]);
     if(!saved.length)fail(409,'El expediente cambió. Actualiza para ver su estado.');
     if(report.needsHuman)await notifyCase(saved[0],'escalation',`Resumen:\n${report.summary}\n\nMotivo para escalar:\n${report.escalationReason}\n\nHallazgos:\n${report.findings.join('\n')}\n\nFaltantes:\n${report.missing.join('\n')}\n\nPregunta pendiente:\n${report.questions.join('\n')}`);
     await notifyCase(saved[0],'analysis',report.needsHuman?'Tu caso pasó a revisión especializada.':'La revisión está disponible con tus próximos pasos.');
     return json(res,await caseView(u,id));
    } finally {await query('UPDATE vcp_cases SET analyzing_until=NULL,analyzing_token=NULL WHERE id=$1 AND analyzing_token=$2',[id,lock]);}
   }
  }
  const file=/^\/api\/files\/([a-f0-9-]+)$/.exec(route);
  if(file&&req.method==='GET') {
   const [f]=await query('SELECT * FROM vcp_files WHERE id=$1',[uuid(file[1])]);if(!f)fail(404,'Archivo no encontrado.');
   await rowFor(u,f.case_id);const d=decrypt(f.payload,`file:${f.id}:${f.case_id}`);
   res.setHeader('Content-Type',d.mime);res.setHeader('Content-Disposition',`attachment; filename="documento"; filename*=UTF-8''${encodeURIComponent(d.name)}`);
   res.end(Buffer.from(d.base64,'base64'));return;
  }
  fail(404,'Ruta no encontrada.');
 } catch(error) {
  const e=summarizeError(error);
  // Do not log input, document contents, provider responses, database URLs or email addresses.
  if(e.status===500)console.error('VCP operation failed',error?.constructor?.name||'UnknownError');
  json(res,{error:e.message},e.status);
 }
}
