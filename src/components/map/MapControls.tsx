import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed, Search, X } from "lucide-react";
import { PLACES } from "@/lib/map/places";
import { labelFromGeoResult, searchGeoPlaces, type GeoResult } from "@/lib/map/geocode";
import type { Coords } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

interface Props {
  onSelectPlace: (coords: Coords, label?: { name: string; region: string }) => void;
  onLocate: () => void;
  locating?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
}


const DEFAULTS: GeoResult[] = PLACES.filter((p) => p.priority === 1)
  .slice(0, 5)
  .map((p) => ({ id: p.id, name: p.name, subtitle: p.region, coords: p.coords }));

export function MapControls({ onSelectPlace, onLocate, locating, onSearchOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    onSearchOpenChange?.(open);
  }, [open, onSearchOpenChange]);


  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["geocode", debounced],
    queryFn: () => searchGeoPlaces(debounced),
    enabled: debounced.length >= 2,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const searching = debounced.length >= 2;
  const results: GeoResult[] = searching ? (searchQuery.data ?? []) : DEFAULTS;


  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto mx-auto flex max-w-md items-start gap-2">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "chip-glass flex items-center gap-2 rounded-2xl px-3 transition-all",
              open ? "h-12" : "h-12",
            )}
          >
            <Search className="size-[1.15rem] shrink-0 text-muted-foreground" strokeWidth={2.2} />
            <input
              ref={inputRef}
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              placeholder="Şehir ara"
              className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] font-medium text-foreground outline-none placeholder:text-muted-foreground/80"
              aria-label="Şehir ara"
            />
            {open && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  inputRef.current?.blur();
                }}
                className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Aramayı kapat"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {open && (
            <ul className="surface-card mt-2 overflow-hidden p-1">
              {searching && searchQuery.isPending && (
                <li className="px-3 py-3 text-sm text-muted-foreground">Aranıyor…</li>
              )}
              {searching && searchQuery.isError && (
                <li className="px-3 py-3 text-sm text-muted-foreground">
                  Arama yapılamadı. Bağlantını kontrol et.
                </li>
              )}
              {!searchQuery.isPending && !searchQuery.isError && results.length === 0 && (
                <li className="px-3 py-3 text-sm text-muted-foreground">Sonuç bulunamadı</li>
              )}
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPlace(p.coords, labelFromGeoResult(p));
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="truncate text-[0.95rem] font-semibold text-foreground">
                      {p.name}
                    </span>
                    <span className="shrink-0 truncate text-xs font-medium text-muted-foreground">
                      {p.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

        </div>

        <button
          type="button"
          onClick={onLocate}
          className="chip-glass grid size-12 shrink-0 place-items-center rounded-2xl text-primary transition-transform active:scale-95"
          aria-label="Konumumu bul"
        >
          <LocateFixed className={cn("size-[1.3rem]", locating && "animate-spin")} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
