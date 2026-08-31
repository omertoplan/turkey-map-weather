import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SheetTab {
  key: string;
  label: string;
}

interface Props {
  title?: string | undefined;
  subtitle?: string | undefined;
  /** small icon shown next to the title (defaults to a map pin) */
  icon?: ReactNode;
  loading: boolean;
  error?: boolean | undefined;
  errorText: string;
  ready: boolean;
  /** resets expand/tab state when this changes */
  resetKey: string;
  tabs: SheetTab[];
  onClose: () => void;
  /** compact (collapsed) body */
  compact: (helpers: { expand: () => void }) => ReactNode;
  /** sticky summary above the tab bar in expanded mode */
  summary: ReactNode;
  /** scrollable expanded content for the active tab */
  content: (activeTab: string) => ReactNode;
}

/**
 * Shared bottom-sheet shell (layout + single-finger drag/tap gestures).
 * Used by both the land weather sheet and the marine sheet so the two share
 * one interaction model and one visual language.
 */
export function SheetShell({
  title,
  subtitle,
  icon,
  loading,
  error,
  errorText,
  ready,
  resetKey,
  tabs,
  onClose,
  compact,
  summary,
  content,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<string>(tabs[0]?.key ?? "now");
  const startY = useRef<number | null>(null);
  const lastY = useRef(0);

  useEffect(() => {
    setExpanded(false);
    setTab(tabs[0]?.key ?? "now");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!tabs.some((t) => t.key === tab)) setTab(tabs[0]?.key ?? "now");
  }, [tabs, tab]);

  const TAP_MAX = 12;
  const SWIPE_MIN = 32;

  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest("button, a, input, [role='tablist'], [data-no-drag]");

  const begin = (target: EventTarget | null, y: number) => {
    if (isInteractive(target)) {
      startY.current = null;
      return;
    }
    startY.current = y;
    lastY.current = y;
  };

  const move = (y: number) => {
    if (startY.current === null) return;
    lastY.current = y;
  };

  const finish = () => {
    if (startY.current === null) return;
    const dy = lastY.current - startY.current;
    startY.current = null;
    if (Math.abs(dy) <= TAP_MAX) {
      setExpanded((v) => !v);
    } else if (Math.abs(dy) >= SWIPE_MIN) {
      setExpanded(dy < 0);
    }
  };

  const dragProps = {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) {
        startY.current = null;
        return;
      }
      begin(e.target, e.touches[0]!.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      move(e.touches[0]!.clientY);
    },
    onTouchEnd: finish,
    onTouchCancel: finish,
    onMouseDown: (e: React.MouseEvent) => begin(e.target, e.clientY),
    onMouseMove: (e: React.MouseEvent) => move(e.clientY),
    onMouseUp: finish,
    onMouseLeave: () => {
      startY.current = null;
    },
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
      <div className="shrink-0 cursor-grab touch-manipulation px-5 pt-2.5" {...dragProps}>
        <div className="mx-auto h-1.5 w-11 rounded-full bg-border" />
        <div className="mt-3 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-primary">
              {icon ?? <MapPin className="size-4 shrink-0" strokeWidth={2.4} />}
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
            {errorText}
          </p>
        </div>
      ) : loading || !ready ? (
        <div className="space-y-3 px-5 pb-8 pt-4">
          <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
        </div>
      ) : expanded ? (
        <>
          <div className="shrink-0 touch-manipulation px-5 pt-4" {...dragProps}>
            {summary}
            <div
              role="tablist"
              className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto rounded-full bg-secondary p-1"
            >
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
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
            {content(tab)}
          </div>
        </>
      ) : (
        <div
          className="touch-pan-y space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
          {...dragProps}
        >
          {compact({ expand: () => setExpanded(true) })}
        </div>
      )}
    </div>
  );
}
