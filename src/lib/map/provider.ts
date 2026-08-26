/**
 * MAP PROVIDER ABSTRACTION POINT
 * Only this file knows which tile vendor is used. Swap the values here for
 * Mapbox / MapTiler / your own tile server without touching UI components.
 */
/** Publishable CARTO Basemaps key (client-side by design, safe to ship). */
const CARTO_API_KEY = "cb1_28m2_1_ed26b642df7204aa8b3e0341";

export const MAP_PROVIDER = {
  id: "carto-voyager",
  /** Keyed CARTO raster Voyager basemap — no "API KEY REQUIRED" watermark. */
  tileUrl: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
  subdomains: [] as string[],
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 20,
} as const;

/** Türkiye bounds: [[southLat, westLon], [northLat, eastLon]] */
export const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [35.7, 25.5],
  [42.3, 45.0],
];

export const TURKEY_CENTER: [number, number] = [39.0, 35.3];
export const TURKEY_ZOOM = 5.4;
