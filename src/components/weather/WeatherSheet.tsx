import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, X } from "lucide-react";
import { CurrentSummary, DailyList, HourlyList, MetricRow, NowDetail } from "./ForecastViews";
import type { WeatherSnapshot } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

type TabKey = "now" | "hourly" | "daily" | "weekly";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "now", label: "Şimdi" },
  { key: "hourly", label: "Saatlik" },
  { key: "daily", label: "Günlük" },
  { key: "weekly", label: "Haftalık" },
];

interface Props {
  snapshot: WeatherSnapshot | undefined;
  /** resolved human-readable label (search result or reverse geocode) */
  label?: { name: string; region: string } | null;
  loading: boolean;
  error?: boolean;
  onClose: () => void;
}

export function WeatherSheet({ snapshot, label, loading, error, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<TabKey>("now");
  const dragStart = useRef<number | null>(null);

  const title = label?.name ?? snapshot?.location.name;
  const subtitle = label?.region ?? snapshot?.location.region;

  useEffect(() => {
    setExpanded(false);
    setTab("now");
  }, [snapshot?.location.coords.lat, snapshot?.location.coords.lon]);


  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const dy = e.clientY - dragStart.current;
    dragStart.current = null;
    if (dy < -32) setExpanded(true);
    else if (dy > 32) {
      if (expanded) setExpanded(false);
      else onClose();
    } else setExpanded((v) => !v);
  };

  return (
    <div
      className={cn(
        "sheet-shadow absolute inset-x-0 bottom-0 z-30 mx-auto flex max-w-md flex-col rounded-t-[1.75rem] bg-card transition-[height] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]",
        expanded ? "h-[86%]" : "h-auto",
      )}
      role="dialog"
      aria-label="Konum hava durumu"
    >
      {/* grabber / header */}
      <div
        className="shrink-0 cursor-grab touch-none px-5 pt-2.5"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="mx-auto h-1.5 w-11 rounded-full bg-border" />
        <div className="mt-3 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-primary">
              <MapPin className="size-4 shrink-0" strokeWidth={2.4} />
              <h2 className="truncate text-[1.05rem] font-extrabold tracking-tight text-foreground">
                {title ?? "Yükleniyor…"}
              </h2>
            </div>
            <p className="mt-0.5 truncate pl-[1.4rem] text-xs font-medium text-muted-foreground">
              {subtitle ?? "\u00a0"}
            </p>

          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="grid size-8 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent"
            aria-label={expanded ? "Küçült" : "Detaylı tahmin"}
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Kapat"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="px-5 pb-8 pt-4">
          <p className="rounded-2xl bg-secondary px-4 py-3 text-center text-[0.85rem] font-semibold text-muted-foreground">
            Hava verisi alınamadı. İnternet bağlantını kontrol edip tekrar dene.
          </p>
        </div>
      ) : loading || !snapshot ? (
        <div className="space-y-3 px-5 pb-8 pt-4">
          <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
        </div>
      ) : expanded ? (
        <>
          <div className="shrink-0 px-5 pt-4">
            <CurrentSummary snapshot={snapshot} />
            <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto rounded-full bg-secondary p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex-1 whitespace-nowrap rounded-full px-3 py-2 text-[0.82rem] font-bold transition-colors",
                    tab === t.key
                      ? "bg-card text-primary shadow-[var(--shadow-chip)]"
                      : "text-muted-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
            {tab === "now" && <NowDetail snapshot={snapshot} />}
            {tab === "hourly" && <HourlyList snapshot={snapshot} />}
            {tab === "daily" && <DailyList snapshot={snapshot} days={3} />}
            {tab === "weekly" && <DailyList snapshot={snapshot} days={7} />}
          </div>
        </>
      ) : (
        <div className="space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <CurrentSummary snapshot={snapshot} />
          <MetricRow snapshot={snapshot} />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full rounded-2xl bg-primary/10 py-2.5 text-[0.82rem] font-bold text-primary transition-colors hover:bg-primary/15"
          >
            Detaylı tahmin için yukarı kaydır
          </button>
        </div>
      )}
    </div>
  );
}
