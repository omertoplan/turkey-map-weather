import type { Coords } from "@/lib/weather/types";

export interface Place {
  id: string;
  name: string;
  region: string;
  coords: Coords;
  /** 1 = always visible label, 2 = secondary, 3 = search only */
  priority: number;
}

/** Static gazetteer for the prototype — replace with a geocoding service later. */
export const PLACES: Place[] = [
  { id: "istanbul", name: "İstanbul", region: "Marmara", coords: { lat: 41.01, lon: 28.98 }, priority: 1 },
  { id: "ankara", name: "Ankara", region: "İç Anadolu", coords: { lat: 39.93, lon: 32.85 }, priority: 1 },
  { id: "izmir", name: "İzmir", region: "Ege", coords: { lat: 38.42, lon: 27.14 }, priority: 1 },
  { id: "antalya", name: "Antalya", region: "Akdeniz", coords: { lat: 36.89, lon: 30.71 }, priority: 1 },
  { id: "adana", name: "Adana", region: "Akdeniz", coords: { lat: 37.0, lon: 35.32 }, priority: 1 },
  { id: "trabzon", name: "Trabzon", region: "Karadeniz", coords: { lat: 41.0, lon: 39.72 }, priority: 1 },
  { id: "erzurum", name: "Erzurum", region: "Doğu Anadolu", coords: { lat: 39.9, lon: 41.27 }, priority: 1 },
  { id: "diyarbakir", name: "Diyarbakır", region: "Güneydoğu", coords: { lat: 37.91, lon: 40.23 }, priority: 1 },
  { id: "konya", name: "Konya", region: "İç Anadolu", coords: { lat: 37.87, lon: 32.48 }, priority: 2 },
  { id: "samsun", name: "Samsun", region: "Karadeniz", coords: { lat: 41.29, lon: 36.33 }, priority: 2 },
  { id: "van", name: "Van", region: "Doğu Anadolu", coords: { lat: 38.49, lon: 43.38 }, priority: 2 },
  { id: "bursa", name: "Bursa", region: "Marmara", coords: { lat: 40.19, lon: 29.06 }, priority: 3 },
  { id: "gaziantep", name: "Gaziantep", region: "Güneydoğu", coords: { lat: 37.07, lon: 37.38 }, priority: 3 },
  { id: "mugla", name: "Muğla", region: "Ege", coords: { lat: 37.22, lon: 28.36 }, priority: 3 },
  { id: "kayseri", name: "Kayseri", region: "İç Anadolu", coords: { lat: 38.73, lon: 35.49 }, priority: 3 },
  { id: "eskisehir", name: "Eskişehir", region: "İç Anadolu", coords: { lat: 39.78, lon: 30.52 }, priority: 3 },
  { id: "canakkale", name: "Çanakkale", region: "Marmara", coords: { lat: 40.15, lon: 26.41 }, priority: 3 },
  { id: "rize", name: "Rize", region: "Karadeniz", coords: { lat: 41.02, lon: 40.52 }, priority: 3 },
  { id: "mersin", name: "Mersin", region: "Akdeniz", coords: { lat: 36.8, lon: 34.63 }, priority: 3 },
  { id: "sanliurfa", name: "Şanlıurfa", region: "Güneydoğu", coords: { lat: 37.16, lon: 38.79 }, priority: 3 },
];

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

export function searchPlaces(query: string, limit = 6): Place[] {
  const q = normalize(query);
  if (!q) return [];
  return PLACES.filter((p) => normalize(p.name).startsWith(q))
    .concat(PLACES.filter((p) => normalize(p.name).includes(q) && !normalize(p.name).startsWith(q)))
    .slice(0, limit);
}

function distanceKm(a: Coords, b: Coords) {
  const dLat = (a.lat - b.lat) * 111;
  const dLon = (a.lon - b.lon) * 111 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/** Naive reverse geocode — swap for a real geocoder later. */
export function describeCoords(coords: Coords): { name: string; region: string } {
  let nearest = PLACES[0]!;
  let best = Infinity;
  for (const p of PLACES) {
    const d = distanceKm(coords, p.coords);
    if (d < best) {
      best = d;
      nearest = p;
    }
  }
  if (best < 22) return { name: nearest.name, region: nearest.region };
  return {
    name: `${nearest.name} civarı`,
    region: `${nearest.region} · ${Math.round(best)} km`,
  };
}
