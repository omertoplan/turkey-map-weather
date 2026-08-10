/**
 * MAP PROVIDER ABSTRACTION POINT
 * Only this file knows which tile vendor is used. Swap the values here for
 * Mapbox / MapTiler / your own tile server without touching UI components.
 */
export const MAP_PROVIDER = {
  id: "carto-positron",
  /** Pale, minimal OSM-derived basemap — free for development/testing. */
  tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  subdomains: ["a", "b", "c"],
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
} as const;

/** Türkiye bounds: [[southLat, westLon], [northLat, eastLon]] */
export const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [35.7, 25.5],
  [42.3, 45.0],
];

export const TURKEY_CENTER: [number, number] = [39.0, 35.3];
export const TURKEY_ZOOM = 5.4;
