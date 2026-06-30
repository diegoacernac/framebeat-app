"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  seasons: { season_number: number; name: string }[];
  selected: number;
};

export function SeasonPicker({ seasons, selected }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectSeason(seasonNumber: number) {
    const params = new URLSearchParams(searchParams);
    params.set("season", String(seasonNumber));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
      {seasons.map((s) => (
        <button
          key={s.season_number}
          type="button"
          onClick={() => selectSeason(s.season_number)}
          className={cn(
            "shrink-0 border px-3 py-1 text-sm transition-colors",
            selected === s.season_number
              ? "border-amber-500 bg-amber-500/10 text-amber-500"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
