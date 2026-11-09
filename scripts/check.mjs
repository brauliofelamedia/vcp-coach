import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Script } from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=[];
async function walk(dir){for(const name of await readdir(dir)){if(['node_modules','.git','.vercel'].includes(name))continue;const p=join(dir,name),s=await stat(p);if(s.isDirectory())await walk(p);else files.push(p);}}
await walk(root);
for(const file of files.filter(p=>/\.(js|mjs)$/.test(p))){const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(check.status!==0)throw Error(check.stderr);}
new Script(await readFile(join(root,'public/app.js'),'utf8'));
const html=await readFile(join(root,'public/index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
if(new Set(ids).size!==ids.length)throw Error('Duplicate HTML IDs');
if(!ids.includes('chat-consent')||!ids.includes('research-image-consent'))throw Error('Missing consent fields');
if(/__LOGO__|__ANTON__|__MONTSERRAT/.test(html))throw Error('Unresolved branding asset');
for(const path of [...html.matchAll(/(?:src|href)="(\/(?:assets\/[^"#]+|app\.js|app\.css|style\.css))"/g)].map(x=>x[1]))await stat(join(root,'public',path));
const css=await readFile(join(root,'public/style.css'),'utf8');
for(const [,path]of css.matchAll(/url\(['"]?(\/assets\/[^'"\)]+)['"]?\)/g))await stat(join(root,'public',path));
const cfg=JSON.parse(await readFile(join(root,'vercel.json'),'utf8'));
if(cfg.outputDirectory!=='public')throw Error('Only public assets may be exposed');
if(files.some(p=>p.includes('/public/')&&/\.(env|sql|mjs)$/.test(p)))throw Error('Private server file in public assets');
console.log(`PASS: ${files.filter(p=>/\.(js|mjs)$/.test(p)).length} JavaScript modules; HTML IDs; consent; branding assets; public boundary.`);
