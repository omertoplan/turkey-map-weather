import { Waves } from "lucide-react";
import {
  MarineDailyList,
  MarineHourlyList,
  MarineMetricRow,
  MarineNowDetail,
  MarineSummary,
} from "./MarineViews";
import { SheetShell, type SheetTab } from "./SheetShell";
import type { MarineSnapshot } from "@/lib/marine/types";

interface Props {
  snapshot: MarineSnapshot | undefined;
  label?: { name: string; region: string } | null;
  loading: boolean;
  error?: boolean | undefined;
  onClose: () => void;
}

/** Sea tap → marine panel. Same shell/gestures as the land weather sheet. */
export function MarineSheet({ snapshot, label, loading, error, onClose }: Props) {
  const coords = snapshot?.coords;
  const title = label?.name ?? "Deniz noktası";
  const subtitle =
    label?.region ??
    (coords ? `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)} · Deniz verisi` : undefined);

  // Marine horizon is whatever the API really returned — never hardcoded.
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
      icon={<Waves className="size-4 shrink-0" strokeWidth={2.4} />}
      loading={loading}
      error={error}
      errorText="Deniz verisi alınamadı. İnternet bağlantını kontrol edip tekrar dene."
      ready={!!snapshot}
      resetKey={`${coords?.lat ?? ""},${coords?.lon ?? ""}`}
      tabs={tabs}
      onClose={onClose}
      summary={snapshot ? <MarineSummary snapshot={snapshot} /> : null}
      compact={({ expand }) =>
        snapshot ? (
          <>
            <MarineSummary snapshot={snapshot} />
            <MarineMetricRow snapshot={snapshot} />
            <button
              type="button"
              onClick={expand}
              className="w-full rounded-2xl bg-primary/10 py-2.5 text-[0.82rem] font-bold text-primary transition-colors hover:bg-primary/15"
            >
              Detaylı deniz tahmini için yukarı kaydır
            </button>
          </>
        ) : null
      }
      content={(tab) => {
        if (!snapshot) return null;
        if (tab === "now") return <MarineNowDetail snapshot={snapshot} />;
        if (tab === "hourly") return <MarineHourlyList snapshot={snapshot} />;
        return <MarineDailyList snapshot={snapshot} />;
      }}
    />
  );
}
