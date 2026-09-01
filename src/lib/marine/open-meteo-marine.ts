import { windDirLabel } from "@/lib/weather/direction";
import type { Coords } from "@/lib/weather/types";
import type {
  Maybe,
  MarineCurrent,
  MarineDailyEntry,
  MarineHourlyEntry,
  MarineProvider,
  MarineSnapshot,
} from "./types";

/**
 * REAL PROVIDER — Open-Meteo Marine API (no API key required).
 * https://marine-api.open-meteo.com/v1/marine
 *
 * The API answers 200 for land coordinates too, but every marine variable is
 * `null` there — that is exactly how we detect "this tap was on the sea".
 */
const BASE = "https://marine-api.open-meteo.com/v1/marine";
/** Atmospheric wind comes from the SAME real forecast API the land panel uses. */
const WIND_BASE = "https://api.open-meteo.com/v1/forecast";

/** We ask for 16 days and keep only the days that come back with real values. */
const REQUESTED_DAYS = 16;

const CURRENT_FIELDS = [
  "wave_height",
  "wave_direction",
  "wave_period",
  "sea_surface_temperature",
  "ocean_current_velocity",
  "ocean_current_direction",
  "wind_wave_height",
  "swell_wave_height",
  "swell_wave_period",
].join(",");

const HOURLY_FIELDS = [
  "wave_height",
  "wave_direction",
  "wave_period",
  "sea_surface_temperature",
  "ocean_current_velocity",
].join(",");

const DAILY_FIELDS = [
  "wave_height_max",
  "wave_direction_dominant",
  "wave_period_max",
  "wind_wave_height_max",
  "swell_wave_height_max",
].join(",");

/** Real atmospheric wind, keyed by ISO timestamp / date. */
interface WindData {
  currentSpeed: Maybe;
  currentDirection: Maybe;
  hourly: Map<string, { speed: Maybe; direction: Maybe }>;
  daily: Map<string, { speedMax: Maybe; directionDominant: Maybe }>;
}

const EMPTY_WIND: WindData = {
  currentSpeed: null,
  currentDirection: null,
  hourly: new Map(),
  daily: new Map(),
};

interface MarineResponse {
  current?: Record<string, number | string | null>;
  hourly?: Record<string, Array<number | string | null>>;
  daily?: Record<string, Array<number | string | null>>;
}

/** Keeps null as null — never substitutes a fake 0. */
const num = (v: unknown): Maybe =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

function hhmm(iso: string | undefined) {
  return iso ? iso.slice(11, 16) : "--:--";
}

function dayLabel(iso: string, index: number) {
  if (index === 0) return "Bugün";
  if (index === 1) return "Yarın";
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

export function dirLabel(deg: Maybe): string | null {
  return deg === null ? null : windDirLabel(deg);
}

async function fetchWind(coords: Coords, days: number): Promise<WindData> {
  try {
    const url =
      `${WIND_BASE}?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lon.toFixed(4)}` +
      `&current=wind_speed_10m,wind_direction_10m` +
      `&hourly=wind_speed_10m,wind_direction_10m` +
      `&daily=wind_speed_10m_max,wind_direction_10m_dominant` +
      `&timezone=auto&forecast_days=${days}`;
    const res = await fetch(url);
    if (!res.ok) return EMPTY_WIND;
    const data = (await res.json()) as MarineResponse;
    const c = data.current ?? {};
    const h = data.hourly ?? {};
    const d = data.daily ?? {};

    const hourly = new Map<string, { speed: Maybe; direction: Maybe }>();
    ((h["time"] ?? []) as string[]).forEach((t, i) => {
      hourly.set(t.slice(0, 13), {
        speed: num(h["wind_speed_10m"]?.[i]),
        direction: num(h["wind_direction_10m"]?.[i]),
      });
    });

    const daily = new Map<string, { speedMax: Maybe; directionDominant: Maybe }>();
    ((d["time"] ?? []) as string[]).forEach((date, i) => {
      daily.set(date, {
        speedMax: num(d["wind_speed_10m_max"]?.[i]),
        directionDominant: num(d["wind_direction_10m_dominant"]?.[i]),
      });
    });

    return {
      currentSpeed: num(c["wind_speed_10m"]),
      currentDirection: num(c["wind_direction_10m"]),
      hourly,
      daily,
    };
  } catch {
    return EMPTY_WIND;
  }
}

export const openMeteoMarineProvider: MarineProvider = {
  id: "open-meteo-marine",

  async getSnapshot(coords: Coords): Promise<MarineSnapshot> {
    const url =
      `${BASE}?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lon.toFixed(4)}` +
      `&current=${CURRENT_FIELDS}` +
      `&hourly=${HOURLY_FIELDS}` +
      `&daily=${DAILY_FIELDS}` +
      `&timezone=auto&forecast_days=${REQUESTED_DAYS}`;

    const [res, wind] = await Promise.all([fetch(url), fetchWind(coords, REQUESTED_DAYS)]);
    if (!res.ok) throw new Error(`Deniz servisi yanıt vermedi (${res.status})`);
    const data = (await res.json()) as MarineResponse;

    const c = data.current ?? {};
    const h = data.hourly ?? {};
    const d = data.daily ?? {};

    const current: MarineCurrent = {
      time: hhmm(String(c["time"] ?? "")),
      seaSurfaceTemperature: num(c["sea_surface_temperature"]),
      waveHeight: num(c["wave_height"]),
      waveDirection: num(c["wave_direction"]),
      wavePeriod: num(c["wave_period"]),
      windWaveHeight: num(c["wind_wave_height"]),
      swellWaveHeight: num(c["swell_wave_height"]),
      swellWavePeriod: num(c["swell_wave_period"]),
      currentVelocity: num(c["ocean_current_velocity"]),
      currentDirection: num(c["ocean_current_direction"]),
      windSpeed: wind.currentSpeed,
      windDirection: wind.currentDirection,
    };

    const times = (h["time"] ?? []) as string[];
    const nowKey = String(c["time"] ?? "").slice(0, 13);
    let start = times.findIndex((t) => t >= nowKey);
    if (start < 0) start = 0;

    const hourly: MarineHourlyEntry[] = times
      .slice(start, start + 24)
      .map((t, i) => {
        const idx = start + i;
        return {
          time: hhmm(t),
          waveHeight: num(h["wave_height"]?.[idx]),
          wavePeriod: num(h["wave_period"]?.[idx]),
          waveDirection: num(h["wave_direction"]?.[idx]),
          seaSurfaceTemperature: num(h["sea_surface_temperature"]?.[idx]),
          currentVelocity: num(h["ocean_current_velocity"]?.[idx]),
          windSpeed: wind.hourly.get(t.slice(0, 13))?.speed ?? null,
          windDirection: wind.hourly.get(t.slice(0, 13))?.direction ?? null,
        };
      })
      // hours beyond the real marine horizon come back fully null → drop them
      .filter((e) => e.waveHeight !== null || e.seaSurfaceTemperature !== null);

    const dates = (d["time"] ?? []) as string[];
    const daily: MarineDailyEntry[] = dates
      .map((date, i) => ({
        date,
        label: dayLabel(date, i),
        waveHeightMax: num(d["wave_height_max"]?.[i]),
        wavePeriodMax: num(d["wave_period_max"]?.[i]),
        waveDirection: num(d["wave_direction_dominant"]?.[i]),
        windWaveHeightMax: num(d["wind_wave_height_max"]?.[i]),
        swellWaveHeightMax: num(d["swell_wave_height_max"]?.[i]),
        windSpeedMax: wind.daily.get(date)?.speedMax ?? null,
        windDirectionDominant: wind.daily.get(date)?.directionDominant ?? null,
      }))
      // only keep days the provider actually modelled
      .filter((e) => e.waveHeightMax !== null);

    const isSea =
      current.waveHeight !== null ||
      current.seaSurfaceTemperature !== null ||
      daily.length > 0;

    return { coords, isSea, current, hourly, daily };
  },
};
