import { useCallback, useEffect, useRef, useState } from "react";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import {
  TERRAIN_BLOBS,
  TURKEY_OUTLINE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  isInsideTurkey,
  project,
  unproject,
} from "@/lib/map/turkey";
import type { CityWeather, Coords } from "@/lib/weather/types";

interface Props {
  cities: CityWeather[];
  selected: Coords | null;
  onPick: (coords: Coords) => void;
}

interface Fit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Presentation-only label nudges so edge cities never clip or collide. */
const LABEL_ADJUST: Record<
  string,
  { anchor?: "left" | "center" | "right"; dx?: number; dy?: number }
> = {
  izmir: { anchor: "right", dx: -6 },
  istanbul: { dy: -6 },
  antalya: { anchor: "right", dx: -10, dy: 18 },
  adana: { dy: -4 },
  trabzon: { anchor: "left", dx: 10, dy: -4 },
  konya: { dy: 8 },
};



/**
 * MAP ABSTRACTION POINT — stylised vector map of Türkiye.
 * Contract: renders city chips + selection pin, emits onPick({ lat, lon }).
 * A MapLibre/Mapbox implementation can replace this file 1:1.
 */
export function TurkeyMap({ cities, selected, onPick }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const scale = Math.min(width / VIEW_WIDTH, height / VIEW_HEIGHT);
      setFit({
        scale,
        offsetX: (width - VIEW_WIDTH * scale) / 2,
        offsetY: (height - VIEW_HEIGHT * scale) / 2,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** lon/lat -> css pixels inside the container */
  const toPx = useCallback(
    (coords: Coords) => {
      const { x, y } = project(coords);
      if (!fit) return { left: 0, top: 0 };
      return { left: fit.offsetX + x * fit.scale, top: fit.offsetY + y * fit.scale };
    },
    [fit],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const el = boxRef.current;
      if (!el || !fit) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - fit.offsetX) / fit.scale;
      const y = (event.clientY - rect.top - fit.offsetY) / fit.scale;
      onPick(unproject({ x, y }));
    },
    [fit, onPick],
  );

  const pin = selected ? toPx(selected) : null;

  return (
    <div
      ref={boxRef}
      onClick={handleClick}
      className="absolute inset-x-0 bottom-[26%] top-[4%] touch-manipulation select-none"
      role="application"
      aria-label="Türkiye hava durumu haritası — bir noktaya dokunun"
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="landFill" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="oklch(0.985 0.014 128)" />
            <stop offset="100%" stopColor="oklch(0.95 0.026 118)" />
          </linearGradient>
          <filter id="landShadow" x="-15%" y="-25%" width="140%" height="170%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="12"
              floodColor="oklch(0.45 0.06 250)"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        {/* sea texture */}
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-20 ${20 + i * 78} Q 250 ${-2 + i * 78} 500 ${20 + i * 78} T 1020 ${20 + i * 78}`}
            stroke="oklch(0.91 0.035 226)"
            strokeWidth="1.6"
            fill="none"
            opacity="0.45"
          />
        ))}

        <g filter="url(#landShadow)">
          <path
            d={TURKEY_OUTLINE}
            fill="url(#landFill)"
            stroke="var(--land-edge)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </g>

        <clipPath id="landClip">
          <path d={TURKEY_OUTLINE} />
        </clipPath>
        <g clipPath="url(#landClip)">
          {TERRAIN_BLOBS.map((b, i) => {
            const { x, y } = project(b);
            return (
              <ellipse key={i} cx={x} cy={y} rx={b.rx} ry={b.ry} fill="var(--highland)" />
            );
          })}
        </g>

        <path
          d={TURKEY_OUTLINE}
          fill="none"
          stroke="var(--land-edge)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>

      {/* selection pin */}
      {pin && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: pin.left, top: pin.top }}
        >
          <span className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 pin-ring" />
          <span className="block size-4 rounded-full border-[3px] border-primary bg-card shadow-[var(--shadow-chip)]" />
        </div>
      )}

      {/* city labels as HTML so typography stays crisp at any zoom */}
      {fit &&
        cities
          .filter((c) => isInsideTurkey(c.coords))
          .map((city) => {
            const { left, top } = toPx(city.coords);
            const adj = LABEL_ADJUST[city.id] ?? {};
            const anchorX =
              adj.anchor === "right" ? "0%" : adj.anchor === "left" ? "-100%" : "-50%";
            return (
              <button
                key={city.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPick(city.coords);
                }}
                className="absolute transition-transform active:scale-95"
                style={{
                  left,
                  top,
                  transform: `translate(calc(${anchorX} + ${adj.dx ?? 0}px), calc(-50% + ${adj.dy ?? 0}px))`,
                }}
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
