import test from 'node:test';
import assert from 'node:assert/strict';
import { validateResearch, publicResearchInput } from '../server/research-input.mjs';
import { research } from '../server/ai.mjs';
import { AMAZON_ASSISTANT_SKILL } from '../server/amazon-assistant.mjs';

const image={name:'private-capture.png',mime:'image/png',base64:Buffer.from([137,80,78,71,13,10,26,10,0]).toString('base64')};
const base={mode:'product',market:'Estados Unidos',amazon:'B012345678',cost:10,price:25,currency:'USD',notes:'private-account-detail'};
test('four analysis modes accept their own minimum inputs and reject incomplete leads',()=>{
 assert.equal(validateResearch({mode:'brand',name:'Example',market:base.market}).mode,'brand');
 assert.equal(validateResearch({mode:'store',url:'https://supplier.example',market:base.market}).mode,'store');
 assert.equal(validateResearch(base).asin,'B012345678');
 assert.equal(validateResearch({...base,mode:'lead',url:'https://supplier.example/p'}).mode,'lead');
 assert.throws(()=>validateResearch({...base,mode:'lead'}));
 assert.throws(()=>validateResearch({...base,amazon:''}));
 assert.throws(()=>validateResearch({...base,mode:'unknown'}));
});
test('product URLs validate Amazon host, extract ASIN and omit query tokens',()=>{
 const d=validateResearch({...base,amazon:'https://www.amazon.com/dp/B012345678?tag=private-tag'});
 assert.equal(d.asin,'B012345678');assert.equal(d.amazonUrl,'https://www.amazon.com/dp/B012345678');
 assert.throws(()=>validateResearch({...base,amazon:'https://amazon.com.evil.example/dp/B012345678'}));
 assert.throws(()=>validateResearch({...base,amazon:'https://www.amazon.com/search'}));
});
test('captures require consent and valid image signatures; prices require a currency',()=>{
 assert.throws(()=>validateResearch({...base,image}));
 assert.throws(()=>validateResearch({...base,image:{...image,base64:'aGVsbG8='},imageConsent:true}));
 assert.throws(()=>validateResearch({...base,image:{name:'x.pdf',mime:'application/pdf',base64:Buffer.from('%PDF-1.7').toString('base64')},imageConsent:true}));
 assert.throws(()=>validateResearch({...base,currency:''}));
 assert.throws(()=>validateResearch({...base,cost:-1}));
 assert.throws(()=>validateResearch({...base,cost:Infinity}));
 assert.equal(validateResearch({...base,amazon:'',image,imageConsent:true}).image.mime,'image/png');
});
test('public search whitelist excludes captures, prices, private notes and arbitrary request fields',()=>{
 const d=validateResearch({...base,image,imageConsent:true,extra:'secret'});
 const p=publicResearchInput(d),serialized=JSON.stringify(p);
 for(const key of ['image','cost','price','currency','notes','extra'])assert.equal(key in p,false);
 assert.doesNotMatch(serialized,/private-account-detail|private-capture|secret/);
});
test('screenshot-only research uses private extraction, public sources, then private analysis',async()=>{
 const original=globalThis.fetch,calls=[];
 process.env.AI_GATEWAY_API_KEY='test-only';process.env.AI_GATEWAY_MODEL='test/model';
 try{
  globalThis.fetch=async(_url,options)=>{
   const body=JSON.parse(options.body);calls.push(body);
   if(calls.length===1)return Response.json({output_text:'{"asin":"B012345678"}'});
   if(calls.length===2)return Response.json({output:[{content:[{type:'output_text',text:'Official policy evidence',annotations:[{type:'url_citation',url:'https://brand.example/policy',title:'Policy'}]}]}]});
   return Response.json({output_text:'CAUTELA: faltan tarifas; rentabilidad no evaluable.',model:'test/model'});
  };
  const result=await research(validateResearch({...base,amazon:'',image,imageConsent:true}));
  assert.equal(calls.length,3);
  assert.equal(calls[0].tools,undefined);assert.equal(calls[2].tools,undefined);
  assert.equal(calls[1].tools[0].type,'web_search');
  assert.doesNotMatch(JSON.stringify(calls[1].input),/private-account-detail|private-capture|base64|costo|precio|moneda/);
  assert.match(JSON.stringify(calls[1].input),/B012345678/);
  assert.match(JSON.stringify(calls[2].input),/private-account-detail/);
  assert.equal(result.sources[0].url,'https://brand.example/policy');
  assert.match(result.text,/no evaluable/);
 }finally{globalThis.fetch=original;delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_MODEL;}
});
test('unreadable screenshot stops before search and uncited research never becomes a report',async()=>{
 const original=globalThis.fetch;let count=0;
 process.env.AI_GATEWAY_API_KEY='test-only';process.env.AI_GATEWAY_MODEL='test/model';
 try{
  globalThis.fetch=async()=>{count++;return Response.json({output_text:'{"asin":""}'});};
  await assert.rejects(research(validateResearch({...base,amazon:'',image,imageConsent:true})),e=>e.status===400);
  assert.equal(count,1);
  globalThis.fetch=async()=>Response.json({output_text:'Unsupported claims, no citations'});
  await assert.rejects(research(validateResearch(base)),e=>e.status===502);
 }finally{globalThis.fetch=original;delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_MODEL;}
});

test('brand and store requests send the attached skill and applicable references to the provider',async()=>{
 const original=globalThis.fetch,calls=[];
 process.env.AI_GATEWAY_API_KEY='test-only';process.env.AI_GATEWAY_MODEL='test/model';
 try{
  globalThis.fetch=async(_url,options)=>{
   calls.push(JSON.parse(options.body));
   return Response.json({output:[{content:[{type:'output_text',text:'Información insuficiente: autorización no verificada.',annotations:[{type:'url_citation',url:'https://brand.example/terms',title:'Terms'}]}]}]});
  };
  for(const input of [{mode:'brand',name:'Example'},{mode:'store',url:'https://supplier.example'}]){
   const result=await research(validateResearch({...input,market:base.market}));
   assert.equal(result.sources.length,1);
  }
  for(const call of calls){
   assert.ok(call.instructions.includes(AMAZON_ASSISTANT_SKILL.instructions));
   assert.ok(call.instructions.includes(AMAZON_ASSISTANT_SKILL.references['references/marcas-restricciones.md']));
   assert.match(call.instructions,/Información insuficiente no significa riesgo bajo/);
   assert.equal(call.tools[0].type,'web_search');
   assert.equal(call.store,false);
   assert.doesNotMatch(call.instructions,/El ejemplo de score 7.8/);
  }
  assert.ok(!calls[0].instructions.includes(AMAZON_ASSISTANT_SKILL.references['references/tiendas-proveedores.md']));
  assert.ok(calls[1].instructions.includes(AMAZON_ASSISTANT_SKILL.references['references/tiendas-proveedores.md']));
  assert.ok(!calls[1].instructions.includes(AMAZON_ASSISTANT_SKILL.references['references/productos-rentabilidad.md']));
 }finally{globalThis.fetch=original;delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_MODEL;}
});
