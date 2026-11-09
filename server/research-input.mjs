import { fail, text, publicUrl, fileInput, markets } from './security.mjs';
const modes=['brand','store','product','lead'];
export function validateResearch(b) {
 if(!modes.includes(b.mode))fail(400,'Elige marca, supplier, producto o lead completo.');
 const d={mode:b.mode,name:text(b.name||'',b.mode==='brand'?1:0,150),url:publicUrl(b.url,!['store','lead'].includes(b.mode)),market:text(b.market,1,50),product:text(b.product||'',0,200),asin:'',amazonUrl:'',cost:null,price:null,currency:'',notes:'',image:null};
 if(!markets.includes(d.market))fail(400,'Marketplace inválido.');
 if(['product','lead'].includes(d.mode)) {
  const ref=text(b.amazon||'',0,1500);
  if(ref) {
   if(/^[a-z0-9]{10}$/i.test(ref))d.asin=ref.toUpperCase();
   else {
    const u=new URL(publicUrl(ref));
    if(!/^(www\.)?amazon\.(com|com\.mx|ca|es|co\.uk|de|fr|it|com\.au|co\.jp|in|com\.br)$/.test(u.hostname))fail(400,'Introduce un ASIN de 10 caracteres o una URL de Amazon.');
    d.amazonUrl=u.origin+u.pathname;
    d.asin=/\/(?:dp|gp\/product)\/([a-z0-9]{10})(?:\/|$)/i.exec(u.pathname)?.[1]?.toUpperCase()||'';
    if(!d.asin)fail(400,'Usa el enlace de un producto de Amazon que incluya su ASIN.');
   }
  }
  if(b.image){if(b.imageConsent!==true)fail(400,'Confirma el análisis de la captura con IA.');d.image=fileInput(b.image);if(!d.image.mime.startsWith('image/'))fail(400,'Para este análisis adjunta una captura JPG, PNG o WEBP.');}
  if(!d.asin&&!d.image)fail(400,'Añade el ASIN, enlace de Amazon o una captura del producto.');
  for(const k of ['cost','price']) {const v=b[k];if(v!==undefined&&v!==null&&v!==''){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000)fail(400,'Revisa el costo y el precio.');d[k]=v;}}
  d.currency=text(b.currency||'',0,3).toUpperCase();
  if(d.currency&&!['USD','MXN','CAD','EUR','GBP','AUD','JPY','INR','BRL'].includes(d.currency))fail(400,'Elige una moneda válida.');
  if((d.cost!==null||d.price!==null)&&!d.currency)fail(400,'Indica la moneda del costo y precio.');
  d.notes=text(b.notes||'',0,6000);
 }
 return d;
}
// Explicit whitelist: screenshots, financial figures, free-form notes and extracted
// private content must not be sent to the web-search model.
export function publicResearchInput(d) {
 return {mode:d.mode,marca:d.name,url:d.url,mercado:d.market,producto:d.product,asin:d.asin,amazonUrl:d.amazonUrl};
}
