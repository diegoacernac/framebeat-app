import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRatings";

type Review = {
  id: string;
  stars: number;
  review: string | null;
  createdAt: Date;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay reseñas.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <article key={r.id} className="flex gap-3 border-b pb-4">
          <Avatar>
            {r.avatarUrl && <AvatarImage src={r.avatarUrl} />}
            <AvatarFallback>{r.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href={`/u/${r.username}`} className="text-sm font-medium hover:underline">
                @{r.username}
              </Link>
              <StarRating value={r.stars} readOnly />
            </div>
            {r.review && <p className="text-sm">{r.review}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}