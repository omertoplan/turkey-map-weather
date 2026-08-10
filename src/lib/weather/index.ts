import { openMeteoProvider } from "./open-meteo";
import type { Coords, WeatherProvider } from "./types";

/**
 * SERVICE ABSTRACTION POINT
 * Swap the return value here for another provider implementation and the
 * whole UI keeps working unchanged.
 */
export function getWeatherProvider(): WeatherProvider {
  return openMeteoProvider;
}

export const weatherQueries = {
  cities: () => ({
    queryKey: ["weather", "cities"] as const,
    queryFn: () => getWeatherProvider().getCityOverview(),
    staleTime: 10 * 60_000,
    retry: 1,
  }),
  point: (coords: Coords) => ({
    queryKey: ["weather", "point", coords.lat.toFixed(3), coords.lon.toFixed(3)] as const,
    queryFn: () => getWeatherProvider().getSnapshot(coords),
    staleTime: 10 * 60_000,
    retry: 1,
  }),
};

export * from "./types";
