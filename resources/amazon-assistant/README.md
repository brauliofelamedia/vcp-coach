# Amazon Assistant — Skill compartible

**Versión:** 1.0.0 (20 de octubre de 2026)  
**Idioma:** español (responde en el idioma del usuario)  
**Ámbito:** Amazon FBA, Online Arbitrage, Wholesale, análisis de productos, tiendas,
proveedores, marcas y restricciones.  
**Origen:** adaptación compartible de las instrucciones de Amazon Assistant.

## ¿Qué hace?

1. Evalúa si una **tienda** parece legítima para investigar compras OA.
2. Investiga **suppliers** y **mayoristas**, con énfasis en cadena de suministro,
   documentación y relación con marcas.
3. Investiga **marcas**, políticas de revendedores, riesgos de IP y comprobaciones
   necesarias en Seller Central.
4. Analiza **ASIN/productos**: BSR, ventas mensuales estimadas, vendedores,
   Buy Box/Keepa, costos, ROI, márgenes y términos de devoluciones.
5. Ayuda a organizar **hojas de sourcing** y preparar mensajes a proveedores.

## Estructura

- `SKILL.md` — instrucciones principales para el agente.
- `references/` — procedimientos especializados y plantillas.
- `examples/` — respuestas modelo con datos ficticios.
- `PROMPT-PARA-CHATGPT.txt` — instrucciones para usarlo como recurso en una
  conversación de ChatGPT que no admita importación de skills.

## Cómo instalar o compartir

**Entornos compatibles con skills basados en SKILL.md**

Descomprime el ZIP y agrega la carpeta completa `amazon-assistant-skill` a la
ubicación de skills que admita tu aplicación/agente. Conserva las carpetas
`references/` y `examples/`. Las opciones exactas de importación dependen de la
plataforma.

**ChatGPT en una conversación normal**

Adjunta `SKILL.md` junto con las referencias necesarias y escribe «Sigue las
instrucciones del skill Amazon Assistant para analizar mi consulta». Alternativamente,
usa el archivo `PROMPT-PARA-CHATGPT.txt` como instrucciones iniciales de un GPT propio.
Adjuntar el archivo a una conversación no garantiza instalación permanente ni
acceso a otros chats. Para compartir uso continuo, configura un GPT/asistente
propio o el sistema de skills que ofrezca tu plataforma.

## Datos recomendados al usarlo

Para tienda/supplier: nombre, URL oficial, país y (si aplica) marcas.  
Para producto: marketplace, ASIN/URL Amazon, URL del proveedor, costo real,
impuestos, shipping, prep, cantidad y capturas Keepa/Seller Central si están disponibles.

**Importante:** esta es una capacidad de análisis/instrucciones, no una conexión
a Amazon, Keepa, RevSeller ni Seller Central. No contiene credenciales ni
concede acceso; requiere permisos y herramientas del entorno. Sus veredictos
son preliminares si faltan datos o consulta web.
