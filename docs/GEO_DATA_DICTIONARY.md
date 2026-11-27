# GEO_DATA_DICTIONARY — capas y atributos observados

**Estado:** `IMPLEMENTED` (diccionario basado en inspección)  
**Fuente:** KMZ C.R.A. `prioridades-conservacion.kmz` / `doc.kml`  
**Informe:** [`GEO_INSPECTION_REPORT.md`](GEO_INSPECTION_REPORT.md)

> Solo se documentan campos **observados** en el archivo. No se inventan significados institucionales más allá del texto presente en el propio KML.

---

## 1. Capa

| Campo lógico | Valor |
|--------------|-------|
| `code` (interno pipeline) | `cra_prioridades_conservacion` |
| Nombre en KML | `Prioridades de conservación` |
| Descripción (Folder KML) | Priorización de unidades hidrográficas en las 4 subzonas del departamento del Atlántico; escenarios de conservación y acciones de compensación para áreas priorizadas. |
| CRS | EPSG:4326 (WGS84) |
| Geometría normalizada | `MultiPolygon` |
| Representación | **No** asumir manglares individuales |

---

## 2. Identificadores de origen preservados

| Origen | Campo | Notas |
|--------|-------|-------|
| Placemark XML | `id` → `source_placemark_id` | ej. `ID_00000` |
| Tabla HTML | `FID` | único por feature en la muestra inspeccionada |
| Tabla HTML | `FID_ACCION`, `FID_ESCENA`, `OBJECTID_1` | IDs auxiliares del export |
| Tabla HTML | `ZH`, `SZH`, `UH` | códigos observados de zona / subzona / unidad |
| Tabla HTML | `NOMZH`, `NOMSZH`, `NOMUH` | nombres asociados observados |

Todos los pares HTML se guardan íntegros en `properties_original` (JSONB / objeto JSON).

---

## 3. Atributos observados (lista cerrada al archivo)

| Atributo | Presente en inspección | Comentario operativo |
|----------|------------------------|----------------------|
| FID | sí | id tabular |
| FID_ACCION | sí | |
| ZH | sí | código zona hidrográfica |
| NOMZH | sí | nombre zona |
| SZH | sí | código subzona |
| NOMSZH | sí | nombre subzona |
| UH | sí | código unidad hidrográfica |
| NOMUH | sí | nombre unidad |
| Val_Priori | sí | valores observados: Alto / Medio / Bajo |
| Escenarios | sí | Escenario I / II / III |
| AccionGen | sí | Preservación / Restauración / Recuperación / Rehabilitación |
| AccRegiona | sí | acción regional (texto) |
| AccRegDesc | sí | descripción de acción |
| area | sí | texto numérico con coma decimal |
| Shape_Leng | sí | |
| FID_ESCENA | sí | |
| OBJECTID_1 | sí | |
| ESC_I | sí | puede vacío |
| DESC_I | sí | puede vacío |
| ESC_III | sí | puede vacío |
| DESC_III | sí | puede vacío |
| ESC_INT | sí | combinación de escenarios |
| AREA_HA | sí | |
| Escenari_1 | sí | |
| Descripcio | sí | tipología de figura / prioridad |
| Zona | sí | frecuentemente vacío |
| Cat_Runap | sí | frecuentemente vacío |
| NOM_APC | sí | puede vacío |
| CAT_APC | sí | puede vacío |
| Shape_Le_1 | sí | |
| Shape_Ar_1 | sí | |

Si un campo no está en esta lista, **no existía** en la inspección del export actual.

---

## 4. Modelo persistido (PostGIS)

### `geographic_layers`
Metadatos de la capa importada (nombre, checksum fuente, bbox, `raw_metadata`).

### `geographic_features`
Una fila por Placemark:

| Columna | Contenido |
|---------|-----------|
| `source_placemark_id` | id KML |
| `source_fid` | `properties_original.FID` si existe |
| `name` | `<name>` del Placemark |
| `properties_original` | JSONB con todos los atributos HTML |
| `geom` | `geometry(MultiPolygon, 4326)` |
| `geom_valid` / `validation_issues` | resultado de normalización |
| `bbox` | envelope |

### `geographic_import_errors`
Errores/avisos por feature/etapa (**sin descarte silencioso**).

---

## 5. Índices espaciales

- `geographic_features_geom_gix` — GiST(`geom`)
- `geographic_features_bbox_gix` — GiST(`bbox`)
- Funciones: `geo_features_at_point`, `geo_features_in_bbox`, `geo_point_has_coverage`

---

## 6. Capa INVEMAR — `invemar_zonificacion_atlantico`

| Campo lógico | Valor |
|--------------|-------|
| `code` | `invemar_zonificacion_atlantico` |
| Fuente | INVEMAR SIGMA MapServer `ZONIFICACION` / layer 0 |
| URL | https://gis.invemar.org.co/ArcGIS/rest/services/SIGMA/ZONIFICACION/MapServer/0 |
| Features | 196 |
| CRS | EPSG:4326 |
| Nota | Zonificación histórica de manglar Atlántico — **citar INVEMAR**; no sustituye prioridades C.R.A. |

### Atributos útiles observados (no inventados)

| Atributo | Uso operativo |
|----------|---------------|
| `COB_SPDOM` | Especie dominante (ej. `A. germinans`, `C. erectus`) |
| `COB_CMPSCI` | Composición de especies |
| `COB_ESTRCT` | Estructura / altura del bosque |
| `ZONIF` / `ZONIFICACI` | Categoría de manejo (Preservación, Recuperación…) |
| `LOCALIDAD` | Localidad (ej. Ciénaga Mallorquín) |
| `COB_INTRVN` | Nivel de intervención |
| `USOACTUAL` | Uso actual observado en el estudio |

Import: `pnpm geo:import-invemar-zonificacion` → `pnpm geo:load-supabase -- --processed-dir data/processed/invemar_zonificacion_atlantico`
