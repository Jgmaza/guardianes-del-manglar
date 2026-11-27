import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo root = ManglarHack/apps */
export const REPO_ROOT = path.resolve(here, '../../..');

export const DATA_RAW = path.join(REPO_ROOT, 'data/raw');
export const DATA_PROCESSED = path.join(REPO_ROOT, 'data/processed');
export const DATA_INSPECTION = path.join(REPO_ROOT, 'data/inspection');

export const KMZ_PATH = path.join(DATA_RAW, 'prioridades-conservacion.kmz');
export const KMZ_SHA_PATH = path.join(DATA_RAW, 'prioridades-conservacion.kmz.sha256');
export const KML_PATH = path.join(DATA_RAW, 'kmz_extract/doc.kml');
