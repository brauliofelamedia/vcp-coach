# Análisis de producto, Keepa, BSR y rentabilidad

## 1. Identificar coincidencia exacta

Antes de evaluar, validar:
- Marketplace (US, CA, MX, etc.), ASIN, variante y UPC/EAN cuando haya.
- Marca y fabricante, tamaño/pack count, bundle, color, modelo, condición,
  packaging y fecha de expiración si aplica.
- Oferta FBA/FBM, si la Buy Box es comparable y si Amazon mismo vende.
- Precio/stock de la tienda, límites por cliente y condiciones de compra.

No asumir que la fotografía de un retailer coincide con el ASIN. Si hay duda,
marcar `Match pendiente` y detener el cálculo concluyente.

## 2. Lectura de demanda

- **BSR:** indicar rango y categoría. El BSR es relativo y fluctúa, no equivale a
  unidades vendidas. Preferir tendencia histórica y categoría correcta.
- **Ventas mensuales estimadas:** herramienta/método, fecha, intervalo cuando sea
  posible, y declaración explícita de estimación, no ventas observadas.
- **Keepa:** analizar histórico de precio/Buy Box, caídas de BSR, rotación aparente,
  variación de vendedores, stock y entradas de Amazon como vendedor. No deducir
  unidades exactas únicamente de caídas de ranking.
- **Competencia:** cantidad de vendedores, estabilidad de Buy Box, presencia de
  Amazon/propietario de marca, saturación y riesgo de guerra de precios.

Cuando no haya Keepa, RevSeller, Seller Central u otra fuente, declarar que esos
indicadores no están comprobados. No inventar ventas usando solo una captura de precio.

## 3. Costos (una unidad, moneda declarada)

Inputs sugeridos:
- `P`: precio de venta proyectado, basado en mercado/Buy Box realista.
- `C`: costo compra por unidad menos descuentos que sean aplicables y demostrables.
- `T`: impuestos de compra no recuperables por unidad.
- `S`: envío del proveedor y manejo por unidad.
- `PR`: prep/etiquetado/embolsado por unidad.
- `IN`: inbound shipping, placement y otros cargos de entrada aplicables por unidad.
- `F`: referral fee Amazon.
- `FF`: fulfillment fee FBA (o envío FBM, según corresponda).
- `O`: otros costos relevantes asignados por unidad: almacenamiento, suscripción,
  devoluciones/mermas esperadas, cupones, publicidad, retiradas, tasas adicionales.

**Costo de adquisición/logística previa (inversión unit.):**
`I = C + T + S + PR + IN`

**Utilidad neta estimada:**
`U = P − (I + F + FF + O)`

**ROI sobre inversión previa:**
`ROI = (U / I) × 100` si `I > 0`.

**Margen neto sobre ventas:**
`Margen = (U / P) × 100` si `P > 0`.

Aclarar que definiciones de ROI varían entre equipos/herramientas; detallar
qué incluye el denominador. Si algún coste desconocido impide certeza, dar
escenario provisional etiquetado o solicitar el dato sin fabricar un resultado.
Usar tarifas Seller Central/Revenue Calculator actualizadas; no aplicar tarifas
estándar a todos los artículos/marketplaces.

## 4. Escenarios de sensibilidad

Para compras significativas, calcula al menos:
- Escenario base con Buy Box viable.
- Precio -10% (o variación justificada por Keepa).
- Tarifas/logística +10% o caída de demanda, según el principal riesgo.

Indicar que no son predicciones. También estimar días de stock si existe un
ritmo estimado verificable y se conoce el inventario competidor de forma suficiente.
No confundir demanda total del listing con ventas capturables por este vendedor.

## 5. Cumplimiento y condiciones

Revisar restricciones de marca/ASIN/categoría, permisos de productos restringidos,
caducidad, peligrosos/hazmat, condición «New», empaquetado, garantía, seguridad,
y políticas de devolución del retailer/proveedor. Las reglas varían por marketplace
y cambian; corroborar con Seller Central.

## 6. Recomendación final

- `Considerar compra de prueba`: match confirmado, números favorables bajo supuestos
  claros, riesgos de fuente/reventa aceptablemente documentados y cuenta elegible.
- `Validar antes de comprar`: oportunidad potencial con incógnita relevante.
- `Descartar por ahora`: margen negativo, inconsistencia de ASIN, restricciones
  conocidas no resueltas o alto riesgo de fuente.

No usar «comprar seguro» ni prometer ingresos. Enviar siempre el factor que más
podría cambiar la decisión.
