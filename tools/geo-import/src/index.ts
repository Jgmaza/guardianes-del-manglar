export { normalizeKml, readFeaturesNdjson } from './normalize';
export { queryBBoxInProcessedFeatures, queryPointInProcessedFeatures } from './local-query';
export {
  computeBBox,
  extractPolygonsAsMulti,
  iteratePlacemarks,
  parseHtmlAttributeTable,
} from './parse-kml';
export type {
  ImportErrorRecord,
  LayerManifest,
  NormalizedFeature,
  ValidationIssue,
} from './types';
export {
  DATA_INSPECTION,
  DATA_PROCESSED,
  DATA_RAW,
  KML_PATH,
  KMZ_PATH,
  KMZ_SHA_PATH,
  REPO_ROOT,
} from './paths';
