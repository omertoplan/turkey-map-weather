import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { TurkeyMap } from "@/components/map/TurkeyMap";
import { MapControls } from "@/components/map/MapControls";
import { WeatherSheet } from "@/components/weather/WeatherSheet";
import { isInsideTurkey } from "@/lib/map/turkey";
import { weatherQueries } from "@/lib/weather";
import type { Coords } from "@/lib/weather/types";

const TITLE = "Hava Haritası — En iyi hava durumu uygulaması";
const DESCRIPTION =
  "Türkiye haritasını aç, şehirlerin anlık sıcaklığını gör ve haritada herhangi bir noktaya dokunarak saatlik, günlük ve haftalık hava tahminine ulaş.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapWeatherHome,
});

function MapWeatherHome() {
  const [selected, setSelected] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: cities = [] } = useQuery(weatherQueries.cities());
  const pointQuery = useQuery({
    ...weatherQueries.point(selected ?? { lat: 0, lon: 0 }),
    enabled: selected !== null,
  });

  const pick = useCallback((coords: Coords) => {
    if (!isInsideTurkey(coords)) return;
    setSelected(coords);
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      pick({ lat: 41.01, lon: 28.98 });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        if (isInsideTurkey(coords)) setSelected(coords);
        else pick({ lat: 39.93, lon: 32.85 });
      },
      () => {
        setLocating(false);
        pick({ lat: 41.01, lon: 28.98 });
      },
      { timeout: 8000 },
    );
  }, [pick]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <h1 className="sr-only">Türkiye hava durumu haritası — En iyi hava durumu uygulaması</h1>

      <TurkeyMap cities={cities} selected={selected} onPick={pick} />

      <MapControls onSelectPlace={pick} onLocate={locate} locating={locating} />

      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 flex justify-center px-6">
          <p className="chip-glass rounded-full px-4 py-2.5 text-center text-[0.82rem] font-semibold text-muted-foreground">
            Haritada bir noktaya dokun → hava durumu
          </p>
        </div>
      )}

      {selected && (
        <WeatherSheet
          snapshot={pointQuery.data}
          loading={pointQuery.isPending}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}
