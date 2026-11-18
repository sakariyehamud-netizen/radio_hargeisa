import React from "react";
import { Heart, Bookmark } from "lucide-react";
import { useLibrary } from "./useLibrary";
import { cn } from "../../lib/utils";

export function FollowButton({
  targetType,
  targetId,
  title,
  subtitle,
  imageUrl,
  className,
}: {
  targetType: "PROGRAM" | "PRESENTER";
  targetId: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  className?: string;
}) {
  const { isFollowing, toggleFollow } = useLibrary();
  const active = isFollowing(targetType, targetId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollow({
          target_type: targetType,
          target_id: targetId,
          title,
          subtitle,
          image_url: imageUrl,
        });
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
        active
          ? "border-[#047422] bg-[#E7F5EA] text-[#047422]"
          : "border-[#E7E9EC] bg-white text-[#050505] hover:bg-[#F5F6F7]",
        className
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", active && "fill-current")} />
      <span>{active ? "Following" : "Follow"}</span>
    </button>
  );
}

export function FavoriteButton({
  itemType,
  itemId,
  title,
  subtitle,
  imageUrl,
  href,
  className,
}: {
  itemType: "PROGRAM" | "EPISODE" | "VIDEO" | "NEWS" | "PRESENTER";
  itemId: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const active = isFavorite(itemType, itemId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite({
          item_type: itemType,
          item_id: itemId,
          title,
          subtitle,
          image_url: imageUrl,
          href,
        });
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
        active
          ? "border-[#047422] bg-[#E7F5EA] text-[#047422]"
          : "border-[#E7E9EC] bg-white text-[#050505] hover:bg-[#F5F6F7]",
        className
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", active && "fill-current")} />
      <span>{active ? "Saved" : "Save"}</span>
    </button>
  );
}
