import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import handler from '../api/index.mjs';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf'};
createServer(async(req,res)=>{try{if(req.url.startsWith('/api/'))return await handler(req,res);const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end('Not found');}}).listen(3000,'127.0.0.1',()=>console.log('Coach VCP: http://localhost:3000'));
