# data/processed — salidas del pipeline de importación

| Ruta | Origen |
|------|--------|
| `data/processed/` (raíz) | C.R.A. prioridades — `pnpm geo:normalize` |
| `data/processed/invemar_zonificacion_atlantico/` | INVEMAR zonificación — `pnpm geo:import-invemar-zonificacion` |

| Artefacto | Descripción |
|-----------|-------------|
| `layer_manifest.json` | Metadatos de capa + conteos |
| `features.ndjson` | Features normalizados (1 JSON por línea) |
| `import_errors.ndjson` | Errores/avisos sin descarte silencioso |
| `spatial_index.ndjson` | id + bbox para consultas locales de verificación |

Estos archivos son **derivados** (`derived`), no reemplazan el raw.
