from pathlib import Path
p=Path(__file__).resolve().parents[1]/'public/index.html'
s=p.read_text()
repls={
'Vista previa interactiva.':'Asistencia con inteligencia artificial.',
'Vista previa</span>':'Coach VCP</span>',
'Vista previa para revisión':'Tu centro de apoyo',
' Vista previa interactiva.':'',
'El flujo previsto incluye recordatorios y novedades de tu caso. Si necesita una revisión especializada, María recibirá el contexto completo.':'Recibe novedades y, si los activas, recordatorios de tu caso. Cuando necesites una revisión especializada, María tendrá el expediente organizado.',
'Disponible al activar el servicio':'A tu ritmo',
'¿Qué puedo probar en esta vista previa?':'¿Cómo guardo y retomo mi caso?',
'Puedes recorrer ambos agentes, completar formularios, seleccionar archivos y descargar un resumen. Todavía no se analizan los archivos, no se investiga la web y no se envían correos. Usa datos de prueba: lo que escribas se conserva solo mientras esta página esté abierta.':'El acceso está abierto. Verifica tu correo con un código para crear un expediente privado y retomarlo desde cualquier dispositivo. Para revisar una marca o tienda solo necesitas completar la consulta.',
'El escalamiento previsto reúne':'El escalamiento reúne',
'El acompañamiento continúa por correo cuando el servicio esté activo. Los casos complejos tendrán revisión especializada de María.':'Continúa desde tu correo o desde Mis casos. María revisa los casos que requieren atención especializada.',
'Usa datos de prueba. El análisis con IA, la consulta web y los correos aún no están conectados. Nada se envía ni se guarda en una cuenta.':'El agente revisa información y propone próximos pasos. La decisión sobre tu cuenta corresponde a Amazon.',
'<button class="text-button" id="fill-example" type="button">Usar un caso de ejemplo</button>':'<a class="text-button" href="#casos">Mis casos</a>',
'En esta vista previa no recibirás correos.':'Te enviaremos un código para proteger tu expediente.',
'Los datos permanecen en esta pestaña.':'Tu expediente tendrá acceso privado.',
'Hasta 5 archivos de 20 MB cada uno':'Hasta 6 archivos de 2 MB cada uno',
'Los archivos seleccionados permanecen en tu navegador. Esta vista previa muestra su nombre y tamaño; todavía no lee ni valida su contenido.':'Sube únicamente los documentos relevantes. Se guardarán de forma privada y se procesarán con IA. No incluyas contraseñas ni códigos de acceso. Conserva los originales.',
'Preparar ruta preliminar':'Guardar y analizar mi caso',
'TU RUTA PRELIMINAR':'TU SIGUIENTE PASO',
'Esta guía se organiza según la categoría que seleccionaste. No representa un diagnóstico de tu notificación ni una revisión de tus documentos.':'Revisa los hallazgos y aporta lo que falte. Una revisión de coherencia documental no certifica autenticidad ni garantiza aceptación por Amazon.',
'Editar mi caso':'Aportar información',
'Preparar revisión':'Investigar ahora',
'Vista previa: se prepara la consulta; todavía no se buscan fuentes en internet.':'Investigación en la web con fuentes y fecha de consulta. Puede tardar uno o dos minutos.',
}
for a,b in repls.items():s=s.replace(a,b)
s=s.replace('<a href="#como-funciona">Cómo funciona</a>','<a href="#como-funciona">Cómo funciona</a><a href="#casos">Mis casos</a>')
s=s.replace('<div class="side-note">','<button type="button" class="side-option" data-go="casos">Mis casos</button><div class="side-note">',1)
s=s.replace('<main id="landing">','<div id="service-notice" class="service-notice" role="status" hidden></div><div id="error-notice" class="error-notice" role="alert" hidden></div><main id="landing">')
s=s.replace('<div class="form-bottom"><span>Tu expediente tendrá acceso privado.</span>', '''<label class="check-row"><input type="checkbox" id="case-consent" required> Acepto el tratamiento de la información para gestionar mi caso y su revisión por el equipo. <a href="#privacidad">Ver privacidad</a></label><label class="check-row"><input type="checkbox" id="case-followup"> Quiero recordatorios por correo de mis tareas pendientes.</label><div class="form-bottom"><span>Tu expediente tendrá acceso privado.</span>''')
s=s.replace('<section id="research-tool" hidden>','''<section id="cases-tool" hidden><div class="workspace-heading"><div><p class="eyebrow">TU EXPEDIENTE, CONTIGO</p><h1 class="display">CONTINÚA DONDE<br>LO DEJASTE.</h1><p id="account-label">Accede con tu correo para ver tus casos.</p></div></div><div class="button-row"><button class="btn dark" id="sign-in">Acceder con mi correo</button><a href="#infracciones" class="btn outline">Abrir nuevo caso</a><button class="btn outline" id="sign-out" hidden>Cerrar sesión</button></div><div id="case-list" class="case-list" aria-live="polite"></div></section><section id="research-tool" hidden>''')
s=s.replace('<button class="text-button" id="show-report-demo"', '<button hidden class="text-button" id="show-report-demo"')
s=s.replace('href="#preguntas">¿Tienes dudas?', 'href="#privacidad">Privacidad y datos')
s=s.replace('<div class="followup-panel">','<div id="case-history" class="form-card"></div><div id="case-actions" class="form-card"></div><div class="followup-panel">')
s=s.replace('<span class="pill status-pending"><span class="dot"></span>Pendiente de revisión</span>','<span class="pill status-pending" id="case-status"><span class="dot"></span>Documentos pendientes</span>')
p.write_text(s)
print('Interfaz conectada preparada')
