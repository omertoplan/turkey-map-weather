import { Droplets, Wind, Thermometer } from "lucide-react";
import { CONDITION_LABEL_TR, type WeatherSnapshot } from "@/lib/weather/types";
import { WeatherIcon } from "./WeatherIcon";

export function CurrentSummary({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { current } = snapshot;
  return (
    <div className="flex items-center gap-4">
      <WeatherIcon condition={current.condition} size={64} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold tracking-tight text-foreground">
            {current.temp}°
          </span>
          <span className="truncate text-sm font-semibold text-muted-foreground">
            {CONDITION_LABEL_TR[current.condition]}
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Hissedilen {current.feelsLike}° · Gün {snapshot.daily[0]?.max}° / {snapshot.daily[0]?.min}°
        </p>
      </div>
    </div>
  );
}

export function MetricRow({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { current } = snapshot;
  const items = [
    { icon: Droplets, label: "Yağış", value: `${current.precipitationProbability}%` },
    { icon: Wind, label: "Rüzgar", value: `${current.windSpeed} km/s ${current.windDirection}` },
    { icon: Thermometer, label: "Hissedilen", value: `${current.feelsLike}°` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-2xl bg-secondary/70 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="size-3.5" strokeWidth={2.2} />
            <span className="text-[0.68rem] font-semibold uppercase tracking-wide">{label}</span>
          </div>
          <p className="mt-1 truncate text-[0.9rem] font-bold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function NowDetail({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { current } = snapshot;
  const stats = [
    { label: "Nem", value: `${current.humidity}%` },
    { label: "UV indeksi", value: `${current.uvIndex}` },
    { label: "Basınç", value: `${current.pressure} hPa` },
    { label: "Görüş", value: `${current.visibility} km` },
    { label: "Gün doğumu", value: current.sunrise },
    { label: "Gün batımı", value: current.sunset },
  ];
  return (
    <div className="space-y-3">
      <MetricRow snapshot={snapshot} />
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-2xl border border-border/70 px-3.5 py-2.5"
          >
            <span className="text-[0.8rem] font-medium text-muted-foreground">{s.label}</span>
            <span className="text-[0.9rem] font-bold text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HourlyList({ snapshot }: { snapshot: WeatherSnapshot }) {
  return (
    <div className="divide-y divide-border/70">
      {snapshot.hourly.map((h, i) => (
        <div key={`${h.time}-${i}`} className="flex items-center gap-3 py-2.5">
          <span className="w-12 text-[0.85rem] font-bold text-foreground">
            {i === 0 ? "Şimdi" : h.time}
          </span>
          <WeatherIcon condition={h.condition} size={28} />
          <span className="flex-1 text-[0.78rem] font-medium text-muted-foreground">
            {CONDITION_LABEL_TR[h.condition]}
          </span>
          <span className="flex w-14 items-center justify-end gap-1 text-[0.78rem] font-semibold text-rain">
            <Droplets className="size-3.5" strokeWidth={2.4} />
            {h.precipitationProbability}%
          </span>
          <span className="w-10 text-right text-[1rem] font-bold text-foreground">{h.temp}°</span>
        </div>
      ))}
    </div>
  );
}

export function DailyList({ snapshot, days }: { snapshot: WeatherSnapshot; days: number }) {
  const list = snapshot.daily.slice(0, days);
  const min = Math.min(...list.map((d) => d.min));
  const max = Math.max(...list.map((d) => d.max));
  const span = Math.max(max - min, 1);

  return (
    <div className="divide-y divide-border/70">
      {list.map((d) => {
        const left = ((d.min - min) / span) * 100;
        const width = ((d.max - d.min) / span) * 100;
        return (
          <div key={d.date} className="flex items-center gap-3 py-3">
            <span className="w-20 truncate text-[0.85rem] font-bold text-foreground">{d.label}</span>
            <WeatherIcon condition={d.condition} size={28} />
            <span className="flex w-12 items-center gap-1 text-[0.75rem] font-semibold text-rain">
              <Droplets className="size-3" strokeWidth={2.4} />
              {d.precipitationProbability}%
            </span>
            <span className="w-8 text-right text-[0.9rem] font-semibold text-muted-foreground">
              {d.min}°
            </span>
            <div className="relative h-1.5 flex-1 rounded-full bg-secondary">
              <div
                className="absolute h-1.5 rounded-full"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 8)}%`,
                  background: "var(--gradient-accent)",
                }}
              />
            </div>
            <span className="w-8 text-right text-[0.9rem] font-bold text-foreground">{d.max}°</span>
          </div>
        );
      })}
    </div>
  );
}
