import { fail, text, markets } from './security.mjs';
export const topics = {
 general:'Seller Central getting started selling account operations',
 reactivation:'account deactivation section 3 appeal account health',
 linked:'multiple selling accounts linked accounts appeal',
 authenticity:'product authenticity invoice documentation intellectual property',
 identity:'seller identity verification documentation',
 listing:'listing restrictions product compliance FBA inventory',
 sourcing:'reselling sourcing invoices authorized distributors',
 profit:'FBA referral fees revenue calculator profitability'
};
export function validateChat(b) {
 if(b.consent!==true)fail(400,'Acepta el análisis de tu consulta con IA.');
 if(!Object.hasOwn(topics,b.topic))fail(400,'Elige un tema válido.');
 if(!markets.includes(b.market))fail(400,'Elige un marketplace válido.');
 if(!Array.isArray(b.messages)||!b.messages.length||b.messages.length>13)fail(400,'La conversación es demasiado larga. Descárgala y empieza otra.');
 const messages=b.messages.map((m,i)=>{
  if(!m||m.role!==(i%2?'assistant':'user'))fail(400,'La conversación tiene un formato inválido.');
  return {role:m.role,content:text(m.content,1,m.role==='user'?8000:24000)};
 });
 if(messages.at(-1).role!=='user'||messages.reduce((n,m)=>n+m.content.length,0)>60000)fail(400,'La conversación es demasiado larga. Descárgala y empieza otra.');
 return {topic:b.topic,market:b.market,messages};
}
// Only fixed topic and marketplace labels enter web search, never chat text.
export function chatSearchInput(data) {
 return `Amazon Seller Central ${topics[data.topic]} mercado ${data.market}. Orientación oficial actual. Fecha ${new Date().toISOString().slice(0,10)}.`;
}
