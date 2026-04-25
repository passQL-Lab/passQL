import { memo } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  readonly level: number;
}

export const StarRating = memo(function StarRating({ level }: StarRatingProps) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < level ? "fill-[var(--color-sem-warning)] text-[var(--color-sem-warning)]" : "text-border"}
        />
      ))}
    </span>
  );
});
