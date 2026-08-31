import type { Coords } from "@/lib/weather/types";
import { openMeteoMarineProvider } from "./open-meteo-marine";
import type { MarineProvider } from "./types";

/** SERVICE ABSTRACTION POINT — swap the marine vendor here only. */
export function getMarineProvider(): MarineProvider {
  return openMeteoMarineProvider;
}

export const marineQueries = {
  point: (coords: Coords) => ({
    queryKey: ["marine", "point", coords.lat.toFixed(3), coords.lon.toFixed(3)] as const,
    queryFn: () => getMarineProvider().getSnapshot(coords),
    staleTime: 10 * 60_000,
    retry: 1,
  }),
};

export * from "./types";
