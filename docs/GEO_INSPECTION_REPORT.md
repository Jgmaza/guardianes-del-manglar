# GEO_INSPECTION_REPORT — Prioridades de conservación (KMZ C.R.A.)

**Estado:** `IMPLEMENTED` (inspección)  
**Fecha de inspección:** 2026-11-27  
**Artefacto machine-readable:** `data/inspection/inspection_report.json`  
**Fuente preservada:** `data/raw/prioridades-conservacion.kmz`  
**SHA-256 KMZ:** `64300f127c811cf11c7718710cd7349878ce80e2fac03193abf5ebca48abe212`

> Este informe solo describe lo observado en el archivo. **No** se asume que los polígonos sean manglares individuales. **No** se inventan atributos, prioridades ni unidades hidrográficas.

---

## 1. Archivo identificado

| Ítem | Valor observado |
|------|-----------------|
| KMZ | `Prioridades de Conservación (1).kmz` → copiado como `data/raw/prioridades-conservacion.kmz` |
| Contenido KMZ | `doc.kml` (~96.3 MB) + XSL ArcGIS |
| Estándar | KML 2.2 (`http://www.opengis.net/kml/2.2`) + `gx` |
| CRS de coordenadas | WGS84 lon/lat (grados decimales con punto) |

---

## 2. Estructura

| Elemento | Observado |
|----------|-----------|
| Document `id` | `Prioridades_de_conservación` |
| Document `name` | `Prioridades de conservación` |
| Folders | 1 — `FeatureLayer0` / `Prioridades de conservación` |
| Descripción del Folder (texto del archivo) | Contiene la priorización de unidades hidrográficas inmersas dentro de las 4 subzonas hidrográficas presentes en el departamento del Atlántico. Igualmente presenta la información sobre los escenarios de conservación y las acciones de compensación para las áreas priorizadas dentro del departamento. |

**Conclusión de capa (según atributos + descripción del propio archivo):** capa de **priorización de unidades hidrográficas / escenarios y acciones de conservación-compensación** en el Atlántico — **no** un inventario etiquetado de manglares individuales.

---

## 3. Conteos geográficos

| Métrica | Cantidad |
|---------|----------|
| Placemarks | **14.732** |
| MultiGeometry | 14.732 |
| Polygon | 17.182 |
| LinearRing | 17.395 |
| Point / LineString | **0** |
| Vértices | **1.181.976** |
| `innerBoundaryIs` (huecos) | 213 |
| IDs de Placemark únicos | 14.732 (0 duplicados) |
| Placemarks sin coordenadas | **0** |
| Tokens de coordenada inválidos | **0** |
| Anillos con &lt; 4 vértices | **0** |

### Tipos de geometría por Placemark

| Tipo | Count |
|------|-------|
| `MultiGeometry` → uno o más `Polygon` | **14.732** (100 %) |

BBox observado (WGS84):

- lon `[ -75.24952656480643 , -74.7208824345115 ]`
- lat `[ 10.2587666904547 , 11.06300207947404 ]`

---

## 4. ExtendedData y propiedades de Placemark

### ExtendedData / Schema

| Tag | Count |
|-----|-------|
| ExtendedData | 0 |
| Schema / SimpleField | 0 |
| SchemaData / SimpleData | 0 |
| Data | 0 |

**Almacenamiento de atributos observado:** tablas HTML dentro de `<description><![CDATA[...]]></description>` (export estilo ArcGIS). No hay schema KML formal.

### Propiedades Placemark

- `id` (ej. `ID_00000` …): presente en todos; únicos.
- `name`: presente; valores dominantes observados: `Bajo Magdalena` (7561), `Caribe - Litoral` (7079), `Rio Magdalena` (92).
- `styleUrl`: `#PolyStyle011` (9295), `#PolyStyle00` (5437).
- `description`: HTML con pares campo/valor.

---

## 5. Atributos observados (31 campos)

Solo nombres presentes en el archivo:

`FID`, `FID_ACCION`, `ZH`, `NOMZH`, `SZH`, `NOMSZH`, `UH`, `NOMUH`, `Val_Priori`, `Escenarios`, `AccionGen`, `AccRegiona`, `AccRegDesc`, `area`, `Shape_Leng`, `FID_ESCENA`, `OBJECTID_1`, `ESC_I`, `DESC_I`, `ESC_III`, `DESC_III`, `ESC_INT`, `AREA_HA`, `Escenari_1`, `Descripcio`, `Zona`, `Cat_Runap`, `NOM_APC`, `CAT_APC`, `Shape_Le_1`, `Shape_Ar_1`

### Identificadores / códigos originales observados

| Campo | Únicos (aprox.) | Ejemplos observados |
|-------|-----------------|---------------------|
| Placemark `id` | 14732 | `ID_00000` |
| `FID` | 14732 | `0`, `1`, … |
| `FID_ACCION` | 6242 | `2`, … |
| `ZH` / `NOMZH` | 3 | `1`/`Rio Magdalena`, `12`/`Caribe - Litoral`, `29`/`Bajo Magdalena` |
| `SZH` / `NOMSZH` | 5 | p.ej. `Arroyos Directos al Caribe`, `Cienaga Mallorquin`, … |
| `UH` / `NOMUH` | ~100 / ~97 | códigos y nombres de unidad hidrográfica del archivo |
| `OBJECTID_1` | 10264 | — |
| `FID_ESCENA` | 10264 | — |

### Valores observados de agrupación frecuente

- `Val_Priori`: `Alto`, `Medio`, `Bajo` (valores del archivo)
- `Escenarios`: `Escenario I`, `II`, `III`
- `AccionGen`: `Preservación`, `Restauración`, `Recuperación`, `Rehabilitación`

> Estos valores se documentan porque **aparecen en el KML**. No se reinterpretan como taxonomía inventada por el equipo.

---

## 6. Validez / discrepancias

| Hallazgo | Detalle |
|----------|---------|
| Geometrías vacías | 0 placemarks sin coordenadas |
| Coords fuera de rango WGS84 | 0 tokens inválidos detectados en inspección |
| Atributos no ExtendedData | Hay que parsear HTML; riesgo de fragilidad si cambia el export |
| Números en atributos | Coma decimal (`297,008277`) en tablas HTML |
| Huecos | 213 inner rings — deben preservarse en normalización |
| MultiGeometry | Todos los placemarks; un feature puede mapear a MultiPolygon |
| No es capa de manglar etiquetada | La palabra “Manglar” casi no aparece como tipología de feature |

---

## 7. Agrupaciones candidatas (campos del archivo)

Útiles para filtros posteriores **sin alterar el raw**:

1. `NOMZH` / `ZH`
2. `NOMSZH` / `SZH`
3. `NOMUH` / `UH`
4. `Val_Priori`
5. `Escenarios` / `ESC_INT`
6. `AccionGen`
7. `Descripcio`

---

## 8. Implicaciones para el pipeline

1. Conservar KMZ original + checksum.
2. Extraer placemarks con `source_placemark_id` + **todos** los atributos HTML como JSONB (`properties_original`).
3. Normalizar geometría a `MultiPolygon` EPSG:4326 (Polygon único → MultiPolygon de un elemento).
4. Registrar errores de importación en log dedicado (no descartar en silencio).
5. PostGIS: `geography`/`geometry(MultiPolygon, 4326)` + índice GIST.
6. No etiquetar features como “manglar” salvo que un atributo del archivo lo diga explícitamente.

---

## 9. Script de reproducción

```bash
python3 tools/geo-import/scripts/inspect_kml.py
```

Salida: `data/inspection/inspection_report.json`
