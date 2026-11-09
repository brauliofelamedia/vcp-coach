import { fail } from './security.mjs';
// Best-effort, per warm instance. This is not a distributed spending cap.
const buckets=new Map();
export function limit(key,max,windowMs,now=Date.now()) {
 for(const [k,v]of buckets)if(v.until<=now)buckets.delete(k);
 const b=buckets.get(key)||{count:0,until:now+windowMs};
 if(b.count>=max)fail(429,'Has alcanzado el límite de consultas por ahora. Inténtalo más tarde.');
 if(!buckets.has(key)&&buckets.size>=2000)fail(429,'El servicio está ocupado. Inténtalo más tarde.');
 b.count++;buckets.set(key,b);
}
