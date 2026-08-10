import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { CityWeather, Coords } from "@/lib/weather/types";

const MapCanvas = lazy(() => import("./MapCanvas"));

interface Props {
  cities: CityWeather[];
  selected: Coords | null;
  focus: { coords: Coords; zoom?: number } | null;
  onPick: (coords: Coords) => void;
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-secondary">
      <p className="text-sm font-semibold text-muted-foreground">Harita yükleniyor…</p>
    </div>
  );
}

/** SSR-safe boundary: Leaflet touches window at import time. */
export function WeatherMap(props: Props) {
  return (
    <div className="absolute inset-0">
      <ClientOnly fallback={<MapSkeleton />}>
        <Suspense fallback={<MapSkeleton />}>
          <MapCanvas {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
