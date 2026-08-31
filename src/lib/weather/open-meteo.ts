import { describeCoords, PLACES } from "@/lib/map/places";
import { windDirLabel } from "./direction";
import type {
  CityWeather,
  Coords,
  WeatherCondition,
  WeatherProvider,
  WeatherSnapshot,
} from "./types";

/**
 * REAL PROVIDER — Open-Meteo (no API key required).
 * Implements `WeatherProvider`, so swapping in another vendor only means
 * writing a new file with the same shape.
 */

const BASE = "https://api.open-meteo.com/v1/forecast";

/** Open-Meteo serves up to 16 days; we request the 15-day horizon and render only real days. */
const REQUESTED_DAYS = 15;

/** WMO weather code -> app condition */
export function conditionFromCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "rain";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "shower";
  if (code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

function windDir(deg: number) {
  return windDirLabel(deg);
}

const round = (n: number | null | undefined, fallback = 0) =>
  typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);

function hhmm(iso: string | undefined) {
  if (!iso) return "--:--";
  return iso.slice(11, 16);
}


function dayLabel(iso: string, index: number) {
  if (index === 0) return "Bugün";
  if (index === 1) return "Yarın";
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(d);
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hava servisi yanıt vermedi (${res.status})`);
  return (await res.json()) as T;
}

interface ForecastResponse {
  current?: Record<string, number | string>;
  hourly?: Record<string, Array<number | string | null>>;
  daily?: Record<string, Array<number | string | null>>;
}

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "surface_pressure",
].join(",");

export const openMeteoProvider: WeatherProvider = {
  id: "open-meteo",

  async getSnapshot(coords: Coords): Promise<WeatherSnapshot> {
    const url =
      `${BASE}?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lon.toFixed(4)}` +
      `&current=${CURRENT_FIELDS}` +
      `&hourly=temperature_2m,weather_code,precipitation_probability,visibility,wind_speed_10m,wind_direction_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max,wind_direction_10m_dominant` +
      `&timezone=auto&forecast_days=${REQUESTED_DAYS}`;

    const data = await getJson<ForecastResponse>(url);
    const c = data.current ?? {};
    const h = data.hourly ?? {};
    const d = data.daily ?? {};

    const times = (h["time"] ?? []) as string[];
    const nowIso = String(c["time"] ?? "");
    let start = times.findIndex((t) => t >= nowIso.slice(0, 13));
    if (start < 0) start = 0;

    const hourly = times.slice(start, start + 24).map((t, i) => {
      const idx = start + i;
      return {
        time: hhmm(t),
        temp: round(h["temperature_2m"]?.[idx] as number),
        condition: conditionFromCode(round(h["weather_code"]?.[idx] as number)),
        precipitationProbability: round(h["precipitation_probability"]?.[idx] as number),
        windSpeed: round(h["wind_speed_10m"]?.[idx] as number),
        windDirection: windDir(round(h["wind_direction_10m"]?.[idx] as number)),
      };
    });

    const dates = (d["time"] ?? []) as string[];
    const daily = dates
      .map((date, i) => ({
        date,
        label: dayLabel(date, i),
        real: isNum(d["temperature_2m_max"]?.[i]) && isNum(d["temperature_2m_min"]?.[i]),
        min: round(d["temperature_2m_min"]?.[i] as number),
        max: round(d["temperature_2m_max"]?.[i] as number),
        condition: conditionFromCode(round(d["weather_code"]?.[i] as number)),
        precipitationProbability: round(d["precipitation_probability_max"]?.[i] as number),
        windSpeedMax: round(d["wind_speed_10m_max"]?.[i] as number),
        windDirection: windDir(round(d["wind_direction_10m_dominant"]?.[i] as number)),
      }))
      // keep only days the provider really returned values for — no padding
      .filter((e) => e.real)
      .map(({ real: _real, ...e }) => e);


    const visibilityM = h["visibility"]?.[start] as number | undefined;

    return {
      location: { ...describeCoords(coords), coords },
      current: {
        temp: round(c["temperature_2m"] as number),
        feelsLike: round(c["apparent_temperature"] as number),
        condition: conditionFromCode(round(c["weather_code"] as number)),
        precipitationProbability: round(c["precipitation_probability"] as number),
        windSpeed: round(c["wind_speed_10m"] as number),
        windDirection: windDir(round(c["wind_direction_10m"] as number)),
        humidity: round(c["relative_humidity_2m"] as number),
        uvIndex: round(d["uv_index_max"]?.[0] as number),
        pressure: round(c["surface_pressure"] as number),
        visibility: typeof visibilityM === "number" ? Math.round(visibilityM / 1000) : 0,
        sunrise: hhmm(d["sunrise"]?.[0] as string),
        sunset: hhmm(d["sunset"]?.[0] as string),
      },
      hourly,
      daily,
    };
  },

  async getCityOverview(): Promise<CityWeather[]> {
    const cities = PLACES.filter((p) => p.priority <= 2);
    const url =
      `${BASE}?latitude=${cities.map((c) => c.coords.lat).join(",")}` +
      `&longitude=${cities.map((c) => c.coords.lon).join(",")}` +
      `&current=temperature_2m,weather_code&timezone=auto`;

    const raw = await getJson<ForecastResponse | ForecastResponse[]>(url);
    const list = Array.isArray(raw) ? raw : [raw];

    return cities.map((city, i) => {
      const cur = list[i]?.current ?? {};
      return {
        id: city.id,
        name: city.name,
        coords: city.coords,
        temp: round(cur["temperature_2m"] as number),
        condition: conditionFromCode(round(cur["weather_code"] as number)),
        priority: city.priority,
      };
    });
  },

  async searchPlaces(query: string) {
    const { searchPlaces } = await import("@/lib/map/places");
    return searchPlaces(query).map((p) => ({ name: p.name, region: p.region, coords: p.coords }));
  },
};
