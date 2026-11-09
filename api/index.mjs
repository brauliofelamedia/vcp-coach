import { createHash } from 'node:crypto';
import { AppError, fail, checkOrigin } from '../server/security.mjs';
import { chat, research } from '../server/ai.mjs';
import { validateChat } from '../server/chat-input.mjs';
import { validateResearch } from '../server/research-input.mjs';
import { limit } from '../server/public-limit.mjs';
import { gatewayAuth, withGatewayAuth } from '../server/gateway-auth.mjs';
export const config={maxDuration:300};
function json(res,value,status=200){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));}
async function body(req){
 let raw=req.body;
 if(raw===undefined){let size=0,chunks=[];for await(const p of req){size+=p.length;if(size>3000000)fail(413,'La solicitud es demasiado grande.');chunks.push(p);}raw=Buffer.concat(chunks).toString();}
 if(Buffer.byteLength(typeof raw==='string'?raw:JSON.stringify(raw))>3000000)fail(413,'La solicitud es demasiado grande.');
 let data;try{data=typeof raw==='string'?JSON.parse(raw):raw;}catch{fail(400,'Solicitud inválida.');}
 if(!data||typeof data!=='object'||Array.isArray(data))fail(400,'Solicitud inválida.');return data;
}
async function handle(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const route=new URL(req.url,'http://localhost').pathname.replace(/\/$/,'');
 try{
  if(route==='/api/health'&&req.method==='GET'){
   const configured=Boolean(process.env.APP_URL&&process.env.AI_GATEWAY_MODEL&&gatewayAuth());
   return json(res,{mode:'public-consultations',configured,providerVerified:false,message:configured?'Configuración presente. La disponibilidad de IA se comprueba al enviar una consulta.':'Estamos terminando de activar las respuestas de IA.'});
  }
  if(!['/api/chat','/api/research'].includes(route))fail(404,'Esta función no está habilitada. Usa el chat o el análisis de compras.');
  if(req.method!=='POST')fail(405,'Método no permitido.');
  checkOrigin(req);
  const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  const key=createHash('sha256').update(ip).digest('hex');
  limit('request:'+key,40,3600000);
  const b=await body(req),data=route==='/api/chat'?validateChat(b):validateResearch(b);
  limit('ai:'+key,12,3600000);
  limit('ai:instance',Math.max(1,Number(process.env.AI_DAILY_LIMIT)||150),86400000);
  return json(res,route==='/api/chat'?await chat(data):await research(data));
 }catch(e){return json(res,{error:e instanceof AppError?e.message:'No pudimos completar la consulta. Inténtalo de nuevo.'},e instanceof AppError?e.status:500);}
}

export default function handler(req,res){return withGatewayAuth(req,()=>handle(req,res));}
