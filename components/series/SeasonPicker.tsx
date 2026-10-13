"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { chipClass } from "@/components/ui/chip";

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
          aria-pressed={selected === s.season_number}
          className={chipClass(selected === s.season_number)}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
