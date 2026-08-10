import { mockWeatherProvider } from "./mock-provider";
import type { Coords, WeatherProvider } from "./types";

/**
 * SERVICE ABSTRACTION POINT
 * Swap the return value here for a real provider implementation
 * (e.g. `openMeteoProvider`) and the whole UI keeps working unchanged.
 */
export function getWeatherProvider(): WeatherProvider {
  return mockWeatherProvider;
}

export const weatherQueries = {
  cities: () => ({
    queryKey: ["weather", "cities"] as const,
    queryFn: () => getWeatherProvider().getCityOverview(),
    staleTime: 5 * 60_000,
  }),
  point: (coords: Coords) => ({
    queryKey: ["weather", "point", coords.lat.toFixed(3), coords.lon.toFixed(3)] as const,
    queryFn: () => getWeatherProvider().getSnapshot(coords),
    staleTime: 5 * 60_000,
  }),
};

export * from "./types";
