import { describeCoords, PLACES, searchPlaces } from "@/lib/map/places";
import type {
  CityWeather,
  Coords,
  DailyEntry,
  HourlyEntry,
  WeatherCondition,
  WeatherProvider,
  WeatherSnapshot,
} from "./types";

/** Deterministic pseudo-random generator so a point always looks the same. */
function seeded(lat: number, lon: number, salt = 0) {
  let h = Math.imul(Math.round(lat * 97), 374761393);
  h = (h + Math.imul(Math.round(lon * 89), 668265263)) | 0;
  h = (h + Math.imul(salt + 1, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const CONDITIONS: WeatherCondition[] = [
  "clear",
  "clear",
  "partly-cloudy",
  "partly-cloudy",
  "cloudy",
  "rain",
  "shower",
  "thunder",
  "fog",
  "wind",
];

const WIND_DIRS = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"];

/** Rough climate model: warmer south, cooler east / high altitude. */
function baseTemp(coords: Coords, salt = 0) {
  const south = (42.4 - coords.lat) * 2.6;
  const east = (coords.lon - 26) * -0.45;
  const noise = seeded(coords.lat, coords.lon, salt) * 6 - 3;
  return 16 + south + east + noise;
}

function pickCondition(coords: Coords, salt: number, temp: number): WeatherCondition {
  const r = seeded(coords.lat, coords.lon, 400 + salt);
  const c = CONDITIONS[Math.floor(r * CONDITIONS.length)]!;
  if (temp < 1 && (c === "rain" || c === "shower")) return "snow";
  return c;
}

function precipFor(condition: WeatherCondition, r: number) {
  switch (condition) {
    case "thunder":
      return 65 + Math.round(r * 30);
    case "rain":
      return 55 + Math.round(r * 35);
    case "shower":
      return 45 + Math.round(r * 30);
    case "snow":
      return 50 + Math.round(r * 40);
    case "cloudy":
      return 15 + Math.round(r * 25);
    case "fog":
      return 10 + Math.round(r * 20);
    case "partly-cloudy":
      return Math.round(r * 20);
    default:
      return Math.round(r * 10);
  }
}

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function buildHourly(coords: Coords): HourlyEntry[] {
  const now = new Date();
  const base = baseTemp(coords);
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() + i * 3600_000);
    const hour = d.getHours();
    const diurnal = Math.sin(((hour - 9) / 24) * Math.PI * 2) * 4.5;
    const temp = Math.round(base + diurnal + (seeded(coords.lat, coords.lon, i + 11) * 2 - 1));
    const condition = pickCondition(coords, i % 6, temp);
    return {
      time: `${String(hour).padStart(2, "0")}:00`,
      temp,
      condition,
      precipitationProbability: precipFor(condition, seeded(coords.lat, coords.lon, i + 77)),
    };
  });
}

function buildDaily(coords: Coords): DailyEntry[] {
  const today = new Date();
  const base = baseTemp(coords);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86400_000);
    const drift = seeded(coords.lat, coords.lon, i + 201) * 6 - 3;
    const max = Math.round(base + 4 + drift);
    const min = Math.round(base - 6 + drift * 0.6);
    const condition = pickCondition(coords, i + 3, max);
    return {
      date: d.toISOString().slice(0, 10),
      label: i === 0 ? "Bugün" : i === 1 ? "Yarın" : DAY_LABELS[d.getDay()]!,
      min,
      max,
      condition,
      precipitationProbability: precipFor(condition, seeded(coords.lat, coords.lon, i + 311)),
    };
  });
}

export const mockWeatherProvider: WeatherProvider = {
  id: "mock",

  async getSnapshot(coords: Coords): Promise<WeatherSnapshot> {
    const { name, region } = describeCoords(coords);
    const temp = Math.round(baseTemp(coords));
    const condition = pickCondition(coords, 0, temp);
    const r = seeded(coords.lat, coords.lon, 900);
    const windSpeed = Math.round(4 + r * 28);
    return {
      location: { name, region, coords },
      current: {
        temp,
        feelsLike: temp + Math.round(seeded(coords.lat, coords.lon, 55) * 5 - 3),
        condition,
        precipitationProbability: precipFor(condition, r),
        windSpeed,
        windDirection: WIND_DIRS[Math.floor(seeded(coords.lat, coords.lon, 61) * 8)]!,
        humidity: 35 + Math.round(seeded(coords.lat, coords.lon, 71) * 55),
        uvIndex: Math.round(seeded(coords.lat, coords.lon, 81) * 9),
        pressure: 1004 + Math.round(seeded(coords.lat, coords.lon, 91) * 20),
        visibility: 6 + Math.round(seeded(coords.lat, coords.lon, 101) * 14),
        sunrise: "06:24",
        sunset: "19:48",
      },
      hourly: buildHourly(coords),
      daily: buildDaily(coords),
    };
  },

  async getCityOverview(): Promise<CityWeather[]> {
    return PLACES.filter((p) => p.priority <= 2).map((p) => {
      const temp = Math.round(baseTemp(p.coords));
      return {
        id: p.id,
        name: p.name,
        coords: p.coords,
        temp,
        condition: pickCondition(p.coords, 0, temp),
        priority: p.priority,
      };
    });
  },

  async searchPlaces(query: string) {
    return searchPlaces(query).map(({ name, region, coords }) => ({ name, region, coords }));
  },
};
