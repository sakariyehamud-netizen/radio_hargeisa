import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Video as VideoIcon,
  Newspaper,
  Users,
  Calendar,
  Search as SearchIcon,
  X,
  Bell,
  Radio,
  FileAudio,
  Clock,
  Mic2,
  Sparkles,
  Share2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, trackAnalyticsEvent } from "../../lib/api";
import {
  formatDuration,
  formatDate,
  relativeTime,
  formatTime,
  hhmmToMinutes,
  stationNow,
} from "../../lib/format";
import {
  VIDEO_KINDS,
  NEWS_CATEGORIES,
  DAYS_OF_WEEK,
  DAY_SHORT_LABELS,
  PROGRAM_CATEGORIES,
  titleCaseCategory,
} from "../../lib/constants";
import { EmptyState, IntegrationNotice } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { MediaCard, Row, RowHeader, EpisodeRow } from "../../components/mobile/Media";
import { FollowButton, FavoriteButton } from "../../components/mobile/SaveButtons";
import { useAuth } from "../../lib/AuthContext";
import { cn } from "../../lib/utils";

export function MobileVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [kind, setKind] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/videos?kind=${kind}`)
      .then(setVideos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [kind]);

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Videos
      </h1>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {["ALL", ...VIDEO_KINDS].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors",
              kind === k
                ? "border-[#047422] bg-[#047422] text-white"
                : "border-[#E7E9EC] bg-white text-[#4B5563]"
            )}
          >
            {k === "ALL" ? "All" : titleCaseCategory(k)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))
        ) : videos.length === 0 ? (
          <EmptyState icon={VideoIcon} title="No videos yet" />
        ) : (
          videos.map((v) => (
            <Link
              key={v.id}
              to={`/mobile/videos/${v.id}`}
              className="block overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white"
            >
              <div className="relative aspect-video w-full bg-[#050505]">
                {v.thumbnail_url && (
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[9.5px] font-bold uppercase text-white">
                  {v.kind}
                </span>
                {v.duration_seconds > 0 && (
                  <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {formatDuration(v.duration_seconds)}
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-[13.5px] font-bold text-[#050505]">{v.title}</p>
                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                  {v.program_title || "Radio Hargeysa"}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function MobileVideoDetailPage() {
  const { videoId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/videos/${videoId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [videoId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="aspect-video animate-pulse rounded-2xl bg-[#E7E9EC]" />
      </div>
    );
  }
  if (!data?.video) {
    return (
      <div className="p-4">
        <EmptyState icon={VideoIcon} title="Video not found" />
      </div>
    );
  }

  const { video, related } = data;
  const sourceUrl = video.video_url || video.hls_url;

  return (
    <div className="pb-6">
      <div className="aspect-video w-full bg-[#050505]">
        {sourceUrl ? (
          <video
            controls
            poster={video.thumbnail_url}
            src={sourceUrl}
            onPlay={() =>
              trackAnalyticsEvent({
                event_type: "VIDEO_PLAY",
                item_type: "VIDEO",
                item_id: video.id,
              })
            }
            className="h-full w-full"
          />
        ) : (
          <img
            src={video.thumbnail_url || "/media/radio-studio.jpg"}
            alt={video.title}
            className="h-full w-full object-cover opacity-80"
          />
        )}
      </div>

      <div className="space-y-4 px-4 pt-4">
        {!sourceUrl && (
          <IntegrationNotice
            title="Video source not configured"
            detail="Add a video URL or upload a file in Studio → Videos to enable playback."
          />
        )}

        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#047422]">
              {video.program_title || video.kind}
            </p>
            <h1 className="mt-1 text-[19px] font-extrabold tracking-tight text-[#050505]">
              {video.title}
            </h1>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              {formatDate(video.published_at || video.created_date)}
            </p>
          </div>
          <FavoriteButton
            itemType="VIDEO"
            itemId={video.id}
            title={video.title}
            subtitle={video.program_title}
            imageUrl={video.thumbnail_url}
            href={`/mobile/videos/${video.id}`}
          />
        </div>

        {video.description && (
          <p className="text-[13px] leading-relaxed text-[#1F2937]">
            {video.description}
          </p>
        )}

        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.tags.map((t: string) => (
              <span
                key={t}
                className="rounded-full bg-[#F5F6F7] px-2.5 py-1 text-[10.5px] font-semibold text-[#6B7280]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {related?.length > 0 && (
        <div className="mt-4">
          <RowHeader title="More videos" seeAllTo="/mobile/videos" />
          <Row>
            {related.map((v: any) => (
              <MediaCard
                key={v.id}
                to={`/mobile/videos/${v.id}`}
                title={v.title}
                meta={v.program_title}
                imageUrl={v.thumbnail_url}
              />
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}

export function MobileNewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/news?category=${category}`)
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const breaking = articles.find((a) => a.is_breaking);

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        News
      </h1>

      {breaking && (
        <Link
          to={`/mobile/news/${breaking.id}`}
          className="mt-3 block rounded-2xl bg-[#C40D0F] p-4 text-white"
        >
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
            BREAKING NEWS
          </span>
          <p className="mt-1 text-[14px] font-extrabold leading-snug">
            {breaking.title}
          </p>
        </Link>
      )}

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["ALL", ...NEWS_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors",
              category === cat
                ? "border-[#047422] bg-[#047422] text-white"
                : "border-[#E7E9EC] bg-white text-[#4B5563]"
            )}
          >
            {cat === "ALL" ? "All" : titleCaseCategory(cat)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))
        ) : articles.length === 0 ? (
          <EmptyState icon={Newspaper} title="No stories here yet" />
        ) : (
          articles.map((a) => (
            <Link
              key={a.id}
              to={`/mobile/news/${a.id}`}
              className="block overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white"
            >
              {a.image_url && (
                <div className="aspect-video w-full bg-[#050505]">
                  <img
                    src={a.image_url}
                    alt={a.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold uppercase tracking-[0.12em] text-[#047422]">
                    {a.category}
                  </span>
                  <span className="text-[#9CA3AF]">
                    {relativeTime(a.published_at || a.created_date)}
                  </span>
                </div>
                <h2 className="mt-1 text-[14px] font-extrabold leading-snug text-[#050505]">
                  {a.title}
                </h2>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function MobileNewsDetailPage() {
  const { articleId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/news/${articleId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-56 animate-pulse rounded-2xl bg-[#E7E9EC]" />
      </div>
    );
  }
  if (!data?.article) {
    return (
      <div className="p-4">
        <EmptyState icon={Newspaper} title="Story not found" />
      </div>
    );
  }

  const { article, related } = data;
  const paragraphs = String(article.body || article.summary || "")
    .split(/\n+/)
    .filter(Boolean);

  return (
    <div className="pb-6">
      {article.image_url && (
        <div className="aspect-video w-full bg-[#050505]">
          <img
            src={article.image_url}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-4 px-4 pt-4">
        <div className="flex items-center justify-between text-[10.5px]">
          <span className="font-extrabold uppercase tracking-[0.14em] text-[#047422]">
            {article.category} · {relativeTime(article.published_at || article.created_date)}
          </span>
          <div className="flex items-center gap-2">
            <FavoriteButton
              itemType="NEWS"
              itemId={article.id}
              title={article.title}
              subtitle={article.category}
              imageUrl={article.image_url}
              href={`/mobile/news/${article.id}`}
            />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7E9EC] bg-white text-[#050505]"
              aria-label="Share article"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h1 className="text-[21px] font-extrabold leading-tight tracking-[-0.015em] text-[#050505]">
          {article.title}
        </h1>
        <p className="text-[11.5px] font-medium text-[#6B7280]">
          By {article.author || "Radio Hargeysa Newsroom"}
        </p>

        {article.audio_url && (
          <div className="rounded-2xl border border-[#E7E9EC] bg-white p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#047422]">
              Audio narration
            </p>
            <audio controls src={article.audio_url} className="w-full h-9" />
          </div>
        )}

        <div className="space-y-3 text-[13px] leading-[1.75] text-[#1F2937]">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {related?.length > 0 && (
          <div className="pt-4">
            <h2 className="mb-2.5 text-[14px] font-bold text-[#050505]">
              Related news
            </h2>
            <div className="space-y-2.5">
              {related.map((r: any) => (
                <Link
                  key={r.id}
                  to={`/mobile/news/${r.id}`}
                  className="block rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
                >
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-[#047422]">
                    {r.category}
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-bold text-[#050505]">
                    {r.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobilePresentersPage() {
  const [presenters, setPresenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/content/presenters")
      .then(setPresenters)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Presenters
      </h1>
      <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
        The voices of Radio Hargeysa.
      </p>

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))}
        </div>
      ) : presenters.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Users} title="No presenters listed" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {presenters.map((p) => (
            <Link
              key={p.id}
              to={`/mobile/presenters/${p.id}`}
              className="flex flex-col items-center rounded-2xl border border-[#E7E9EC] bg-white p-4 text-center"
            >
              <div className="h-20 w-20 overflow-hidden rounded-full bg-[#050505]">
                <img
                  src={p.photo_url || "/media/radio-studio.jpg"}
                  alt={p.full_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-[13px] font-extrabold text-[#050505]">
                {p.full_name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-[#6B7280]">
                {p.role_title}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobilePresenterDetailPage() {
  const { presenterId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/presenters/${presenterId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [presenterId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-56 animate-pulse rounded-3xl bg-[#E7E9EC]" />
      </div>
    );
  }
  if (!data?.presenter) {
    return (
      <div className="p-4">
        <EmptyState icon={Users} title="Presenter not found" />
      </div>
    );
  }

  const { presenter, programs, recentEpisodes, isLiveNow } = data;

  return (
    <div className="pb-6">
      <div className="relative h-56 w-full bg-[#050505]">
        <img
          src={presenter.photo_url || "/media/radio-studio.jpg"}
          alt={presenter.full_name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          {isLiveNow && <StatusBadge status="LIVE" className="mb-2" />}
          <h1 className="text-[22px] font-extrabold">{presenter.full_name}</h1>
          <p className="text-[12.5px] text-white/75">{presenter.role_title}</p>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-[11.5px]">
            <div>
              <p className="font-extrabold text-[#050505]">
                {presenter.years_at_station || 1} yrs
              </p>
              <p className="text-[#6B7280]">At station</p>
            </div>
            <div>
              <p className="font-extrabold text-[#050505]">
                {(presenter.languages || ["so"]).join(", ").toUpperCase()}
              </p>
              <p className="text-[#6B7280]">Languages</p>
            </div>
            <div>
              <p className="font-extrabold text-[#050505]">
                {programs?.length || 0}
              </p>
              <p className="text-[#6B7280]">Programs</p>
            </div>
          </div>
          <FollowButton
            targetType="PRESENTER"
            targetId={presenter.id}
            title={presenter.full_name}
            subtitle={presenter.role_title}
            imageUrl={presenter.photo_url}
          />
        </div>

        {presenter.bio && (
          <p className="text-[13px] leading-relaxed text-[#1F2937]">
            {presenter.bio}
          </p>
        )}

        {programs?.length > 0 && (
          <div>
            <h2 className="mb-2 text-[14px] font-bold text-[#050505]">
              Programs
            </h2>
            <div className="space-y-2">
              {programs.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/mobile/programs/${p.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[#E7E9EC] bg-white p-3"
                >
                  <div>
                    <p className="text-[13px] font-bold text-[#050505]">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {p.schedule_text}
                    </p>
                  </div>
                  <Play className="h-4 w-4 text-[#047422]" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {recentEpisodes?.length > 0 && (
          <div>
            <h2 className="mb-2 text-[14px] font-bold text-[#050505]">
              Recent episodes
            </h2>
            <div className="space-y-2">
              {recentEpisodes.map((ep: any) => (
                <EpisodeRow key={ep.id} episode={ep} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileSchedulePage() {
  const now = stationNow();
  const [day, setDay] = useState(now.dayOfWeek);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ items: any[] }>("/api/content/schedule")
      .then((res) => setItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dayItems = items
    .filter((s) => s.day_of_week === day)
    .sort((a, b) => hhmmToMinutes(a.start_time) - hhmmToMinutes(b.start_time));

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Weekly schedule
      </h1>
      <p className="mt-0.5 text-[11.5px] text-[#6B7280]">
        Hargeisa station time (UTC+3)
      </p>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDay(d)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
              day === d
                ? "border-[#047422] bg-[#047422] text-white"
                : "border-[#E7E9EC] bg-white text-[#4B5563]"
            )}
          >
            {DAY_SHORT_LABELS[d]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))
        ) : dayItems.length === 0 ? (
          <EmptyState icon={Calendar} title="Nothing scheduled" />
        ) : (
          dayItems.map((slot) => {
            const isNow =
              day === now.dayOfWeek &&
              now.minutesSinceMidnight >= hhmmToMinutes(slot.start_time) &&
              now.minutesSinceMidnight < hhmmToMinutes(slot.end_time);
            return (
              <div
                key={slot.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border bg-white p-3.5",
                  isNow
                    ? "border-[#047422] ring-1 ring-[#047422]"
                    : "border-[#E7E9EC]"
                )}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-[#047422] tabular-nums">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-extrabold text-[#050505]">
                    {slot.program_title}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    {[slot.presenter_name, slot.studio].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <StatusBadge status={isNow ? "LIVE" : slot.status || "SCHEDULED"} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MobileSearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      trackAnalyticsEvent({ event_type: "SEARCH", label: trimmed });
      apiFetch(`/api/content/search?q=${encodeURIComponent(trimmed)}`)
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const totalCount = results
    ? (results.programs?.length || 0) +
      (results.episodes?.length || 0) +
      (results.videos?.length || 0) +
      (results.news?.length || 0) +
      (results.presenters?.length || 0)
    : 0;

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Programs, episodes, news, presenters…"
          autoFocus
          className="w-full rounded-2xl border border-[#E7E9EC] bg-white py-3 pl-10 pr-10 text-[13px] focus:border-[#047422] focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9CA3AF] hover:bg-[#F5F6F7]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!q.trim() ? (
        <div className="mt-6 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              Browse categories
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PROGRAM_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQ(titleCaseCategory(c))}
                  className="rounded-full border border-[#E7E9EC] bg-white px-3 py-1.5 text-[11.5px] font-bold text-[#050505]"
                >
                  {titleCaseCategory(c)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              Popular searches
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {["Subaxnimo", "Wararka", "Caways", "Sports", "Hargeisa"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQ(s)}
                  className="rounded-full bg-[#E7F5EA] px-3 py-1.5 text-[11.5px] font-bold text-[#047422]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="mt-6 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={SearchIcon}
            title={`No results for “${q.trim()}”`}
            description="Try searching another program, topic, or presenter."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {results.programs?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Programs ({results.programs.length})
              </p>
              <div className="space-y-2">
                {results.programs.map((p: any) => (
                  <Link
                    key={p.id}
                    to={`/mobile/programs/${p.id}`}
                    className="block rounded-2xl border border-[#E7E9EC] bg-white p-3 text-[13px] font-bold text-[#050505]"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.episodes?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Episodes ({results.episodes.length})
              </p>
              <div className="space-y-2">
                {results.episodes.map((ep: any) => (
                  <EpisodeRow key={ep.id} episode={ep} />
                ))}
              </div>
            </div>
          )}

          {results.videos?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Videos ({results.videos.length})
              </p>
              <div className="space-y-2">
                {results.videos.map((v: any) => (
                  <Link
                    key={v.id}
                    to={`/mobile/videos/${v.id}`}
                    className="block rounded-2xl border border-[#E7E9EC] bg-white p-3 text-[13px] font-bold text-[#050505]"
                  >
                    {v.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.news?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                News ({results.news.length})
              </p>
              <div className="space-y-2">
                {results.news.map((n: any) => (
                  <Link
                    key={n.id}
                    to={`/mobile/news/${n.id}`}
                    className="block rounded-2xl border border-[#E7E9EC] bg-white p-3 text-[13px] font-bold text-[#050505]"
                  >
                    {n.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.presenters?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Presenters ({results.presenters.length})
              </p>
              <div className="space-y-2">
                {results.presenters.map((p: any) => (
                  <Link
                    key={p.id}
                    to={`/mobile/presenters/${p.id}`}
                    className="block rounded-2xl border border-[#E7E9EC] bg-white p-3 text-[13px] font-bold text-[#050505]"
                  >
                    {p.full_name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const NOTIF_ICONS: Record<string, any> = {
  LIVE_STARTED: Radio,
  NEW_EPISODE: FileAudio,
  NEW_VIDEO: VideoIcon,
  BREAKING_NEWS: Newspaper,
  PROGRAM_STARTING: Clock,
  NEW_PROGRAM: Mic2,
  AI_PROCESSING_COMPLETE: Sparkles,
};

export function MobileNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    apiFetch<any[]>("/api/listener/notifications")
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [isAuthenticated]);

  const markAll = async () => {
    if (!isAuthenticated) return;
    try {
      await apiFetch("/api/listener/notifications/read-all", { method: "POST" });
      toast.success("All notifications marked read");
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not mark notifications read");
    }
  };

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
          Notifications
        </h1>
        {items.length > 0 && isAuthenticated && (
          <button
            type="button"
            onClick={markAll}
            className="text-[11.5px] font-bold text-[#047422] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" />
        ) : (
          items.map((n) => {
            const Icon = NOTIF_ICONS[n.type] || Bell;
            return (
              <button
                key={n.id}
                type="button"
                onClick={async () => {
                  if (isAuthenticated && !n.is_read) {
                    await apiFetch(`/api/listener/notifications/${n.id}/read`, {
                      method: "POST",
                    }).catch(() => {});
                  }
                  if (n.href) navigate(n.href);
                }}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3.5 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-bold text-[#050505]">
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#047422]" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-[11px] text-[#6B7280]">{n.body}</p>
                  )}
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">
                    {relativeTime(n.created_date)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
