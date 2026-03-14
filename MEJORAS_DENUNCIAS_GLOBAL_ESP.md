# Mejoras propuestas para `global_esp` (más estructura, menos texto libre)

Fecha de elaboración: 16 de febrero de 2026.

Objetivo: reducir al mínimo los campos de texto libre y maximizar datos estructurados en JSON para generación posterior de denuncia.

## Base de priorización (datos y marco legal)

- Según el **Balance de Criminalidad Cuarto Trimestre 2024** (acumulado enero-diciembre 2024, España):
  - Hurtos: **649.076**
  - Robos con violencia/intimidación: **63.266**
  - Robos con fuerza (domicilios/establecimientos/instalaciones): **114.978**
  - Lesiones graves/menos graves y riña tumultuaria: **29.342**
  - Delitos contra la libertad sexual: **21.159**
  - Estafas informáticas: **414.133**
- En el **Balance T3 2025** (enero-septiembre 2025) siguen muy altos patrimonio y ciber, con subida de delitos sexuales.
- Código Penal (España), artículos clave para tipificación inicial en formularios:
  - Hurto: art. 234
  - Robo (concepto): art. 237
  - Robo con fuerza: art. 238
  - Robo con violencia/intimidación: art. 242
  - Lesiones: art. 147
  - Amenazas: arts. 169 y 171
  - Agresión sexual: arts. 178 y 179
  - Daños: art. 263
  - Estafa: art. 248

---

## Propuestas numeradas

1. Añadir una **categoría global nueva**: `ESTAFA / ESTAFA INFORMÁTICA`.
2. Añadir una **categoría global nueva**: `COACCIONES`.
3. Añadir una **categoría global nueva**: `ALLANAMIENTO / USURPACIÓN`.
4. Añadir una **categoría global nueva**: `APROPIACIÓN INDEBIDA`.
5. Mantener `OTROS` como escape, pero con subselector obligatorio (lista cerrada de “otros” frecuentes).

6. En `GLOBAL`, tras “característica del hecho”, preguntar siempre **relación patrimonial**: `apoderamiento_hay` (`SI/NO`).
7. Añadir pregunta de **ánimo de lucro aparente** (`SI/NO/NO SABE`) para orientar hurto/robo/daños.
8. Añadir pregunta de **violencia/intimidación sobre persona** (`SI/NO`) previa al flujo patrimonial.
9. Añadir pregunta de **fuerza en cosas** (`SI/NO`) previa al flujo patrimonial.
10. Con 6-9, enrutar automáticamente a hurto/robo fuerza/robo violencia (menos error de clasificación).

11. En todos los flujos, separar `fhl` en estructura fija:
- `hecho_fecha_tipo` (`EXACTA` / `APROXIMADA` / `INTERVALO`)
- `hecho_franja` (`MADRUGADA`, `MAÑANA`, `TARDE`, `NOCHE`)
- `hecho_lugar_tipo` (`VIA_PUBLICA`, `DOMICILIO`, `COMERCIO`, `TRANSPORTE`, etc.)

12. Añadir `lugar_preciso_tipo` (`PORTAL`, `ESCALERA`, `ASCENSOR`, `PARKING`, `CAJA`, `PROBADOR`, etc.) para reducir descripción libre.
13. Añadir `codigo_postal` y `municipio_ine` (id normalizado), no solo texto municipio.
14. Añadir `hecho_intento_o_consumado` (`INTENTO`, `CONSUMADO`) en todas las tipologías.
15. Añadir `n_autores_aprox` (numérico) y `autor_actua_en_grupo` (`SI/NO`).

16. En `HURTO_RVI`, sustituir `tipo_intimidacion` libre por catálogo:
- `VERBAL`
- `GESTUAL`
- `ARMA_BLANCA`
- `ARMA_FUEGO`
- `OTRO_OBJETO_PELIGROSO`
- `SIN_INTIMIDACION`

17. En `HURTO_RVI`, añadir `metodo_sustraccion` (`DESCUIDO`, `TIRON`, `BOLSILLO`, `ARREBATO_VEHICULO`, `OTRO`).
18. En `PATRIMONIO`, añadir `tipo_establecimiento` (supermercado/farmacia/hostelería/otros).
19. En `PATRIMONIO`, añadir `zona_objetivo` (`LINEA_CAJA`, `ALMACEN`, `MOSTRADOR`, `TERRAZA`, etc.).
20. En `ROBO_FUERZA`, estructurar `metodo_acceso` en multiselección (escalo, fractura cerradura, forzamiento puerta, ventana, llave falsa, inhibidor, otro).

21. En `ROBO_FUERZA` y `DANOS`, añadir `danos_tipo` multiselección:
- `CERRADURA`
- `PUERTA`
- `VENTANA`
- `PERSIANA`
- `CRISTAL`
- `MOBILIARIO`
- `VEHICULO`
- `OTRO`

22. En `DANOS`, añadir `danos_medio` (`GRAFITI`, `GOLPE`, `INCENDIO`, `EXPLOSION`, `SUSTANCIA_CORROSIVA`, `OTRO`).
23. En `DANOS`, añadir `tasacion_aportada` (`FACTURA`, `PRESUPUESTO`, `PERITAJE`, `NO`) en vez de solo sí/no.
24. En `LESIONES`, añadir `parte_medico_centro` y `parte_medico_fecha` estructurados.
25. En `LESIONES`, añadir `mecanismo_lesional` (`GOLPE`, `EMPUJON`, `CAIDA`, `ARMA_BLANCA`, `OTRO`).

26. En `AMENAZAS_GLOBAL`, convertir `tipo_amenaza` a matriz estructurada:
- `amenaza_muerte`
- `amenaza_lesion`
- `amenaza_danos_bienes`
- `amenaza_difusion_intima`
- `amenaza_menores`
- `amenaza_condicional` + `condicion_exigida`

27. En `AMENAZAS_GLOBAL`, añadir `canal_amenaza` (`PRESENCIAL`, `TELEFONO`, `WHATSAPP`, `RRSS`, `EMAIL`, `TERCEROS`).
28. En `AMENAZAS_GLOBAL`, añadir `reiteracion` (`HECHO_UNICO`, `REITERADO`) + `n_eventos_aprox`.
29. En `CARACTER_SEXUAL`, añadir selector de **conducta principal** (tocamientos/agresión sin penetración/agresión con penetración/acoso/exhibicionismo).
30. En `CARACTER_SEXUAL`, añadir `consentimiento_manifestado` (`SI`, `NO`, `ANULADA_VOLUNTAD`, `NO_SABE`) para estructurar sin relato largo.

31. En `EXTRAVIO`, añadir `ultimo_lugar_confirmado` y `ultima_hora_confirmada`.
32. En `EXTRAVIO`, añadir `posible_contexto_extravio` (`TRANSPORTE`, `HOSTELERIA`, `VIA_PUBLICA`, `CENTRO_COMERCIAL`, `OTRO`).
33. En `EXTRAVIO`, para objetos: añadir `identificador_objeto` por item (IMEI, serie, matrícula, nº documento, etc.).
34. En `EXTRAVIO`, añadir `recuperacion_posterior` (`SI/NO`) + fecha.

35. En `objects`, separar por esquema según flujo:
- Sustracción: `tipo`, `cantidad`, `valor_total_eur`, `identificador`, `titularidad`
- Extravío: `tipo`, `cantidad`, `identificador`, `descripcion_corta`

36. En todos los flujos con autor, cambiar descripción libre por bloques:
- `sexo_aparente`
- `edad_aprox_rango`
- `altura_aprox_rango`
- `constitucion`
- `rasgo_distintivo`
- `vestimenta_superior`
- `vestimenta_inferior`
- `idioma_o_acento`

37. En cámaras, ampliar a:
- `camaras_hay`
- `camaras_tipo` (`PUBLICA`, `PRIVADA`, `COMERCIO`, `TRANSPORTE`)
- `camaras_rango_horario`
- `camaras_responsable_contacto`
- `camaras_plazo_conservacion_dias`

38. Añadir bloque de **testigos** estructurado en todos los flujos:
- `testigos_hay`
- `testigos_n`
- `testigos_contacto_disponible`

39. Añadir bloque de **evidencias digitales**:
- `evidencia_fotos`
- `evidencia_videos`
- `evidencia_audios`
- `evidencia_capturas`
- `evidencia_documentos`

40. Añadir bloque de **acciones previas**:
- `llamada_112`
- `atencion_medica_urgencias`
- `comunicacion_seguro`
- `denuncia_previa_relacionada`

41. Añadir pregunta de **afectación económica estimada** por tramos (0-400, 401-1000, 1001-3000, >3000).
42. Añadir `medida_cautelar_solicitada` (`ORDEN_ALEJAMIENTO`, `ORDEN_PROTECCION`, `NINGUNA`, `OTRA`).
43. Añadir `riesgo_actual` (`BAJO`, `MEDIO`, `ALTO`, `MUY_ALTO`) con reglas automáticas por respuestas.
44. Añadir control de calidad automático de JSON antes de guardar:
- campos incompatibles
- campos obligatorios por tipología
- incoherencias temporales

45. Reemplazar `resumen` libre largo por “resumen guiado por bloques” y generar texto final concatenando bloques.
46. Mantener un único `textarea` final opcional llamado `detalle_adicional` para casos no cubiertos.

47. Añadir catálogo `objeto_tipo_estandar` (móvil, cartera, documentación, joyas, efectivo, herramienta, bicicleta, patinete, etc.) con opción `OTRO`.
48. Añadir en patrimoniales `propiedad_objeto` (`PROPIO`, `EMPRESA`, `TERCERO`) para mejorar redacción jurídica posterior.
49. Añadir en lesiones/agresión `asistencia_sanitaria_inmediata` (`SI/NO`) y `dias_impedimento_estimado` (rango).
50. Añadir en amenazas/agresión `contacto_posterior_autor` (`SI/NO`) y canal.

51. En violencia de género/doméstica, convertir preguntas texto (`vg_p21`, `vg_p23`) a opciones estructuradas + detalle corto opcional.
52. Añadir en VG/VD campo `menores_identificados` (`SI/NO`) + `conviven_con_autor`.
53. Añadir `arma_utilizada` normalizado en amenazas/agresión/robo violencia.
54. Añadir `consumo_autor_apreciado` (`ALCOHOL`, `DROGAS`, `NO_APRECIADO`, `NO_SABE`) además del bloque VG.

55. Implementar “preguntas dinámicas por frecuencia delictiva” (priorizar patrimonio/ciber/lesiones/sexual):
- más opciones cerradas en esos flujos
- menos peso de texto libre

56. Añadir un `json_schema_version` y un diccionario de compatibilidad para evolución sin romper integraciones.
57. Añadir `confidence_flags` (campos estimados vs observados directos).
58. Añadir `fuente_informacion` por dato clave (`DIRECTA`, `TESTIGO`, `DOCUMENTO`, `CCTV`).
59. Añadir `idioma_declaracion` y `requiere_interprete` para calidad procesal.
60. Añadir `firma_declaracion_confirmacion` (`SI/NO`) y timestamp de confirmación final.

---

## Recomendación de implementación por fases

- Fase 1 (rápida, alto impacto): 1, 6-10, 11-15, 16-21, 26-30, 35-39, 45-46.
- Fase 2 (mejora probatoria): 22-25, 31-34, 40-44, 47-54.
- Fase 3 (madurez de plataforma): 55-60.

---

## Fuentes

1. Portal Estadístico de Criminalidad (Publicaciones y balances):
- https://estadisticasdecriminalidad.ses.mir.es/publico/portalestadistico/publicaciones.html
- https://estadisticasdecriminalidad.ses.mir.es/publico/portalestadistico/balances.html

2. Balance de Criminalidad Cuarto Trimestre 2024 (acumulado anual 2024):
- https://estadisticasdecriminalidad.ses.mir.es/publico/portalestadistico/dam/jcr%3A5642121e-31b6-448d-95f3-fdc8671f5128/Balance%20de%20Criminalidad%20Cuarto%20Trimestre%202024.pdf

3. Balance de Criminalidad Tercer Trimestre 2025 (enero-septiembre 2025):
- https://estadisticasdecriminalidad.ses.mir.es/publico/portalestadistico/dam/jcr%3A260c9ca4-5133-4a51-a820-8d5cf90ba6c7/Balance%20de%20Criminalidad%20Tercer%20Trimestre%202025.pdf

4. INE, Estadística de Condenados Adultos/Menores 2024 (publicada 18/09/2025):
- https://www.ine.es/dyngs/Prensa/ECAECM2024.htm

5. Código Penal (texto consolidado BOE):
- https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444
