import React from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Radio } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatDuration } from "../../lib/format";
import { usePlayer } from "./PlayerProvider";

export function RowHeader({
  title,
  seeAllTo,
  className,
}: {
  title: string;
  seeAllTo?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 pt-6 pb-3",
        className
      )}
    >
      <h2 className="text-[15px] font-extrabold tracking-tight text-[#050505]">
        {title}
      </h2>
      {seeAllTo && (
        <Link
          to={seeAllTo}
          className="text-[11px] font-bold text-[#047422] hover:underline"
        >
          See all
        </Link>
      )}
    </div>
  );
}

export function Row({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MediaCard({
  to,
  title,
  meta,
  imageUrl,
  badge,
  aspect = "square",
  className,
}: {
  to: string;
  title: string;
  meta?: string;
  imageUrl?: string;
  badge?: string;
  aspect?: "square" | "video";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group shrink-0 snap-start",
        aspect === "video" ? "w-[172px]" : "w-[152px]",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-[#050505]",
          aspect === "video" ? "aspect-square" : "aspect-square"
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#050505] text-white/30">
            <Radio className="h-7 w-7" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {badge && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#E7F5EA] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#047422]">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[12.5px] font-bold leading-snug text-[#050505]">
        {title}
      </p>
      {meta && (
        <p className="mt-0.5 truncate text-[10.5px] font-medium text-[#6B7280]">
          {meta}
        </p>
      )}
    </Link>
  );
}

export function EpisodeRow({
  episode,
}: {
  episode: {
    id: string;
    title: string;
    program_title?: string;
    cover_url?: string;
    audio_url?: string;
    duration_seconds?: number;
  };
}) {
  const { track, playing, play } = usePlayer();
  const isCurrent = track?.id === episode.id && playing;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3">
      <Link
        to={`/mobile/episodes/${episode.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#050505]">
          {episode.cover_url ? (
            <img
              src={episode.cover_url}
              alt={episode.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40">
              <Radio className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-bold text-[#050505]">
            {episode.title}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] font-medium text-[#6B7280]">
            {[
              episode.program_title,
              episode.duration_seconds
                ? formatDuration(episode.duration_seconds)
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Radio Hargeysa"}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() =>
          play({
            id: episode.id,
            type: "EPISODE",
            title: episode.title,
            subtitle: episode.program_title || "Radio Hargeysa",
            imageUrl: episode.cover_url,
            src: episode.audio_url || "",
            durationSeconds: episode.duration_seconds,
            href: `/mobile/episodes/${episode.id}`,
          })
        }
        aria-label={isCurrent ? "Pause episode" : "Play episode"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#047422] text-white transition-transform active:scale-95"
      >
        {isCurrent ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}
