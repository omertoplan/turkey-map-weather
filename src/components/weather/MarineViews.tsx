import { Compass, Navigation, Thermometer, Waves } from "lucide-react";
import { windDirLabel } from "@/lib/weather/direction";
import type { Maybe, MarineSnapshot } from "@/lib/marine/types";

const NA = "—";

function fmt(v: Maybe, unit: string, digits = 1) {
  return v === null ? NA : `${v.toFixed(digits)} ${unit}`;
}
function dir(v: Maybe) {
  return v === null ? NA : `${windDirLabel(v)} (${Math.round(v)}°)`;
}

export function MarineSummary({ snapshot }: { snapshot: MarineSnapshot }) {
  const { current } = snapshot;
  return (
    <div className="flex items-center gap-4">
      <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
        <Waves className="size-9" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold tracking-tight text-foreground">
            {current.waveHeight === null ? NA : `${current.waveHeight.toFixed(1)}m`}
          </span>
          <span className="truncate text-sm font-semibold text-muted-foreground">Dalga</span>
        </div>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {current.seaSurfaceTemperature === null
            ? "Deniz suyu sıcaklığı yok"
            : `Deniz suyu ${current.seaSurfaceTemperature.toFixed(1)}°`}
          {" · "}
          {current.wavePeriod === null ? "Periyot yok" : `Periyot ${current.wavePeriod.toFixed(1)} s`}
        </p>
      </div>
    </div>
  );
}

export function MarineMetricRow({ snapshot }: { snapshot: MarineSnapshot }) {
  const { current } = snapshot;
  const items = [
    { icon: Waves, label: "Dalga", value: fmt(current.waveHeight, "m") },
    { icon: Compass, label: "Yön", value: current.waveDirection === null ? NA : windDirLabel(current.waveDirection) },
    { icon: Thermometer, label: "Su", value: current.seaSurfaceTemperature === null ? NA : `${current.seaSurfaceTemperature.toFixed(1)}°` },
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

export function MarineNowDetail({ snapshot }: { snapshot: MarineSnapshot }) {
  const c = snapshot.current;
  const stats = [
    { label: "Deniz suyu sıcaklığı", value: c.seaSurfaceTemperature === null ? NA : `${c.seaSurfaceTemperature.toFixed(1)} °C` },
    { label: "Belirgin dalga yük.", value: fmt(c.waveHeight, "m") },
    { label: "Dalga yönü", value: dir(c.waveDirection) },
    { label: "Dalga periyodu", value: fmt(c.wavePeriod, "s") },
    { label: "Rüzgar dalgası", value: fmt(c.windWaveHeight, "m") },
    { label: "Ölü dalga (swell)", value: fmt(c.swellWaveHeight, "m") },
    { label: "Swell periyodu", value: fmt(c.swellWavePeriod, "s") },
    { label: "Akıntı hızı", value: fmt(c.currentVelocity, "km/sa") },
    { label: "Akıntı yönü", value: dir(c.currentDirection) },
  ];
  return (
    <div className="space-y-3">
      <MarineMetricRow snapshot={snapshot} />
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 px-3.5 py-2.5"
          >
            <span className="text-[0.78rem] font-medium text-muted-foreground">{s.label}</span>
            <span className="shrink-0 text-[0.85rem] font-bold text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarineHourlyList({ snapshot }: { snapshot: MarineSnapshot }) {
  if (snapshot.hourly.length === 0) {
    return <EmptyNote text="Bu nokta için saatlik deniz verisi bulunmuyor." />;
  }
  return (
    <div className="divide-y divide-border/70">
      {snapshot.hourly.map((h, i) => (
        <div key={`${h.time}-${i}`} className="flex items-center gap-2.5 py-2.5">
          <span className="w-12 shrink-0 text-[0.85rem] font-bold text-foreground">
            {i === 0 ? "Şimdi" : h.time}
          </span>
          <Waves className="size-6 shrink-0 text-primary" strokeWidth={2.2} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.78rem] font-semibold text-foreground">
              {fmt(h.waveHeight, "m")}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[0.72rem] font-semibold text-muted-foreground">
              <Navigation className="size-3 shrink-0" strokeWidth={2.4} />
              {h.waveDirection === null ? NA : windDirLabel(h.waveDirection)}
              {" · "}
              {fmt(h.wavePeriod, "s")}
            </p>
          </div>
          <span className="w-16 shrink-0 text-right text-[0.75rem] font-semibold text-muted-foreground">
            {h.currentVelocity === null ? NA : `${h.currentVelocity.toFixed(1)} km/sa`}
          </span>
          <span className="w-12 shrink-0 text-right text-[0.95rem] font-bold text-foreground">
            {h.seaSurfaceTemperature === null ? NA : `${h.seaSurfaceTemperature.toFixed(0)}°`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MarineDailyList({ snapshot }: { snapshot: MarineSnapshot }) {
  const list = snapshot.daily;
  if (list.length === 0) {
    return <EmptyNote text="Bu nokta için günlük deniz verisi bulunmuyor." />;
  }
  const first = list[0]!.date;
  const last = list[list.length - 1]!.date;
  return (
    <div>
      <p className="pb-2 text-[0.7rem] font-semibold text-muted-foreground">
        Gerçek veri aralığı: {first} → {last} ({list.length} gün)
      </p>
      <div className="divide-y divide-border/70">
        {list.map((d) => (
          <div key={d.date} className="flex items-center gap-2.5 py-3">
            <div className="w-[5.5rem] shrink-0">
              <p className="truncate text-[0.85rem] font-bold text-foreground">{d.label}</p>
              <p className="mt-0.5 truncate text-[0.7rem] font-semibold text-muted-foreground">
                {d.date.slice(5)}
              </p>
            </div>
            <Waves className="size-6 shrink-0 text-primary" strokeWidth={2.2} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.85rem] font-bold text-foreground">
                {fmt(d.waveHeightMax, "m")}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[0.7rem] font-semibold text-muted-foreground">
                <Navigation className="size-3 shrink-0" strokeWidth={2.4} />
                {d.waveDirection === null ? NA : windDirLabel(d.waveDirection)}
                {" · "}
                {fmt(d.wavePeriodMax, "s")}
              </p>
            </div>
            <span className="w-20 shrink-0 text-right text-[0.72rem] font-semibold text-muted-foreground">
              Swell {fmt(d.swellWaveHeightMax, "m")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-secondary px-4 py-3 text-center text-[0.82rem] font-semibold text-muted-foreground">
      {text}
    </p>
  );
}
