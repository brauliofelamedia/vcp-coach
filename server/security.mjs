import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new AppError(status, message); };
export function required(name) { return process.env[name] || fail(503, 'El servicio todavía necesita configuración. Inténtalo más tarde.'); }
export function text(value, min = 0, max = 12000) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(400, 'Revisa los campos y su extensión.');
  return value.trim();
}
export function email(value) {
  const v = text(value, 3, 254).toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)) fail(400, 'Introduce un correo válido.');
  return v;
}
export function uuid(value) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value || '')) fail(400, 'Identificador inválido.');
  return value;
}
export function equal(a, b) {
  const aa = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function hash(value) { return createHmac('sha256', required('AUTH_SECRET')).update(value).digest('hex'); }
export function token() { return randomBytes(32).toString('base64url'); }
function key() {
  const k = Buffer.from(required('DATA_ENCRYPTION_KEY'), 'base64');
  if (k.length !== 32) fail(503, 'Almacenamiento privado pendiente de configuración.');
  return k;
}
export function encrypt(value, context) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(context));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}
export function decrypt(value, context) {
  const b = Buffer.from(value, 'base64'), d = createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
  d.setAAD(Buffer.from(context)); d.setAuthTag(b.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
}
export function publicUrl(value, optional = false) {
  if (!value && optional) return '';
  const s = text(value, 5, 1500); let u;
  try { u = new URL(s); } catch { fail(400, 'El enlace debe comenzar por https://.'); }
  const h = u.hostname.toLowerCase();
  if (u.protocol !== 'https:' || u.username || u.password || isIP(h.replace(/^\[|\]$/g, '')) || !h.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(h) || u.port || h.endsWith('.localhost')) fail(400, 'Usa un enlace público HTTPS sin credenciales.');
  return u.href;
}
export const isStaff = user => (process.env.STAFF_EMAILS || 'maria@vendecomopro.net').split(',').map(x => x.trim().toLowerCase()).includes(user.email);
export function mayRead(user, row) { return user && (user.email === row.owner_email || isStaff(user)); }
export function authorizeCase(user, row, ownerOnly = false) {
  if (!row || !mayRead(user, row) || (ownerOnly && row.owner_email !== user.email)) fail(404, 'No se encontró el caso.');
  return row;
}
export const issues = ['unknown','reactivation','linked','section3','authenticity','ip','identity','listing'];
export const markets = ['Estados Unidos','México','Canadá','España','Otro marketplace'];
export function validateCase(body) {
  const d = { name:text(body.name,1,80),market:text(body.market,1,50),issue:text(body.issue,1,30),notice:text(body.notice,20,12000),asin:text(body.asin||'',0,200),prior:text(body.prior||'',0,8000),deadline:text(body.deadline||'',0,10) };
  if (!issues.includes(d.issue) || !markets.includes(d.market) || body.consent !== true) fail(400, 'Confirma los datos y el tratamiento del caso.');
  if (d.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(d.deadline) || !Number.isFinite(Date.parse(d.deadline)))) fail(400,'Fecha inválida.');
  return d;
}
export function fileInput(body) {
  const name = text(body.name,1,180).replace(/[\x00-\x1f/\\<>:"|?*]/g,'_');
  const mime = text(body.mime,1,80), base64 = text(body.base64,1,2800000);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) fail(400,'Archivo no válido.');
  const b = Buffer.from(base64,'base64');
  if (!b.length || b.length > 2 * 1024 * 1024) fail(413,'Cada archivo debe pesar hasta 2 MB.');
  const valid = (mime==='application/pdf' && b.subarray(0,5).toString()==='%PDF-') ||
    (mime==='image/png' && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
    (mime==='image/jpeg' && b[0]===255 && b[1]===216 && b[2]===255) ||
    (mime==='image/webp' && b.subarray(0,4).toString()==='RIFF' && b.subarray(8,12).toString()==='WEBP');
  if (!valid) fail(400,'Solo se admiten PDF, PNG, JPG o WEBP válidos.');
  return {name,mime,base64:b.toString('base64'),size:b.length};
}
export function checkOrigin(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.headers.origin !== new URL(required('APP_URL')).origin) fail(403,'Origen de solicitud no autorizado.');
    if (!String(req.headers['content-type']||'').startsWith('application/json')) fail(415,'Formato de solicitud no válido.');
  }
}
export function cookie(value, clear = false) {
  const secure = new URL(required('APP_URL')).protocol === 'https:';
  return `vcp_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 604800}${secure ? '; Secure' : ''}`;
}
export function getSessionToken(req) {
  const v = /(?:^|;\s*)vcp_session=([A-Za-z0-9_-]{43})(?:;|$)/.exec(req.headers.cookie || '');
  return v?.[1] || '';
}
export function summarizeError(error) { return error instanceof AppError ? {status:error.status,message:error.message} : {status:500,message:'No pudimos completar la operación. Tu información guardada sigue disponible. Inténtalo de nuevo.'}; }
