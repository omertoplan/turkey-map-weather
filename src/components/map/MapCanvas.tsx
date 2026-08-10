import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import { MAP_PROVIDER, TURKEY_BOUNDS, TURKEY_CENTER } from "@/lib/map/provider";
import type { CityWeather, Coords } from "@/lib/weather/types";

interface Props {
  cities: CityWeather[];
  selected: Coords | null;
  focus: { coords: Coords; zoom?: number } | null;
  onPick: (coords: Coords) => void;
}

const pinIcon = L.divIcon({
  className: "",
  html: `<span class="block size-4 rounded-full border-[3px] border-primary bg-card shadow-[var(--shadow-chip)]"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function ClickHandler({ onPick }: { onPick: (coords: Coords) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lon: e.latlng.lng }),
  });
  return null;
}

/** Fit all of Türkiye on first render, whatever the viewport aspect. */
function InitialFit() {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(TURKEY_BOUNDS, { padding: [16, 16], animate: false });
    };
    fit();
    const raf = requestAnimationFrame(fit);
    const t = window.setTimeout(fit, 250);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [map]);
  return null;
}

function Flyer({ focus }: { focus: Props["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.coords.lat, focus.coords.lon], focus.zoom ?? Math.max(map.getZoom(), 9), {
      duration: 0.8,
    });
  }, [focus, map]);
  return null;
}

/** City chips rendered as HTML overlay so React icons + typography stay crisp. */
function CityChips({ cities, onPick }: { cities: CityWeather[]; onPick: (c: Coords) => void }) {
  const map = useMap();
  const [, tick] = useState(0);
  const bump = () => tick((t) => t + 1);
  useMapEvents({ move: bump, zoom: bump, resize: bump, viewreset: bump });
  const zoom = map.getZoom();

  const visible = useMemo(
    () => cities.filter((c) => (zoom >= 6 ? true : c.priority === 1)),
    [cities, zoom],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[500]">
      {visible.map((city) => {
        const p = map.latLngToContainerPoint([city.coords.lat, city.coords.lon]);
        const { x: w, y: h } = map.getSize();
        // drop chips that are off-screen, gently nudge the ones hugging an edge
        if (p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) return null;
        const left = Math.min(Math.max(p.x, 62), Math.max(w - 62, 62));
        return (
          <button
            key={city.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPick(city.coords);
            }}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95"
            style={{ left, top: p.y }}
          >
            <span className="chip-glass flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5">
              <WeatherIcon condition={city.condition} size={20} />
              <span className="text-[0.8rem] font-extrabold leading-none text-foreground">
                {city.temp}°
              </span>
              <span className="text-[0.72rem] font-semibold leading-none text-muted-foreground">
                {city.name}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Real interactive Leaflet map. Browser-only: loaded lazily behind <ClientOnly>.
 */
export default function MapCanvas({ cities, selected, focus, onPick }: Props) {
  return (
    <MapContainer
      center={TURKEY_CENTER}
      zoom={6}
      minZoom={4}
      maxZoom={MAP_PROVIDER.maxZoom}
      zoomControl={false}
      zoomSnap={0.1}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={90}
      attributionControl
      className="absolute inset-0 h-full w-full bg-secondary"
    >
      <TileLayer
        url={MAP_PROVIDER.tileUrl}
        subdomains={[...MAP_PROVIDER.subdomains]}
        attribution={MAP_PROVIDER.attribution}
        maxZoom={MAP_PROVIDER.maxZoom}
        detectRetina
      />
      <InitialFit />
      <ClickHandler onPick={onPick} />
      <Flyer focus={focus} />
      {selected && <Marker position={[selected.lat, selected.lon]} icon={pinIcon} />}
      <CityChips cities={cities} onPick={onPick} />
    </MapContainer>
  );
}
