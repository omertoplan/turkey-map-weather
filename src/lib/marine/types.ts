/**
 * Marine (sea) domain types — deliberately separate from land weather types.
 * Every numeric field is nullable: Open-Meteo Marine returns `null` for
 * variables/points it cannot model, and the UI must show an honest
 * "unavailable" state instead of a fabricated number.
 */
import type { Coords } from "@/lib/weather/types";

export type Maybe = number | null;

export interface MarineCurrent {
  time: string;
  seaSurfaceTemperature: Maybe;
  waveHeight: Maybe;
  waveDirection: Maybe;
  wavePeriod: Maybe;
  windWaveHeight: Maybe;
  swellWaveHeight: Maybe;
  swellWavePeriod: Maybe;
  currentVelocity: Maybe;
  currentDirection: Maybe;
}

export interface MarineHourlyEntry {
  /** HH:mm */
  time: string;
  waveHeight: Maybe;
  wavePeriod: Maybe;
  waveDirection: Maybe;
  seaSurfaceTemperature: Maybe;
  currentVelocity: Maybe;
}

export interface MarineDailyEntry {
  /** ISO date */
  date: string;
  label: string;
  waveHeightMax: Maybe;
  wavePeriodMax: Maybe;
  waveDirection: Maybe;
  windWaveHeightMax: Maybe;
  swellWaveHeightMax: Maybe;
}

export interface MarineSnapshot {
  coords: Coords;
  /** true only when the provider actually returns wave data for this point */
  isSea: boolean;
  current: MarineCurrent;
  hourly: MarineHourlyEntry[];
  /** only days with real returned values — never padded */
  daily: MarineDailyEntry[];
}

export interface MarineProvider {
  readonly id: string;
  getSnapshot(coords: Coords): Promise<MarineSnapshot>;
}
