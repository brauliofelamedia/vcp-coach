# Coach VendeComoPro

Aplicación preparada el 14 de octubre de 2026 a partir del diseño aprobado por Ori.

## Base del agente de compras — actualización del 14/10/2026

Se incorporó íntegramente la referencia del usuario `Texto pegado(1).txt` en `server/research-playbook.mjs`, con cuatro modos: Marca, Supplier, Producto/ASIN y Lead completo. Incluye políticas de marca, devoluciones, cadena upstream, matching, semáforos y evaluación de evidencia. Las reglas distinguen ausencia de prohibición de autorización, facturas de cadena de suministro y autenticidad de permiso de reventa. No se alteró la base del agente de infracciones.

Entradas nuevas: ASIN o URL de Amazon, captura PNG/JPG/WEBP (una, hasta 2 MB, con consentimiento), costo y precio en la misma moneda y notas de tarifas/datos del producto. No hay acceso privado a SellerAmp/SmartScout; la IA solo puede revisar capturas o datos aportados. Rentabilidad incompleta debe quedar como no evaluable. Los scores son educativos y deben explicar evidencia y cobertura.

La búsqueda pública recibe únicamente nombres, URLs e identificadores de producto. Las capturas, costos y notas se analizan en una llamada sin herramientas externas; no se guardan como expediente. Para una captura sin ASIN escrito, una primera llamada privada extrae únicamente el ASIN antes de buscar. Los resultados admiten tablas y descarga del informe. El formulario conserva el diseño VCP aprobado.

**Esta actualización está incorporada al código y al paquete de entrega; todavía no se ha desplegado.** No activa AI Gateway, no aplica el esquema de Neon ni configura Resend. El servicio público sigue pendiente de activación y pruebas reales. No se simularon respuestas visibles para alumnos.

## Estado real de entrega

El código de la interfaz, API, agentes, acceso por correo, expedientes, revisión humana y correos está implementado. **Desplegado en https://vcp-coach.vercel.app; los servicios de IA, expedientes y correo todavía no están activados ni probados de extremo a extremo.** La portada muestra el aviso de activación pendiente.

Proyecto confirmado: `prj_J1eDJTV0qNWu8WHpEdjRwpXhPfuq`, cuenta `oriana6` / `team_CNVrPC5JwJzYCSl1jQuy4T5T`. Primer despliegue `dpl_2mfDtWnHabR5LQf8MqHVLdEoVLJ7`, estado READY. Vercel asignó el primer despliegue a production y vinculó `vcp-coach.vercel.app`. Se confirmó la portada y su aviso en el navegador; esto no acredita el funcionamiento de los agentes.

Validado: sintaxis de los módulos, recursos oficiales de marca, IDs de formularios, consentimiento, separación de archivos públicos/privados y 21 pruebas automatizadas de seguridad/manejo de errores. Las pruebas usan datos sintéticos y respuestas de proveedor simuladas; no acreditan conexión a IA, Neon, Resend ni un despliegue funcional.

Bloqueos observados:

- El fallo inicial de acceso quedó resuelto para creación, lectura y despliegue: el usuario autenticado tiene como cuenta predeterminada exactamente `team_CNVrPC5JwJzYCSl1jQuy4T5T`. La consulta por ID único y las operaciones sin selector explícito usan esa misma cuenta y funcionan. El selector explícito `teamId` devuelve 403. Verificar siempre el `accountId` devuelto; nunca cambiar a otra cuenta. El endpoint de logs sigue devolviendo 403 incluso sin selector.
- No hay CLI de Vercel disponible. Instalar dependencias desde el entorno local falló por resolución de red (`registry.npmjs.org`).
- AI Gateway muestra crédito de pago $0 y el paso de activar crédito gratuito pendiente. No se compró crédito ni se aceptó una suscripción.
- Neon: el usuario autorizó los acuerdos y se aceptaron el 14/10/2026. Base **vcp-coach-db** creada y disponible en plan **Free**, región **iad1**, Auth adicional desactivado. Store `store_8y4qwy6kufmwQ7f5`, recurso Neon `sparkling-snow-30241703`, instalación `icfg_8idvw0hyhDZc9g35hsGA6gWk`. Conectada únicamente a `vcp-coach`, Production y Preview, con credenciales sensibles y ramas automáticas para despliegues Preview. Vercel confirmó DATABASE_URL y las variables de Neon sin revelar sus valores. Falta ejecutar el esquema: el editor requiere verificación con el autenticador del usuario. El despliegue existente es anterior a estas variables; redesplegar tras completar el esquema y los servicios.
- AI Gateway: al seleccionar crédito gratuito aparece «Add a Card». El usuario debe completar la verificación de tarjeta en Vercel. No se introdujeron datos de tarjeta ni se activó crédito.
- Resend: se preparó la instalación, pero la revisión automática rechazó pulsar «Continue» por posible aceptación de términos y creación de una API key sin autorización específica. No se continuó ni se creó la cuenta/clave. El dominio vendecomopro.net no aparece en la cuenta Vercel consultada; verificar la ruta de configuración del remitente y su DNS antes de comprometer cambios. No comprar ni transferir un dominio para resolverlo.
- La portada desplegada se inspeccionó visualmente en escritorio, con el logotipo y tipografías cargados. Recorridos reales y revisión móvil pendientes.
- Se configuraron en Vercel APP_URL, STAFF_EMAILS, ESCALATION_EMAIL, AI_GATEWAY_MODEL, AI_DAILY_LIMIT, RETENTION_DAYS, EMAIL_FROM y tres secretos aleatorios: AUTH_SECRET, DATA_ENCRYPTION_KEY y CRON_SECRET. Los secretos permanecen cifrados en Vercel y no se incluyen en este paquete. Conservar la clave de cifrado al continuar; no regenerarla.

## Qué incluye

- Diseño VCP aprobado, logotipo oficial, Anton/Montserrat locales, navegación adaptable.
- Revisión de marca, supplier, producto y lead completo a través de Responses API de Vercel AI Gateway (activación pendiente). Fuentes tomadas de anotaciones del proveedor. Veredictos y scores condicionados a evidencia suficiente; sin garantía de compra segura, autorización o aceptación de facturas.
- Acceso abierto con verificación de email mediante código, para proteger cada expediente. No verifica matrícula ni pide credenciales de Amazon.
- Casos privados: aviso, mercado, categoría, plazo indicado, documentos, conversación, análisis anteriores y estado.
- PDF/JPG/PNG/WEBP: hasta 6 archivos de 2 MB. Se envían como documentos/imágenes al modelo y se almacenan cifrados en Postgres. Este límite mantiene cada carga por debajo del límite de payload de las funciones.
- Procedimientos operativos derivados de la referencia de apelaciones, con tratamiento explícito de discrepancias, evidencias pendientes, vinculación, autenticidad, identidad, IP y Sección 3. No se incorporaron expedientes históricos con datos personales a la aplicación.
- Búsqueda de políticas con términos genéricos. Los avisos/documentos privados nunca se incluyen en búsquedas web. El análisis privado no tiene herramientas externas.
- Revisión humana: María accede con `maria@vendecomopro.net`, ve expedientes, deja instrucciones y libera o mantiene la pausa. Solo se escala automáticamente cuando el análisis requiere intervención. Los mensajes no se envían a Amazon.
- Correos de acceso, actualización y escalamiento. Recordatorios opcionales cada tres días, evaluados por cron diario. Cola duradera, intentos limitados, arrendamiento de trabajo e idempotencia para reducir duplicados. Los correos pendientes nunca se presentan como enviados.
- Eliminación del expediente por su titular y retención de 180 días sin actividad. No modifica Seller Central.
- Límites por IP, correo y día global; protección de sesión/CSRF, cifrado AES-256-GCM ligado al expediente, comprobación de permisos en cada descarga y exclusión de datos sensibles de logs.

## Arquitectura

Se conserva el stack HTML/CSS/JavaScript de la vista previa existente y se añade una función Node 24 en `api/index.mjs`. No se sustituye el diseño por un framework distinto. Neon se accede por su driver HTTP. Resend y AI Gateway usan sus APIs oficiales desde servidor. Solo `public/` es público; `server/` contiene lógica y criterios privados.

La aplicación no tiene modo de respuestas ficticias: ante un fallo de IA devuelve un error y conserva el caso, sin generar un resultado simulado.

## Activación en Vercel

1. Reutilizar el proyecto existente **vcp-coach**, ID `prj_J1eDJTV0qNWu8WHpEdjRwpXhPfuq`, en **oriana6**. La cuenta predeterminada del conector ya fue verificada; usar el ID exacto del proyecto y comprobar que pertenece al mismo equipo.
2. Proyecto ya creado con Node 24, framework Other, `npm run build`, salida `public` y OIDC habilitado. Mantener el aviso de activación hasta completar los servicios y comprobaciones.
3. Neon y `DATABASE_URL` ya están conectados. Completar la verificación del editor y aplicar `server/schema.sql` en la base dedicada. Crear un remitente de Resend verificado para `vendecomopro.net` y añadir `RESEND_API_KEY` una vez autorizado. Usar credenciales secretas del proyecto, nunca el chat ni el frontend. No usar `onboarding@resend.dev` para estudiantes reales.
4. Activar AI Gateway y establecer su presupuesto. Modelo consultado en el catálogo oficial el 14/10/2026: `openai/gpt-6-luna`; soporta PDF, imágenes, herramientas, búsqueda web y respuestas estructuradas. Antes de activar verificar que sigue disponible para la cuenta y crédito elegidos. En Vercel usar `VERCEL_OIDC_TOKEN` del proyecto. Fuera de Vercel usar `AI_GATEWAY_API_KEY`.
5. Configurar variables de `.env.example`. `APP_URL` debe ser el origen público definitivo sin barra final (incluido https). No usar un Host enviado por el visitante. Generar `AUTH_SECRET` y `CRON_SECRET` aleatorios de al menos 32 bytes; `DATA_ENCRYPTION_KEY` debe ser exactamente 32 bytes codificados en base64. Guardar copia privada de la clave de cifrado: cambiarla sin migración impediría abrir los expedientes existentes.
6. Con CLI autenticado y proyecto enlazado, instalar dependencias y conservar `package-lock.json` real. No se suministra un lockfile inventado. Obtener `.env.local` de forma segura, ignorada por Git; verificar nombres de variables sin imprimir valores.
7. Ejecutar `npm run check`, `npm test` y `npm run db:migrate`. La migración crea tablas/índices sin modificar datos ajenos. Se debe aplicar **antes** de activar los expedientes y completar el siguiente despliegue. No hay endpoint público de migración.
8. Desplegar desde esta raíz. Configuración y cron están en `vercel.json`. Comprobar que `/api/health` devuelve `ready: true`; esto prueba presencia de configuración, **no** conectividad a todos los servicios.
9. Completar las pruebas reales de aceptación y revisar logs sin datos privados. Solo después compartir la URL de producción.

## Pruebas de aceptación pendientes

- Confirmar resolución de `/api/*` a la función correcta en Vercel; build e importación del driver Neon.
- Recibir un código en un correo de prueba autorizado; rechazar código incorrecto/expirado, verificar sesión y cerrar sesión.
- Crear dos usuarios de prueba y confirmar que no pueden abrir casos/descargar archivos ajenos; verificar acceso de María y restricciones del titular.
- Crear caso sintético, guardar PDF e imagen de prueba, volver desde otra sesión y recuperar documentos/historial.
- Ejecutar un análisis real, comprobar revisión de los archivos y correspondencia de fuentes. Probar un caso insuficiente sin borrador y uno complejo con revisión humana.
- Investigar una marca con política explícita, una marca ambigua y una tienda marketplace con vendedor tercero. Verificar que no se inventan fuentes y que no se infiere autorización por ausencia de prohibición.
- Probar producto por ASIN, URL y captura; lead completo con supplier; captura ilegible y sin consentimiento; producto distinto y campos financieros incompletos. Confirmar que no recomienda comprar cuando faltan datos críticos y que no inventa tarifas, ventas, scores o acceso a SellerAmp/SmartScout. Evaluar salidas reales, tablas y navegación de los cuatro modos en escritorio/móvil.
- Revisar instrucciones de María y comprobar que el agente permanece pausado mientras el estado sea revisión humana.
- Confirmar recepción de email de escalamiento autorizado, acceso privado al enlace, estado de correos pendientes, opt-out y deduplicación del cron.
- Simular fallo del modelo y confirmar que conserva el caso sin resultado ficticio; probar conflicto de análisis concurrente.
- Inspección visual en escritorio y móvil, teclado, formularios y errores. La vista aprobada se conserva pero los nuevos paneles necesitan esa revisión.

## Variables

| Variable | Uso |
| --- | --- |
| APP_URL | Origen estable, enlaces por email y verificación CSRF |
| DATABASE_URL | Conexión privada de Neon |
| AUTH_SECRET | HMAC de códigos, sesiones y límites |
| DATA_ENCRYPTION_KEY | AES-256-GCM para casos, archivos y correos en cola |
| RESEND_API_KEY / EMAIL_FROM | Envío y remitente verificado |
| STAFF_EMAILS | Correos exactos autorizados para revisión; inicial María |
| ESCALATION_EMAIL | maria@vendecomopro.net |
| CRON_SECRET | Autorización independiente del cron |
| AI_GATEWAY_MODEL | Identificador verificado en el catálogo |
| VERCEL_OIDC_TOKEN | Lo aporta Vercel; no copiarlo al frontend |
| AI_GATEWAY_API_KEY | Solo cuando se usa una clave en vez de OIDC |
| AI_DAILY_LIMIT | 150 operaciones de usuario diarias globales por defecto; un análisis usa hasta tres solicitudes IA (captura sin ASIN: extracción, búsqueda y análisis privado) |
| RETENTION_DAYS | 180 por defecto; ajustar también el texto de privacidad si se cambia |

## Límites conocidos

- No se ejecutó una evaluación de calidad de los agentes con casos reales ni revisión final de María. La base operativa recoge criterios de la referencia, no afirma verificar todas las políticas vigentes.
- No hay conexión a Seller Central. El estudiante carga respuestas y declara estado; la reactivación requiere evidencia.
- No se incluyen correos automáticos de marketing. La cola no reintenta mensajes de antigüedad superior a 20 horas para evitar duplicados fuera de la ventana de idempotencia; esos fallos se muestran como pendientes/fallidos en el caso.
- La retención de logs de proveedores es independiente de la eliminación de registros del portal.
- El código tiene límites de carga, pero no antivirus ni verificación forense. Documentos se descargan como adjuntos, nunca se ejecutan.
- Para volumen de producción, revisar presupuesto, monitorización y capacidad de Neon/Resend/Vercel según el plan; no se contrataron planes ni se asumieron costes mensuales.

## Referencias técnicas consultadas

- https://ai-gateway.vercel.sh/v1/models
- https://vercel.com/docs/ai-gateway/models-and-providers/web-search
- https://vercel.com/docs/ai-gateway/inputs-and-tools/file-input
- https://vercel.com/docs/ai-gateway/inputs-and-tools/tool-use
- https://neon.com/docs/serverless/serverless-driver
- https://resend.com/docs/api-reference/emails/send-email

Continuación: el usuario debe completar la verificación del autenticador en el editor y la tarjeta requerida para el crédito gratuito de IA. Obtener autorización específica para Resend; aplicar esquema, configurar remitente y completar las pruebas reales. No volver a crear la base, el proyecto, el diseño ni regenerar los secretos existentes.
