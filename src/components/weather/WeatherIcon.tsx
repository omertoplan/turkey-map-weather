import type { WeatherCondition } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

interface Props {
  condition: WeatherCondition;
  className?: string;
  /** pixel size */
  size?: number;
}

/** Hand-rolled inline SVG icon set so the aesthetic stays consistent. */
export function WeatherIcon({ condition, className, size = 24 }: Props) {
  const sun = "var(--sun)";
  const cloud = "oklch(0.92 0.012 250)";
  const cloudDark = "oklch(0.84 0.02 250)";
  const rain = "var(--rain)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {condition === "clear" && (
        <>
          <circle cx="16" cy="16" r="6.5" fill={sun} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect
              key={a}
              x="15.2"
              y="2.4"
              width="1.6"
              height="3.6"
              rx="0.8"
              fill={sun}
              transform={`rotate(${a} 16 16)`}
            />
          ))}
        </>
      )}

      {condition === "partly-cloudy" && (
        <>
          <circle cx="12" cy="12" r="5" fill={sun} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect
              key={a}
              x="11.3"
              y="2.6"
              width="1.4"
              height="3"
              rx="0.7"
              fill={sun}
              transform={`rotate(${a} 12 12)`}
            />
          ))}
          <path
            d="M12 24h11a4.4 4.4 0 0 0 .5-8.8A6 6 0 0 0 12 16.6 3.7 3.7 0 0 0 12 24Z"
            fill={cloud}
          />
        </>
      )}

      {(condition === "cloudy" || condition === "fog" || condition === "wind") && (
        <path
          d="M9.5 23h13a5 5 0 0 0 .6-10A6.8 6.8 0 0 0 10 14.3 4.4 4.4 0 0 0 9.5 23Z"
          fill={condition === "cloudy" ? cloud : cloudDark}
        />
      )}

      {condition === "fog" && (
        <>
          <rect x="7" y="25.5" width="18" height="1.7" rx="0.85" fill={cloud} />
          <rect x="10" y="28.6" width="13" height="1.7" rx="0.85" fill={cloud} />
        </>
      )}

      {condition === "wind" && (
        <>
          <path
            d="M6 25.5h11.5a2.2 2.2 0 1 0-1.6-3.7"
            stroke={rain}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path d="M8 29.5h7" stroke={rain} strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}

      {(condition === "rain" || condition === "shower" || condition === "thunder") && (
        <path
          d="M9.5 19.5h13a5 5 0 0 0 .6-10A6.8 6.8 0 0 0 10 10.8 4.4 4.4 0 0 0 9.5 19.5Z"
          fill={condition === "thunder" ? cloudDark : cloud}
        />
      )}

      {condition === "rain" &&
        [11, 16, 21].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={22 + (i % 2)}
            width="1.8"
            height="6"
            rx="0.9"
            fill={rain}
            transform={`rotate(12 ${x} 24)`}
          />
        ))}

      {condition === "shower" &&
        [11, 15, 19, 23].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={22 + (i % 2) * 1.5}
            width="1.7"
            height="5"
            rx="0.85"
            fill={rain}
            transform={`rotate(14 ${x} 24)`}
          />
        ))}

      {condition === "thunder" && (
        <path d="M17 21l-5 6h3.4l-1.2 5 5.6-7h-3.5l1.6-4Z" fill={sun} />
      )}

      {condition === "snow" && (
        <>
          <path
            d="M9.5 19.5h13a5 5 0 0 0 .6-10A6.8 6.8 0 0 0 10 10.8 4.4 4.4 0 0 0 9.5 19.5Z"
            fill={cloud}
          />
          {[
            [12, 25],
            [16, 28],
            [20, 25],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`} stroke={rain} strokeWidth="1.4" strokeLinecap="round">
              <path d={`M${cx! - 2} ${cy}h4`} />
              <path d={`M${cx} ${cy! - 2}v4`} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
