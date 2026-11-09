# Coach VendeComoPro · consultas sin registro

Versión del 19 de octubre de 2026. Sitio público: https://vcp-coach.vercel.app

## Alcance actual

- Chat educativo para estudiantes: dudas de Amazon, avisos, compras y rentabilidad. Hasta siete preguntas por conversación; descarga en texto.
- Cuatro revisiones: marca, supplier, producto/ASIN y lead completo, con fuentes y fecha cuando la búsqueda devuelve evidencia.
- Sin registro, correo, dominio propio ni base de datos para estas consultas.
- El historial vive solo en la memoria de la pestaña. No hay expedientes persistentes, revisión humana automática ni envío de correos. Recargar o iniciar otra conversación borra el historial visible.
- Diseño aprobado VCP conservado: naranja, negro, logotipo y tipografías originales.

## Activación y costo

Se mantiene el proyecto existente vcp-coach en el equipo oriana6, plan Hobby. No se han contratado planes, comprado créditos ni habilitado recargas automáticas.

Vercel AI Gateway debe tener acceso al crédito gratuito y un modelo elegible. Se configuró openai/gpt-5-mini, marcado como compatible con Free AI Gateway Credit en el catálogo oficial el 19/10/2026. El panel solicita verificación de tarjeta para activarlo; ese paso debe completarlo la titular directamente en Vercel. La disponibilidad real se comprueba enviando una consulta. Tener las variables configuradas o un despliegue READY no demuestra que la IA pueda responder.

El crédito gratuito es limitado; no garantiza servicio ilimitado. No comprar créditos ni activar recargas sin autorización expresa. Revisar disponibilidad de modelo y funciones de búsqueda una vez activado el crédito.

## Configuración técnica

Node 24; HTML, CSS y JavaScript; una función HTTP nativa. API públicas: GET /api/health, POST /api/chat, POST /api/research. Otras rutas devuelven 404. Se eliminó la programación cron.

Variables necesarias: APP_URL y AI_GATEWAY_MODEL. En Vercel se lee la credencial OIDC por solicitud desde x-vercel-oidc-token usando AsyncLocalStorage para aislar consultas concurrentes. Para desarrollo se admite AI_GATEWAY_API_KEY o VERCEL_OIDC_TOKEN en el entorno. Nunca registrar ni persistir estos tokens.

El endpoint de salud informa configuración presente, no verificación del proveedor. No expone credenciales ni datos personales.

El control de frecuencia vive en memoria y aplica por instancia: 12 consultas por IP/hora, hasta AI_DAILY_LIMIT solicitudes por instancia/día. Puede reiniciarse con el proceso y no se comparte entre instancias; NO es un límite de gasto distribuido. Mantener desactivadas las compras y recargas automáticas. No anunciar un presupuesto garantizado basado en este contador.

## Privacidad y respuestas

El texto del chat no se envía a búsqueda web. Las búsquedas del chat reciben únicamente tema y marketplace de listas fijas. El modelo final recibe por separado conversación y evidencia pública sin herramientas de navegación. El análisis de compras conserva una lista explícita de datos públicos; imágenes, costos y notas se procesan aparte. La extracción de una captura solo permite el ASIN público.

Se usa store:false. Esto no sustituye las condiciones de retención operativa de Vercel y del proveedor. La app no guarda consultas en Neon. La UI escapa respuestas y valida enlaces de fuentes. Los errores no se convierten en respuestas ficticias y no afirman que se haya guardado un caso.

## Desarrollo y verificación

Copiar .env.example a .env.local y completar credenciales solo de manera privada. Ejecutar npm run check y npm test. npm run dev inicia http://localhost:3000.

Las pruebas usan respuestas simuladas del proveedor para comprobar validación, separación de datos privados, errores, origen, rutas deshabilitadas y aislamiento de OIDC concurrente. La comprobación real del proveedor se documenta en verification.txt y deployment-state.json.

## Funciones pospuestas

La implementación previa de expedientes está en archive/private-cases; los módulos de base de datos y correo se conservan como referencia. No se ejecutan en las rutas públicas. Reactivarla requiere integrar y probar autenticación, esquema, correo y autorización. No copiarla directamente a producción.

Las integraciones existentes de Neon y Resend y los secretos de cifrado se conservan sin cambios. No se aplicó esquema de base de datos ni se agregó vendecomopro.net a Vercel o Resend. Los archivos privados, pruebas y documentación no se publican en public/.
