import { CurrentSummary, DailyList, HourlyList, MetricRow, NowDetail } from "./ForecastViews";
import { SheetShell, type SheetTab } from "./SheetShell";
import type { WeatherSnapshot } from "@/lib/weather/types";

interface Props {
  snapshot: WeatherSnapshot | undefined;
  /** resolved human-readable label (search result or reverse geocode) */
  label?: { name: string; region: string } | null;
  loading: boolean;
  error?: boolean;
  onClose: () => void;
}

export function WeatherSheet({ snapshot, label, loading, error, onClose }: Props) {
  const title = label?.name ?? snapshot?.location.name;
  const subtitle = label?.region ?? snapshot?.location.region;

  // Long-range label reflects the days Open-Meteo actually returned.
  const days = snapshot?.daily.length ?? 0;
  const tabs: SheetTab[] = [
    { key: "now", label: "Şimdi" },
    { key: "hourly", label: "Saatlik" },
    ...(days > 0 ? [{ key: "range", label: `${days} Günlük` }] : []),
  ];

  return (
    <SheetShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      errorText="Hava verisi alınamadı. İnternet bağlantını kontrol edip tekrar dene."
      ready={!!snapshot}
      resetKey={`${snapshot?.location.coords.lat ?? ""},${snapshot?.location.coords.lon ?? ""}`}
      tabs={tabs}
      onClose={onClose}
      summary={snapshot ? <CurrentSummary snapshot={snapshot} /> : null}
      compact={({ expand }) =>
        snapshot ? (
          <>
            <CurrentSummary snapshot={snapshot} />
            <MetricRow snapshot={snapshot} />
            <button
              type="button"
              onClick={expand}
              className="w-full rounded-2xl bg-primary/10 py-2.5 text-[0.82rem] font-bold text-primary transition-colors hover:bg-primary/15"
            >
              Detaylı tahmin için yukarı kaydır
            </button>
          </>
        ) : null
      }
      content={(tab) => {
        if (!snapshot) return null;
        if (tab === "now") return <NowDetail snapshot={snapshot} />;
        if (tab === "hourly") return <HourlyList snapshot={snapshot} />;
        return <DailyList snapshot={snapshot} />;
      }}
    />
  );
}
