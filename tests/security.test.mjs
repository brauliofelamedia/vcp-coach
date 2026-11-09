import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { authorizeCase, encrypt,decrypt,hash,email,publicUrl,fileInput,validateCase,checkOrigin,cookie,getSessionToken,summarizeError } from '../server/security.mjs';
import { citations, officialSources,validateReport,response } from '../server/ai.mjs';
import handler from '../api/index.mjs';
process.env.AUTH_SECRET=randomBytes(32).toString('base64url');
process.env.DATA_ENCRYPTION_KEY=randomBytes(32).toString('base64');
process.env.APP_URL='https://vcp-coach.vercel.app';
process.env.STAFF_EMAILS='maria@vendecomopro.net';
test('student isolation: owning a case ID does not grant access',()=>{
 const row={id:'case-a',owner_email:'owner@example.com'};
 assert.throws(()=>authorizeCase({email:'other@example.com'},row),e=>e.status===404);
 assert.equal(authorizeCase({email:'owner@example.com'},row),row);
 assert.equal(authorizeCase({email:'maria@vendecomopro.net'},row),row);
 assert.throws(()=>authorizeCase({email:'maria@vendecomopro.net'},row,true));
 assert.throws(()=>authorizeCase({email:'maria@vendecomopro.net.evil.example'},row));
});
test('encrypted documents are bound to their case and resist tampering',()=>{
 const value=encrypt({notice:'private invoice'},'file:A:case1');
 assert.equal(decrypt(value,'file:A:case1').notice,'private invoice');
 assert.throws(()=>decrypt(value,'file:A:case2'));
 const b=Buffer.from(value,'base64');b[b.length-1]^=1;
 assert.throws(()=>decrypt(b.toString('base64'),'file:A:case1'));
 assert.notEqual(value,encrypt({notice:'private invoice'},'file:A:case1'));
});
test('missing encryption key never falls back to plaintext',()=>{const key=process.env.DATA_ENCRYPTION_KEY;delete process.env.DATA_ENCRYPTION_KEY;assert.throws(()=>encrypt({private:true},'case'));process.env.DATA_ENCRYPTION_KEY=key;});
test('public links reject internal hosts, credentials, local IPs and script protocols',()=>{
 for(const u of ['javascript:alert(1)','http://example.com','https://localhost','https://127.0.0.1','https://[::1]','https://2130706433','https://metadata.internal','https://foo.localhost','https://user:secret@example.com','https://example.com:1234'])assert.throws(()=>publicUrl(u),u);
 assert.equal(publicUrl('https://example.com/policy'),'https://example.com/policy');
});
test('file validation uses bytes as well as MIME, and rejects oversized content',()=>{
 assert.throws(()=>fileInput({name:'fake.pdf',mime:'application/pdf',base64:Buffer.from('<script>evil</script>').toString('base64')}));
 assert.throws(()=>fileInput({name:'large.pdf',mime:'application/pdf',base64:Buffer.alloc(2200000).toString('base64')}));
 assert.equal(fileInput({name:'../invoice.pdf',mime:'application/pdf',base64:Buffer.from('%PDF-1.7 test fixture').toString('base64')}).name,'.._invoice.pdf');
});
test('CSRF: cross-site and non-JSON mutations fail; same-site JSON passes',()=>{
 assert.throws(()=>checkOrigin({method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'}}));
 assert.throws(()=>checkOrigin({method:'POST',headers:{origin:process.env.APP_URL,'content-type':'text/plain'}}));
 assert.doesNotThrow(()=>checkOrigin({method:'POST',headers:{origin:process.env.APP_URL,'content-type':'application/json'}}));
});
test('session cookie is HttpOnly, Secure and Strict; malformed cookies fail closed',()=>{
 assert.match(cookie('token'),/HttpOnly; SameSite=Strict/);assert.match(cookie('token'),/Secure/);
 assert.equal(getSessionToken({headers:{cookie:'other_session=abc'}}),'');
 assert.equal(getSessionToken({headers:{cookie:`vcp_session=${'a'.repeat(43)}`}}),'a'.repeat(43));
});
test('email header injection and missing consent are rejected',()=>{
 assert.throws(()=>email('a@example.com\r\nBcc:b@example.com'));
 const c={name:'Ana',issue:'linked',market:'Estados Unidos',notice:'Amazon has deactivated this account because of a linked account.',consent:true};
 assert.equal(validateCase(c).issue,'linked');assert.throws(()=>validateCase({...c,consent:false}));
});
test('citations only come from actual provider annotations, never prose URLs',()=>{
 const data={output:[{content:[{type:'output_text',text:'https://invented.example',annotations:[{type:'url_citation',url:'https://sellercentral.amazon.com/help',title:'Amazon'},{type:'url_citation',url:'javascript:alert(1)'},{type:'url_citation',url:'https://sellercentral.amazon.com.evil.example/help'}]}]}]};
 const sources=citations(data);assert.equal(sources.length,2);assert.equal(officialSources(sources).length,1);
 assert.equal(citations({output_text:'https://invented.example'}).length,0);
});
const completeReport=()=>({title:'Test',summary:'Review',draft:'Draft',escalationReason:'',needsHuman:false,findings:[],missing:[],questions:[],steps:[],documentReview:[],limitations:[]});
test('material gaps or escalation suppress any generated draft',()=>{
 assert.equal(validateReport({...completeReport(),missing:['Missing invoice']}).draft,'');
 assert.equal(validateReport({...completeReport(),needsHuman:true}).draft,'');
 assert.equal(validateReport(completeReport()).draft,'Draft');
 assert.throws(()=>validateReport({title:'invalid'}));
});
test('gateway errors cannot become fabricated successful results',async()=>{
 const original=globalThis.fetch;process.env.AI_GATEWAY_API_KEY='test-only';process.env.AI_GATEWAY_MODEL='test/model';
 try{
  globalThis.fetch=async()=>new Response('{}',{status:402});
  await assert.rejects(response('system','prompt'),e=>e.status===503);
  globalThis.fetch=async()=>Response.json({status:'incomplete',output_text:'partial'});
  await assert.rejects(response('system','prompt'),e=>e.status===502);
 }finally{globalThis.fetch=original;delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_MODEL;}
});
test('unexpected database/provider errors do not expose credentials',()=>{
 const e=summarizeError(Error('postgresql://user:secret@private.host'));
 assert.equal(e.status,500);assert.doesNotMatch(e.message,/secret|postgres|private.host/);
});
test('HTTP handler rejects mutations before touching database on hostile origin',async()=>{
 let result;const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){result=JSON.parse(v);}};
 await handler({url:'/api/chat',method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:{}},res);
 assert.equal(res.statusCode,403);assert.match(result.error,/Origen/);assert.equal(res.headers['Cache-Control'],'no-store');
});
test('health accurately indicates unconfigured services without leaking names or values',async()=>{
 let result;const res={setHeader(){},end(v){result=JSON.parse(v);}};
 await handler({url:'/api/health',method:'GET',headers:{}},res);
 assert.equal(result.configured,false);assert.equal(res.statusCode,200);assert.doesNotMatch(JSON.stringify(result),/DATABASE_URL|AUTH_SECRET/);
});
test('deferred cron route cannot run',async()=>{
 let result;const res={setHeader(){},end(v){result=JSON.parse(v);}};
 await handler({url:'/api/cron',method:'GET',headers:{}},res);assert.equal(res.statusCode,404);
});
