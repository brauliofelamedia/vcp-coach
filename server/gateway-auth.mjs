import { AsyncLocalStorage } from 'node:async_hooks';
const requestAuth=new AsyncLocalStorage();
// Vercel supplies its short-lived OIDC token on each function request, not
// necessarily in process.env. Keep it request-scoped; never log or persist it.
export function withGatewayAuth(req,fn){
 const token=req.headers?.['x-vercel-oidc-token'];
 return requestAuth.run(typeof token==='string'?token:'',fn);
}
export function gatewayAuth(){return process.env.AI_GATEWAY_API_KEY||requestAuth.getStore()||process.env.VERCEL_OIDC_TOKEN||'';}
