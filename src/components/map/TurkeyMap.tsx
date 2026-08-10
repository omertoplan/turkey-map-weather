import { useCallback, useRef } from "react";
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

/**
 * MAP ABSTRACTION POINT — stylised vector map of Türkiye.
 * Contract: renders city chips + selection pin, emits onPick(lat/lon).
 * A MapLibre/Mapbox implementation can replace this file 1:1.
 */
export function TurkeyMap({ cities, selected, onPick }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scale = Math.max(VIEW_WIDTH / rect.width, VIEW_HEIGHT / rect.height);
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const x = (event.clientX - rect.left - cx) * scale + VIEW_WIDTH / 2;
      const y = (event.clientY - rect.top - cy) * scale + VIEW_HEIGHT / 2;
      onPick(unproject({ x, y }));
    },
    [onPick],
  );

  const pin = selected ? project(selected) : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full cursor-crosshair touch-manipulation select-none"
      onClick={handleClick}
      role="application"
      aria-label="Türkiye hava durumu haritası — bir noktaya dokunun"
    >
      <defs>
        <linearGradient id="seaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.955 0.03 226)" />
          <stop offset="100%" stopColor="oklch(0.93 0.035 224)" />
        </linearGradient>
        <linearGradient id="landFill" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="oklch(0.985 0.012 130)" />
          <stop offset="100%" stopColor="oklch(0.955 0.022 118)" />
        </linearGradient>
        <filter id="landShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="10"
            floodColor="oklch(0.45 0.06 250)"
            floodOpacity="0.14"
          />
        </filter>
      </defs>

      <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#seaFill)" />

      {/* subtle sea texture */}
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${40 + i * 90} Q 250 ${18 + i * 90} 500 ${40 + i * 90} T 1000 ${40 + i * 90}`}
          stroke="oklch(0.9 0.04 226)"
          strokeWidth="1.4"
          fill="none"
          opacity="0.5"
        />
      ))}

      <g filter="url(#landShadow)">
        <path
          d={TURKEY_OUTLINE}
          fill="url(#landFill)"
          stroke="var(--land-edge)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>

      <g clipPath="none" opacity="0.75">
        {TERRAIN_BLOBS.map((b, i) => {
          const { x, y } = project(b);
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx={b.rx}
              ry={b.ry}
              fill="var(--highland)"
              opacity="0.85"
            />
          );
        })}
      </g>

      {/* re-stroke border above shading */}
      <path
        d={TURKEY_OUTLINE}
        fill="none"
        stroke="var(--land-edge)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {selected && pin && (
        <g transform={`translate(${pin.x} ${pin.y})`} style={{ transformOrigin: "center" }}>
          <circle r="14" fill="var(--sky-deep)" opacity="0.25" className="pin-ring" />
          <circle r="9" fill="white" stroke="var(--sky-deep)" strokeWidth="3.5" />
          <circle r="3" fill="var(--sky-deep)" />
        </g>
      )}

      {cities.map((city) => {
        const { x, y } = project(city.coords);
        if (!isInsideTurkey(city.coords)) return null;
        const chipW = 128 + city.name.length * 8;
        return (
          <g
            key={city.id}
            transform={`translate(${x} ${y})`}
            onClick={(e) => {
              e.stopPropagation();
              onPick(city.coords);
            }}
            className="cursor-pointer"
          >
            <circle r="4" fill="var(--sky-deep)" opacity="0.45" />
            <foreignObject x={-chipW / 2} y={-64} width={chipW} height={54}>
              <div className="flex h-full items-center justify-center">
                <div className="chip-glass flex items-center gap-2 rounded-full px-3 py-2">
                  <WeatherIcon condition={city.condition} size={26} />
                  <span className="text-[1.35rem] font-bold leading-none text-foreground">
                    {city.temp}°
                  </span>
                  <span className="text-[1.1rem] font-medium leading-none text-muted-foreground">
                    {city.name}
                  </span>
                </div>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
