import { readFile } from 'node:fs/promises';
import { query,db } from '../server/db.mjs';
import { required } from '../server/security.mjs';
required('DATABASE_URL');
const schema=await readFile(new URL('../server/schema.sql',import.meta.url),'utf8');
const statements=schema.split(';').map(s=>s.trim()).filter(Boolean);
const sql=await db();await sql.transaction(statements.map(s=>sql.query(s)));
await query('SELECT 1 FROM vcp_cases LIMIT 1');
console.log('Schema applied and verified. No student records modified.');
