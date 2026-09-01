import { MAP_PROVIDER } from "./provider";
import type { Coords } from "@/lib/weather/types";

/**
 * LAND / WATER DETECTION
 *
 * The Open-Meteo Marine API snaps land coordinates to the nearest ocean grid
 * cell, so "marine API returned data" can NOT be used to classify land vs sea.
 *
 * Instead we read the actual basemap raster pixel under the tapped coordinate:
 * CARTO Voyager paints water with a single flat colour (#d5e8eb), so the
 * classification matches the coastline the user literally sees on the map.
 * No extra/paid API, works offline-free with the tiles we already load.
 */

/** Flat water fill of the CARTO Voyager raster basemap. */
const WATER_RGB = [213, 232, 235] as const;
const TOLERANCE = 12;
/** Sampled square is (2*RADIUS+1)² pixels around the tap. */
const RADIUS = 4;
/** Share of water pixels required to call the point water. */
const WATER_RATIO = 0.6;
/** Zoom used for sampling: high enough for a sharp coastline, low enough to cache well. */
const SAMPLE_ZOOM = 13;

const cache = new Map<string, boolean>();

function tileUrl(z: number, x: number, y: number) {
  return MAP_PROVIDER.tileUrl
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y))
    .replace("{s}", MAP_PROVIDER.subdomains[0] ?? "a");
}

function project(coords: Coords, z: number) {
  const n = 2 ** z;
  const latRad = (coords.lat * Math.PI) / 180;
  const x = ((coords.lon + 180) / 360) * n;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function loadTile(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("tile load failed"));
    img.src = url;
  });
}

/**
 * True when the exact tapped coordinate sits on rendered water.
 * Fails closed (returns false → land) so we never show a marine panel on land.
 */
export async function isWaterAt(coords: Coords): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const key = `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  try {
    const { x, y } = project(coords, SAMPLE_ZOOM);
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    const img = await loadTile(tileUrl(SAMPLE_ZOOM, tx, ty));

    const size = img.naturalWidth || 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    const px = Math.min(size - 1, Math.max(0, Math.floor((x - tx) * size)));
    const py = Math.min(size - 1, Math.max(0, Math.floor((y - ty) * size)));
    const r = Math.round((RADIUS * size) / 256);
    const x0 = Math.max(0, px - r);
    const y0 = Math.max(0, py - r);
    const w = Math.min(size - x0, r * 2 + 1);
    const h = Math.min(size - y0, r * 2 + 1);
    const { data } = ctx.getImageData(x0, y0, w, h);

    let water = 0;
    const total = w * h;
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i]! - WATER_RGB[0]) <= TOLERANCE &&
        Math.abs(data[i + 1]! - WATER_RGB[1]) <= TOLERANCE &&
        Math.abs(data[i + 2]! - WATER_RGB[2]) <= TOLERANCE
      ) {
        water++;
      }
    }

    const result = total > 0 && water / total >= WATER_RATIO;
    cache.set(key, result);
    return result;
  } catch {
    return false;
  }
}

export const waterQueries = {
  at: (coords: Coords) => ({
    queryKey: ["water", coords.lat.toFixed(4), coords.lon.toFixed(4)] as const,
    queryFn: () => isWaterAt(coords),
    staleTime: Infinity,
    retry: 0,
  }),
};
