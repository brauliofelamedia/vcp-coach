import { required, fail } from './security.mjs';
let client;
export async function db() {
  if (!client) { const {neon}=await import('@neondatabase/serverless'); client=neon(required('DATABASE_URL')); }
  return client;
}
export async function query(sql, params=[]) { return (await db()).query(sql,params); }
export async function rate(key, limit, windowSeconds=86400) {
  const bucket = Math.floor(Date.now()/(windowSeconds*1000));
  const rows=await query(`INSERT INTO vcp_rate (key,bucket,count,expires_at) VALUES ($1,$2,1,NOW()+($4::text||' seconds')::interval)
    ON CONFLICT (key,bucket) DO UPDATE SET count=vcp_rate.count+1 WHERE vcp_rate.count<$3 RETURNING count`,[key,bucket,limit,windowSeconds*2]);
  if (!rows.length) fail(429,'Alcanzaste el límite de consultas. Vuelve a intentarlo más tarde.');
}
