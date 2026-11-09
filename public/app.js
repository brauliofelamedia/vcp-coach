'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={mode:'brand',research:null,messages:[],chatResults:[],chatBusy:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s?new Date(s).toLocaleString('es',{dateStyle:'medium',timeStyle:'short'}):'';
function error(message){$('#error-notice').textContent=message;$('#error-notice').hidden=false;}
function clearError(){$('#error-notice').hidden=true;}
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;setTimeout(()=>$('#toast').hidden=true,4500);}
async function api(path,body){const r=await fetch('/api'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin'});let data;try{data=await r.json();}catch{throw Error('No pudimos contactar el servicio. Inténtalo más tarde.');}if(!r.ok){const e=Error(data.error||'No se pudo completar la operación.');e.status=r.status;throw e;}return data;}
async function run(button,label,fn){if(button?.disabled)return;clearError();const old=button?.innerHTML;if(button){button.disabled=true;button.textContent=label;}try{return await fn();}catch(e){error(e.message);}finally{if(button){button.disabled=false;button.innerHTML=old;}}}
function download(content,name){const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showDialog(title,html){$('#dialog-title').textContent=title;$('#dialog-label').textContent='COACH VENDECOMOPRO';$('#dialog-body').innerHTML=html;if(!$('#detail-dialog').open)$('#detail-dialog').showModal();}
$('#close-dialog').onclick=()=>$('#detail-dialog').close();
function section(title,items,ordered=false){if(!items?.length)return '';const tag=ordered?'ol':'ul';return `<section class="report-block"><h3>${esc(title)}</h3><${tag}>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</${tag}></section>`;}
function sources(items){return `<section class="report-block"><h3>Fuentes consultadas</h3>${items?.length?`<ul class="source-links">${items.map(x=>{let u;try{u=new URL(x.url);if(u.protocol!=='https:')return '';}catch{return '';}return `<li><a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(x.title||u.hostname)} ↗</a><small>${esc(u.hostname)}</small></li>`;}).join('')}</ul>`:'<p class="subtle-note">No se verificaron fuentes públicas actuales. Confirma los requisitos de tu aviso en Seller Central.</p>'}</section>`;}

const nowLabel=()=>new Date().toLocaleString('es');
const toBase64=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('No se pudo leer el archivo.'));reader.readAsDataURL(file);});
const researchLabels={brand:'Marca',store:'Tienda / proveedor',product:'Producto / ASIN',lead:'Lead completo'};
function researchMode(mode){
 state.mode=mode;const store=mode==='store',detailed=['product','lead'].includes(mode);
 $$('[data-research]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.research===mode));b.tabIndex=b.dataset.research===mode?0:-1;});
 $('#brand-name-field').hidden=store;$('#brand-name').required=mode==='brand';$('#brand-name').disabled=store;
 $('#research-url').required=store||mode==='lead';$('#research-url-label').textContent=store||mode==='lead'?'Enlace de la tienda, proveedor o producto':detailed?'Producto del supplier para comparar (opcional)':'Web oficial (opcional)';
 $('#research-url-help').textContent=detailed?'Usa la página del producto que comprarías para comparar el modelo, tamaño y pack.':store?'Revisaremos al vendedor real y qué documentación puede acreditar.':'Ayuda a distinguir marcas con nombres similares.';
 $('#research-url').placeholder=mode==='brand'?'https://www.marca.com':'https://www.tienda.com/producto';
 $('#research-form-title').textContent={brand:'¿Qué marca quieres revisar?',store:'¿Dónde estás pensando comprar?',product:'¿Qué producto quieres analizar?',lead:'Revisemos el lead completo'}[mode];
 $$('.research-product-field').forEach(el=>{el.hidden=!detailed;el.querySelectorAll('input,select,textarea').forEach(f=>f.disabled=!detailed);});
 $('#research-form-intro').textContent={brand:'Revisamos restricciones de reventa, distribución y qué debes confirmar en Seller Central.',store:'Pega el enlace. Revisamos identidad, origen del inventario, facturación, reventa y devoluciones.',product:'Comparamos el producto y calculamos rentabilidad solo con los datos disponibles.',lead:'Revisamos proveedor, marca, producto y costos para señalar el siguiente paso.'}[mode];
 $('#research-panel').setAttribute('aria-labelledby',mode+'-tab');$('#research-result').hidden=true;
 $('#research-companion-copy').textContent=detailed?'Comparamos producto, marca y evidencia. Lo que falte quedará señalado antes de tomar una decisión.':store?'Separamos empresa legítima, producto auténtico, cadena de suministro y autorización de marca.':'Distinguimos restricciones confirmadas de políticas no encontradas.';
 $('#research-source-list').innerHTML=(detailed?['Política de marca y riesgo de categoría','Matching exacto y cadena de suministro','Rentabilidad solo con datos suficientes']:store?['Identidad y tipo de proveedor','Facturación y cadena de suministro','Devoluciones y reputación externa']:['Política oficial de la marca','Condiciones para marketplaces','Fuentes, país y fecha']).map(s=>`<li>${esc(s)}</li>`).join('');
 $('.companion-bottom').textContent=store?'Una factura comercial no equivale a cadena de suministro ni autorización para Amazon.':detailed?'La recomendación depende del producto exacto, los gastos y los permisos de tu cuenta.':'No encontrar una prohibición no equivale a tener autorización para revender.';
}
$$('[data-research]').forEach(b=>{b.onclick=()=>researchMode(b.dataset.research);b.onkeydown=e=>{const modes=Object.keys(researchLabels);if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?3:(modes.indexOf(state.mode)+(e.key==='ArrowRight'?1:3))%4;researchMode(modes[index]);$('#'+state.mode+'-tab').focus();}};});
function researchHtml(value){
 const lines=String(value).split('\n'),out=[];
 const inline=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 const cells=s=>s.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(line.includes('|')&&i+1<lines.length&&/^\|?\s*:?-{3,}/.test(lines[i+1].trim())&&cells(lines[i+1]).every(x=>/^:?-{3,}:?$/.test(x))){
   const head=cells(line),rows=[];i+=2;
   while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){rows.push(cells(lines[i]));i++;}i--;
   out.push(`<div class="research-table-wrap"><table><thead><tr>${head.map(x=>`<th scope="col">${inline(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${head.map((_,j)=>`<td>${inline(row[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  }else if(/^#{1,6}\s/.test(line))out.push(`<h3>${inline(line.replace(/^#{1,6}\s+/,''))}</h3>`);
  else if(line.trim()&&!/^(```|---+$)/.test(line.trim()))out.push(`<p>${inline(line)}</p>`);
 }
 return out.join('');
}
$('#research-form').onsubmit=e=>{
 e.preventDefault();if(!e.target.reportValidity())return;
 run(e.target.querySelector('[type=submit]'),'Investigando fuentes…',async()=>{
  const detailed=['product','lead'].includes(state.mode),image=detailed?$('#research-image').files[0]:null;
  if(image&&(image.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(image.type)))throw Error('Usa una captura JPG, PNG o WEBP de hasta 2 MB.');
  if(image&&!$('#research-image-consent').checked)throw Error('Confirma el análisis de la captura con IA.');
  if(detailed&&!$('#research-amazon').value.trim()&&!image)throw Error('Añade el ASIN, enlace de Amazon o captura del producto.');
  const data={mode:state.mode,name:$('#brand-name').value,url:$('#research-url').value,market:$('#research-market').value,product:$('#research-product').value};
  if(detailed)Object.assign(data,{amazon:$('#research-amazon').value,cost:$('#research-cost').value===''?null:Number($('#research-cost').value),price:$('#research-price').value===''?null:Number($('#research-price').value),currency:$('#research-currency').value,notes:$('#research-notes').value,imageConsent:$('#research-image-consent').checked});
  if(image)data.image={name:image.name,mime:image.type,base64:await toBase64(image)};
  $$('[data-research]').forEach(b=>b.disabled=true);
  $('#research-result').hidden=false;$('#research-result').innerHTML='<p class="busy-label" role="status">Revisando políticas, producto y fuentes. Esto puede tardar hasta tres minutos…</p>';
  try{
   const r=await api('/research',data);state.research=r;
   $('#research-result').innerHTML=`<div class="result-status"><h2 class="display">TU REVISIÓN</h2><span class="pill">${esc(researchLabels[data.mode])}</span></div><p class="analysis-meta">${esc(data.market)} · Consultado ${esc(date(r.checkedAt))}</p><div class="research-answer">${researchHtml(r.text)}</div>${sources(r.sources)}<p class="notice-line">La evidencia pública no garantiza autenticidad, autorización ni aceptación documental por Amazon.</p><button class="btn dark" id="download-research">Descargar informe</button>`;
   $('#download-research').onclick=()=>download(`VENDECOMOPRO · ${researchLabels[data.mode].toUpperCase()} · ${nowLabel()}\n\n${r.text}\n\nFUENTES\n${r.sources.map(s=>s.title+'\n'+s.url).join('\n\n')}`,'VCP-revision.txt');
  }catch(e){$('#research-result').innerHTML=`<p role="alert">${esc(e.message)}</p>`;throw e;}
  finally{$$('[data-research]').forEach(b=>b.disabled=false);}
 });
};
function renderChat(){
 $('#chat-welcome').hidden=state.messages.length>0;
 $('#chat-messages').innerHTML=state.messages.map((m,i)=>`<article class="chat-message ${m.role}"><span class="chat-speaker">${m.role==='user'?'TÚ':'COACH VCP · IA'}</span><div class="research-answer">${researchHtml(m.content)}</div>${m.role==='assistant'?sources(state.chatResults[(i-1)/2]?.sources):''}</article>`).join('');
 $('#download-chat').disabled=!state.messages.length;$$('[data-prompt]').forEach(b=>b.disabled=state.chatBusy);
 const count=state.messages.length/2;$('#chat-count').textContent=`${count} de 7 preguntas · Descarga la conversación antes de salir.`;
 $('#send-chat').disabled=count>=7||state.chatBusy;
 $('#chat-topic').disabled=state.messages.length>0||state.chatBusy;$('#chat-market').disabled=state.messages.length>0||state.chatBusy;
}
$$('[data-prompt]').forEach(b=>b.onclick=()=>{$('#chat-question').value=b.dataset.prompt;$('#chat-topic').value=b.dataset.topic;$('#chat-question').focus();});
$('#chat-form').onsubmit=async e=>{
 e.preventDefault();if(state.chatBusy||!e.target.reportValidity())return;
 const question=$('#chat-question').value.trim();if(!question)return;
 state.chatBusy=true;clearError();renderChat();$('#new-chat').disabled=true;$('#chat-question').readOnly=true;
 $('#send-chat').textContent='Consultando…';$('#chat-status').textContent='Revisando tu pregunta y referencias oficiales. Puede tardar hasta dos minutos…';
 try{
  const messages=[...state.messages,{role:'user',content:question}];
  const r=await api('/chat',{messages,topic:$('#chat-topic').value,market:$('#chat-market').value,consent:$('#chat-consent').checked});
  state.messages=[...messages,{role:'assistant',content:r.text}];state.chatResults.push(r);$('#chat-question').value='';$('#chat-status').textContent='';renderChat();
  $('#chat-messages').lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){$('#chat-status').textContent=e.message;}
 finally{state.chatBusy=false;$('#new-chat').disabled=false;$('#chat-question').readOnly=false;$('#send-chat').textContent='Preguntar al coach';renderChat();}
};
$('#new-chat').onclick=()=>{if(state.chatBusy)return;state.messages=[];state.chatResults=[];$('#chat-status').textContent='';$('#chat-question').value='';renderChat();$('#chat-question').focus();};
$('#download-chat').onclick=()=>download(`COACH VENDECOMOPRO · ${nowLabel()}\n\n${state.messages.map((m,i)=>(m.role==='user'?'TÚ':'COACH VCP · IA')+'\n'+m.content+(m.role==='assistant'?'\n\nFUENTES\n'+state.chatResults[(i-1)/2].sources.map(s=>s.title+'\n'+s.url).join('\n'):'')).join('\n\n')}\n\nOrientación educativa. Verifica los hechos antes de actuar.`,'VCP-conversacion.txt');
function privacy(){showDialog('TU INFORMACIÓN.',`<div class="privacy-copy"><p>Esta versión ofrece consultas sin registro. No pide correo, no crea expedientes ni envía mensajes al equipo. La conversación permanece en la memoria de esta pestaña y se pierde al recargar o iniciar otra. Puedes descargarla en tu dispositivo.</p><p>Tu pregunta y el contexto de esta conversación se envían a Vercel AI Gateway y al modelo de IA para generar la respuesta. La aplicación no almacena conversaciones ni capturas en una base de datos y solicita al proveedor no guardar la respuesta para su recuperación. Los registros operativos y la retención de proveedores se rigen por sus condiciones.</p><p>La búsqueda del chat usa únicamente el tema y el marketplace seleccionados, no tu texto privado. En la herramienta de compras se consultan nombres, URLs e identificadores públicos de productos. Las capturas, costos y notas se analizan por separado, sin enviarlos a la búsqueda web. De una captura sin ASIN escrito se extrae únicamente ese identificador público.</p><p>No incluyas contraseñas, códigos de acceso, datos bancarios ni documentos de identidad. Oculta datos personales en las capturas. La asistencia es educativa; no garantiza decisiones de Amazon, autenticidad de productos ni resultados de inversión. Si necesitas revisión humana, contacta directamente a tu coach.</p></div>`);}
function navigate(){clearError();let route=location.hash.slice(1)||'inicio';if(route==='privacidad'){privacy();return;}if(route==='infracciones'||route==='casos'||route.startsWith('caso/'))route='chat';const active=['chat','marcas'].includes(route);$('#landing').hidden=active;$('#workspace').hidden=!active;$('#chat-tool').hidden=route!=='chat';$('#research-tool').hidden=route!=='marcas';$$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===route));if(active)window.scrollTo({top:0,behavior:'smooth'});else requestAnimationFrame(()=>document.getElementById(route)?.scrollIntoView());}
$$('[data-go]').forEach(b=>b.onclick=()=>location.hash=b.dataset.go);
window.addEventListener('hashchange',navigate);
async function init(){researchMode('brand');renderChat();navigate();try{const health=await api('/health');if(!health.configured){$('#service-notice').textContent=health.message;$('#service-notice').hidden=false;}}catch{$('#service-notice').textContent='No pudimos comprobar la conexión del servicio. Intenta enviar tu consulta en unos minutos.';$('#service-notice').hidden=false;}}
init().catch(e=>error(e.message));
