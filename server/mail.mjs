import { query } from './db.mjs';
import { encrypt, decrypt, required, fail } from './security.mjs';
export async function sendEmail(to,subject,text,idempotencyKey) {
 const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${required('RESEND_API_KEY')}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from:required('EMAIL_FROM'),to:[to],subject,text,reply_to:process.env.ESCALATION_EMAIL||'maria@vendecomopro.net'}),signal:AbortSignal.timeout(15000)});
 if(!res.ok) fail(503,'No pudimos enviar el correo. Inténtalo más tarde.');
 const result=await res.json();return result.id;
}
export async function queueMail(id,caseId,to,subject,text) {
 await query('INSERT INTO vcp_mail(id,case_id,payload) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',[id,caseId,encrypt({to,subject,text},`mail:${id}`)]);
 return deliver(id);
}
export async function deliver(id) {
 if(id.startsWith('reminder:')) {
  const eligible=await query(`SELECT m.id FROM vcp_mail m JOIN vcp_cases c ON c.id=m.case_id WHERE m.id=$1 AND c.followup=true AND c.status IN ('documents','ready','waiting_amazon')`,[id]);
  if(!eligible.length){await query("UPDATE vcp_mail SET status='cancelled' WHERE id=$1 AND status<>'sent'",[id]);return 'cancelled';}
 }
 const rows=await query(`UPDATE vcp_mail SET status='processing',attempts=attempts+1,lease_until=NOW()+INTERVAL '2 minutes'
 WHERE id=$1 AND status IN ('pending','processing') AND (lease_until IS NULL OR lease_until<NOW()) AND created_at>NOW()-INTERVAL '20 hours' AND attempts<8 RETURNING *`,[id]);
 if(!rows.length) return 'pending';
 try {
  const m=decrypt(rows[0].payload,`mail:${id}`), provider=await sendEmail(m.to,m.subject,m.text,id);
  await query("UPDATE vcp_mail SET status='sent',sent_at=NOW(),provider_id=$2 WHERE id=$1",[id,provider]);return 'sent';
 } catch { await query("UPDATE vcp_mail SET status='pending',lease_until=NOW()+INTERVAL '5 minutes' WHERE id=$1",[id]);return 'pending'; }
}
export async function processMail() {
 await query("UPDATE vcp_mail SET status='failed' WHERE status IN ('pending','processing') AND (created_at<NOW()-INTERVAL '20 hours' OR attempts>=8)");
 const pending=await query("SELECT id FROM vcp_mail WHERE status IN ('pending','processing') AND (lease_until IS NULL OR lease_until<NOW()) ORDER BY created_at LIMIT 15");
 for(const m of pending) await deliver(m.id);
 return pending.length;
}
