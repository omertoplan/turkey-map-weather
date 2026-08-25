import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { WeatherMap } from "@/components/map/WeatherMap";
import { MapControls } from "@/components/map/MapControls";
import { WeatherSheet } from "@/components/weather/WeatherSheet";
import { weatherQueries } from "@/lib/weather";
import { reverseGeocode, type PlaceLabel } from "@/lib/map/geocode";
import type { Coords } from "@/lib/weather/types";

/** Shared main screen — rendered by both the web route and the mobile (Capacitor) entry. */
export function WeatherHome() {
  const [selected, setSelected] = useState<Coords | null>(null);
  const [pickedLabel, setPickedLabel] = useState<PlaceLabel | null>(null);
  const [focus, setFocus] = useState<{ coords: Coords; zoom?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);


  const citiesQuery = useQuery(weatherQueries.cities());
  const pointQuery = useQuery({
    ...weatherQueries.point(selected ?? { lat: 0, lon: 0 }),
    enabled: selected !== null,
  });

  // reverse geocode only when we don't already have a label from search
  const reverseQuery = useQuery({
    queryKey: ["reverse-geocode", selected?.lat.toFixed(4) ?? "", selected?.lon.toFixed(4) ?? ""],
    queryFn: () => reverseGeocode(selected!),
    enabled: selected !== null && pickedLabel === null,
    staleTime: 30 * 60_000,
    retry: 1,
  });

  const label = pickedLabel ?? reverseQuery.data ?? null;

  const pick = useCallback((coords: Coords, nextLabel?: PlaceLabel) => {
    setNotice(null);
    setPickedLabel(nextLabel ?? null);
    setSelected(coords);
  }, []);

  const pickAndFocus = useCallback(
    (coords: Coords, nextLabel?: PlaceLabel) => {
      pick(coords, nextLabel);
      setFocus({ coords, zoom: 9 });
    },
    [pick],
  );

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNotice("Bu cihazda konum servisi kullanılamıyor.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        pickAndFocus({ lat: pos.coords.latitude, lon: pos.coords.longitude }, undefined);
      },
      () => {
        setLocating(false);
        setNotice("Konum izni verilmedi. Haritadan bir nokta seçebilirsin.");
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, [pickAndFocus]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <h1 className="sr-only">Türkiye hava durumu haritası — En iyi hava durumu uygulaması</h1>

      <WeatherMap
        cities={citiesQuery.data ?? []}
        selected={selected}
        focus={focus}
        onPick={pick}
      />

      <MapControls
        onSelectPlace={pickAndFocus}
        onLocate={locate}
        locating={locating}
        onSearchOpenChange={setSearchOpen}
      />


      {(notice || citiesQuery.isError) && (
        <div className="pointer-events-none absolute inset-x-0 top-[4.75rem] z-30 flex justify-center px-6">
          <p className="chip-glass rounded-full px-4 py-2 text-center text-[0.78rem] font-semibold text-foreground">
            {notice ?? "Şehir verileri alınamadı. Bağlantını kontrol et."}
          </p>
        </div>
      )}

      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 flex justify-center px-6">
          <p className="chip-glass rounded-full px-4 py-2.5 text-center text-[0.82rem] font-semibold text-muted-foreground">
            {citiesQuery.isPending
              ? "Hava verileri yükleniyor…"
              : "Haritada bir noktaya dokun → hava durumu"}
          </p>
        </div>
      )}

      {selected && (
        <WeatherSheet
          snapshot={pointQuery.data}
          label={label}
          loading={pointQuery.isPending}
          error={pointQuery.isError}
          onClose={() => {
            setSelected(null);
            setPickedLabel(null);
          }}
        />
      )}
    </main>
  );
}
