/**
 * MAP ABSTRACTION POINT
 *
 * The prototype renders a lightweight stylised SVG map of Türkiye so no paid
 * tile provider is needed. Everything the UI needs from a "map" lives here:
 *
 *  - VIEW_BOX / project() / unproject(): the projection contract
 *  - TURKEY_OUTLINE: the base geometry
 *
 * To swap in a real map (MapLibre, Mapbox, Google), replace
 * `src/components/map/TurkeyMap.tsx` with a provider-backed component that
 * still emits `onPick({ lat, lon })` and renders the same city markers.
 */

export const BOUNDS = {
  minLon: 25.5,
  maxLon: 45.2,
  minLat: 35.5,
  maxLat: 42.4,
};

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = Math.round(
  (VIEW_WIDTH * (BOUNDS.maxLat - BOUNDS.minLat)) / (BOUNDS.maxLon - BOUNDS.minLon) / 0.45,
);

/** lon/lat -> svg viewBox coordinates */
export function project({ lat, lon }: { lat: number; lon: number }) {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * VIEW_WIDTH;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEW_HEIGHT;
  return { x, y };
}

/** svg viewBox coordinates -> lon/lat */
export function unproject({ x, y }: { x: number; y: number }) {
  const lon = BOUNDS.minLon + (x / VIEW_WIDTH) * (BOUNDS.maxLon - BOUNDS.minLon);
  const lat = BOUNDS.maxLat - (y / VIEW_HEIGHT) * (BOUNDS.maxLat - BOUNDS.minLat);
  return { lat, lon };
}

/** Simplified national outline (lon, lat) — stylised, not survey grade. */
const OUTLINE_COORDS: Array<[number, number]> = [
  [26.35, 41.72],
  [27.55, 41.95],
  [28.05, 41.98],
  [28.98, 41.18],
  [29.95, 41.22],
  [31.4, 41.12],
  [33.3, 42.02],
  [35.0, 42.05],
  [36.2, 41.72],
  [37.3, 41.02],
  [38.4, 40.95],
  [39.5, 41.1],
  [41.0, 41.4],
  [41.55, 41.52],
  [42.8, 41.15],
  [43.45, 40.6],
  [44.8, 39.7],
  [44.4, 38.4],
  [44.0, 37.3],
  [42.4, 37.2],
  [41.2, 37.12],
  [39.2, 36.7],
  [37.1, 36.66],
  [36.65, 36.22],
  [36.2, 36.0],
  [35.9, 36.6],
  [35.5, 36.6],
  [34.6, 36.8],
  [33.6, 36.2],
  [32.0, 36.55],
  [30.6, 36.3],
  [29.6, 36.2],
  [28.2, 36.65],
  [27.4, 37.05],
  [27.2, 37.6],
  [26.4, 38.3],
  [26.75, 38.72],
  [26.1, 39.5],
  [26.2, 40.05],
  [26.05, 40.6],
  [26.35, 40.9],
  [26.3, 41.3],
];

function toPath(coords: Array<[number, number]>) {
  return (
    coords
      .map(([lon, lat], i) => {
        const { x, y } = project({ lat, lon });
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

export const TURKEY_OUTLINE = toPath(OUTLINE_COORDS);

/** Soft inland shading blobs (highland / interior hints) */
export const TERRAIN_BLOBS = [
  { lat: 39.4, lon: 33.4, rx: 150, ry: 70 },
  { lat: 39.6, lon: 40.6, rx: 130, ry: 62 },
  { lat: 37.6, lon: 30.6, rx: 95, ry: 48 },
  { lat: 38.2, lon: 37.4, rx: 110, ry: 52 },
];

export function isInsideTurkey({ lat, lon }: { lat: number; lon: number }) {
  const pt = project({ lat, lon });
  const pts = OUTLINE_COORDS.map(([lo, la]) => project({ lat: la, lon: lo }));
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!;
    const b = pts[j]!;
    if (
      a.y > pt.y !== b.y > pt.y &&
      pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
