import Link from "next/link";
import Image from "next/image";

type Props = {
  id: number;
  title: string;
  year?: string;
  posterUrl?: string | null;
};

export function MediaCard({ id, title, year, posterUrl }: Props) {
  return (
    <Link href={`/movies/${id}`} className="group block space-y-2">
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition group-hover-scale-105"
            sizes="150px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sin poster
          </div>
        )}
      </div>

      <div>
        <p className="line-clamp-2 text-sm font-medium">{title}</p>
        {year && <p className="text-xs text-muted-foreground">{year}</p>}
      </div>
    </Link>
  );
}