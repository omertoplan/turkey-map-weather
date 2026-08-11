import type { Coords } from "@/lib/weather/types";

/**
 * GEOCODING ABSTRACTION POINT
 * Open-Meteo Geocoding API (no API key). Returns Turkish places including
 * districts (ilçe), towns and localities.
 */

export interface GeoResult {
  id: string;
  name: string;
  /** province / district subtitle */
  subtitle: string;
  coords: Coords;
}

interface RawResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  population?: number;
  feature_code?: string;
}

function normalize(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

function subtitleOf(r: RawResult): string {
  const admin2 = r.admin2?.replace(/\s*İlçesi$/i, "").trim();
  const parts = [admin2 && admin2 !== r.name ? admin2 : undefined, r.admin1].filter(
    (p): p is string => Boolean(p) && p !== r.name,
  );
  const uniq = parts.filter((p, i) => parts.indexOf(p) === i);
  if (uniq.length === 0) return r.country ?? "Türkiye";
  return uniq.join(" · ");
}

export interface PlaceLabel {
  name: string;
  region: string;
}

/** Search result → human label used by the weather sheet. */
export function labelFromGeoResult(r: GeoResult): PlaceLabel {
  return { name: r.name, region: r.subtitle };
}

interface ReverseResponse {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
  localityInfo?: {
    administrative?: Array<{ name?: string; description?: string; adminLevel?: number }>;
    informative?: Array<{ name?: string; description?: string; order?: number }>;
  };
}

/**
 * REVERSE GEOCODING ABSTRACTION POINT
 * BigDataCloud reverse-geocode-client (keyless). Returns the most local
 * Turkish place name plus a clean administrative subtitle.
 */
export async function reverseGeocode(coords: Coords): Promise<PlaceLabel | null> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${coords.lat.toFixed(5)}&longitude=${coords.lon.toFixed(5)}&localityLanguage=tr`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as ReverseResponse;

  const admins = (data.localityInfo?.administrative ?? [])
    .filter((a) => Boolean(a.name))
    .sort((a, b) => (a.adminLevel ?? 0) - (b.adminLevel ?? 0));

  const province = admins.find((a) => a.adminLevel === 4)?.name ?? data.principalSubdivision;
  const district = admins.find((a) => a.adminLevel === 5)?.name;
  const locality =
    data.locality ||
    admins.find((a) => (a.adminLevel ?? 0) >= 6)?.name ||
    (data.localityInfo?.informative ?? []).find((i) => i.name)?.name ||
    data.city;

  const clean = (s?: string) =>
    s?.replace(/\s*(İlçesi|Merkez İlçe|İli|Province|District)$/i, "").trim() || undefined;

  const name = clean(locality) ?? clean(district) ?? clean(province);
  if (!name) return null;

  const parts = [clean(district), clean(province)].filter(
    (p): p is string => Boolean(p) && p !== name,
  );
  const uniq = parts.filter((p, i) => parts.indexOf(p) === i);

  return { name, region: uniq.length ? uniq.join(" · ") : (data.countryName ?? "Türkiye") };
}

export async function searchGeoPlaces(query: string, limit = 8): Promise<GeoResult[]> {

  const q = query.trim();
  if (q.length < 2) return [];

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}` +
    `&count=20&language=tr&format=json&countryCode=TR`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Arama servisi yanıt vermedi (${res.status})`);
  const data = (await res.json()) as { results?: RawResult[] };
  const raw = data.results ?? [];
  const nq = normalize(q);

  return raw
    .map((r) => ({
      r,
      score:
        (normalize(r.name) === nq ? 0 : normalize(r.name).startsWith(nq) ? 1 : 2) * 1_000_000_000 -
        (r.population ?? 0),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ r }) => ({
      id: String(r.id),
      name: r.name,
      subtitle: subtitleOf(r),
      coords: { lat: r.latitude, lon: r.longitude },
    }));
}
