import React, { useEffect, useState } from "react";
import {
  Calendar,
  Waves,
  Disc,
  Video,
  Newspaper,
  Users,
  FolderOpen,
  Building2,
  Radio,
  LayoutGrid,
} from "lucide-react";
import { ContentManager } from "../../components/admin/ContentManager";
import { TablePill } from "../../components/shared/DataTable";
import {
  CATEGORY_ICONS,
  CATEGORY_THEMES,
  CategoryIconGraphic,
  getThemeWaveColors,
} from "../../components/shared/CategoryVisuals";
import { apiFetch } from "../../lib/api";
import {
  DAYS_OF_WEEK,
  PROGRAM_CATEGORIES,
  EPISODE_STATUSES,
  VIDEO_KINDS,
  NEWS_CATEGORIES,
  MEDIA_TYPES,
  LANGUAGES,
  titleCaseCategory,
} from "../../lib/constants";
import { formatTime } from "../../lib/format";

export function AdminSchedulesPage() {
  return (
    <ContentManager
      entity="Schedule"
      eyebrow="PROGRAMMING"
      title="Schedules"
      description="Manage weekly broadcast slots across stations."
      newLabel="New slot"
      searchPlaceholder="Search program, presenter, studio…"
      emptyIcon={Calendar}
      emptyTitle="No schedule slots yet"
      searchKeys={["program_title", "presenter_name", "day_of_week", "studio"]}
      statusOptions={["SCHEDULED", "ACTIVE", "CANCELLED"]}
      filters={[
        {
          key: "day_of_week",
          label: "Days",
          options: DAYS_OF_WEEK.map((d) => ({ value: d, label: d })),
        },
        { key: "studio", label: "Studios" },
      ]}
      columns={[
        { key: "day_of_week", label: "Day" },
        {
          key: "time",
          label: "Time",
          render: (r) => `${formatTime(r.start_time)} – ${formatTime(r.end_time)}`,
        },
        {
          key: "program_title",
          label: "Program",
          render: (r) => <span className="font-bold text-[#050505]">{r.program_title}</span>,
        },
        { key: "presenter_name", label: "Presenter" },
        { key: "studio", label: "Studio" },
      ]}
      fields={[
        { key: "program_title", label: "Program", required: true },
        { key: "presenter_name", label: "Presenter" },
        {
          key: "day_of_week",
          label: "Day",
          type: "select",
          required: true,
          options: DAYS_OF_WEEK.map((d) => ({ value: d, label: d })),
        },
        { key: "start_time", label: "Start", required: true, placeholder: "07:00" },
        { key: "end_time", label: "End", required: true, placeholder: "09:00" },
        { key: "studio", label: "Studio", placeholder: "Studio 1" },
      ]}
      initialValues={{ day_of_week: "MONDAY", studio: "Studio 1", status: "SCHEDULED" }}
    />
  );
}

export function AdminCategoriesPage() {
  return (
    <ContentManager
      entity="Category"
      eyebrow="CATALOGUE"
      title="Categories"
      description="Manage mobile home screen categories, uploaded icons/photos, and card themes."
      newLabel="New category"
      searchPlaceholder="Search categories…"
      emptyIcon={LayoutGrid}
      emptyTitle="No categories yet"
      searchKeys={["name", "slug", "description", "color_theme"]}
      statusOptions={["ACTIVE", "INACTIVE"]}
      filters={[
        {
          key: "color_theme",
          label: "Themes",
          options: CATEGORY_THEMES.map((t) => ({ value: t.value, label: t.label })),
        },
      ]}
      columns={[
        {
          key: "name",
          label: "Category",
          render: (r) => {
            const theme = getThemeWaveColors(r.color_theme);
            return (
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E7E9EC] bg-gradient-to-b ${theme.bg}`}
                >
                  <CategoryIconGraphic
                    iconName={r.icon_name}
                    imageUrl={r.image_url}
                    name={r.name}
                    className="h-6 w-6"
                  />
                </div>
                <span className="font-bold text-[#050505]">{r.name}</span>
              </div>
            );
          },
        },
        {
          key: "slug",
          label: "Key",
          render: (r) => <TablePill>{r.slug}</TablePill>,
        },
        {
          key: "color_theme",
          label: "Theme",
          render: (r) => {
            const theme = getThemeWaveColors(r.color_theme);
            return (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#4B5563]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: theme.dot }}
                />
                {titleCaseCategory(r.color_theme || "green")}
              </span>
            );
          },
        },
        {
          key: "sort_order",
          label: "Order",
          align: "right",
          render: (r) => (
            <span className="tabular-nums text-[12px] font-semibold text-[#4B5563]">
              {r.sort_order ?? 0}
            </span>
          ),
        },
      ]}
      fields={[
        { key: "name", label: "Category name", required: true, placeholder: "News" },
        {
          key: "slug",
          label: "Program key (uppercase)",
          required: true,
          placeholder: "NEWS",
        },
        {
          key: "icon_name",
          label: "Default icon",
          type: "select",
          options: CATEGORY_ICONS.map((i) => ({ value: i.value, label: i.label })),
        },
        {
          key: "color_theme",
          label: "Card theme",
          type: "select",
          options: CATEGORY_THEMES.map((t) => ({ value: t.value, label: t.label })),
        },
        { key: "sort_order", label: "Sort order", type: "number", placeholder: "1" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "ACTIVE", label: "ACTIVE" },
            { value: "INACTIVE", label: "INACTIVE" },
          ],
        },
        {
          key: "image_url",
          label: "Category image / photo",
          type: "image",
          fullWidth: true,
        },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      initialValues={{
        icon_name: "newspaper",
        color_theme: "green",
        sort_order: 10,
        status: "ACTIVE",
      }}
    />
  );
}

export function AdminProgramsPage() {
  const [catOptions, setCatOptions] = useState<Array<{ value: string; label: string }>>(
    PROGRAM_CATEGORIES.map((c) => ({ value: c, label: titleCaseCategory(c) }))
  );

  useEffect(() => {
    apiFetch<any[]>("/api/content/categories")
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setCatOptions(list.map((c) => ({ value: c.slug, label: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ContentManager
      entity="Program"
      eyebrow="CATALOGUE"
      title="Programs"
      description="National broadcast programs across Radio Hargeysa."
      newLabel="New program"
      searchPlaceholder="Search programs…"
      emptyIcon={Waves}
      searchKeys={["title", "category", "schedule_text", "description"]}
      statusOptions={["DRAFT", "PUBLISHED", "ARCHIVED"]}
      filters={[
        { key: "category", label: "Categories", options: catOptions },
        {
          key: "language",
          label: "Languages",
          options: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
        },
      ]}
      columns={[
        {
          key: "title",
          label: "Program",
          render: (r) => <span className="font-bold text-[#050505]">{r.title}</span>,
        },
        {
          key: "category",
          label: "Category",
          render: (r) => <TablePill>{r.category}</TablePill>,
        },
        { key: "schedule_text", label: "Schedule" },
        { key: "follower_count", label: "Followers", align: "right" },
      ]}
      fields={[
        { key: "title", label: "Title", required: true },
        {
          key: "category",
          label: "Category",
          type: "select",
          required: true,
          options: catOptions,
        },
        { key: "schedule_text", label: "Schedule", placeholder: "Mon–Fri · 07:00" },
        {
          key: "language",
          label: "Language",
          type: "select",
          options: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
        },
        {
          key: "cover_url",
          label: "Program cover image",
          type: "image",
          fullWidth: true,
        },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      initialValues={{
        category: catOptions[0]?.value || "NEWS",
        language: "so",
        status: "PUBLISHED",
      }}
    />
  );
}

export function AdminEpisodesPage() {
  return (
    <ContentManager
      entity="Episode"
      eyebrow="CATALOGUE"
      title="Episodes"
      description="Manage recorded episodes, audio links, and publication status."
      newLabel="New episode"
      searchPlaceholder="Search episodes or programs…"
      emptyIcon={Disc}
      searchKeys={["title", "program_title", "description"]}
      statusOptions={[...EPISODE_STATUSES]}
      filters={[
        { key: "program_title", label: "Programs" },
        {
          key: "language",
          label: "Languages",
          options: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
        },
      ]}
      columns={[
        {
          key: "title",
          label: "Episode",
          render: (r) => <span className="font-bold text-[#050505]">{r.title}</span>,
        },
        { key: "program_title", label: "Program" },
        { key: "play_count", label: "Plays", align: "right" },
        {
          key: "audio_url",
          label: "Audio",
          render: (r) => (r.audio_url ? "Attached" : "—"),
        },
      ]}
      fields={[
        { key: "title", label: "Episode title", required: true },
        { key: "program_title", label: "Program" },
        {
          key: "presenter_names",
          label: "Presenter(s) comma separated",
          isArray: true,
          fullWidth: true,
        },
        {
          key: "audio_url",
          label: "Audio file URL",
          placeholder: "https://…/episode.mp3",
          fullWidth: true,
        },
        {
          key: "cover_url",
          label: "Cover image",
          type: "image",
          fullWidth: true,
        },
        { key: "duration_seconds", label: "Duration (seconds)", type: "number" },
        {
          key: "language",
          label: "Language",
          type: "select",
          options: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
        },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      initialValues={{
        language: "so",
        status: "PUBLISHED",
      }}
    />
  );
}

export function AdminVideosPage() {
  return (
    <ContentManager
      entity="Video"
      eyebrow="CATALOGUE"
      title="Videos"
      description="Studio recordings, interviews, and news highlights."
      newLabel="New video"
      searchPlaceholder="Search videos…"
      emptyIcon={Video}
      searchKeys={["title", "program_title", "kind", "description"]}
      statusOptions={[
        "DRAFT",
        "PROCESSING",
        "PENDING_APPROVAL",
        "SCHEDULED",
        "PUBLISHED",
        "ARCHIVED",
      ]}
      filters={[
        {
          key: "kind",
          label: "Types",
          options: VIDEO_KINDS.map((k) => ({ value: k, label: k })),
        },
        { key: "program_title", label: "Programs" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => <span className="font-bold text-[#050505]">{r.title}</span>,
        },
        {
          key: "kind",
          label: "Kind",
          render: (r) => <TablePill>{r.kind}</TablePill>,
        },
        { key: "program_title", label: "Program" },
      ]}
      fields={[
        { key: "title", label: "Title", required: true },
        {
          key: "kind",
          label: "Type",
          type: "select",
          options: VIDEO_KINDS.map((k) => ({ value: k, label: k })),
        },
        { key: "program_title", label: "Program" },
        { key: "video_url", label: "Video URL/HLS" },
        {
          key: "thumbnail_url",
          label: "Thumbnail image",
          type: "image",
          fullWidth: true,
        },
        { key: "duration_seconds", label: "Duration (seconds)", type: "number" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      initialValues={{
        kind: "STUDIO",
        status: "PUBLISHED",
      }}
    />
  );
}

export function AdminNewsPage() {
  return (
    <ContentManager
      entity="NewsArticle"
      eyebrow="NEWSROOM"
      title="News"
      description="National and regional editorial dispatches."
      newLabel="New story"
      searchPlaceholder="Search headlines, authors…"
      emptyIcon={Newspaper}
      searchKeys={["title", "category", "author", "summary"]}
      statusOptions={["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]}
      filters={[
        {
          key: "category",
          label: "Categories",
          options: NEWS_CATEGORIES.map((c) => ({ value: c, label: c })),
        },
        { key: "author", label: "Authors" },
      ]}
      columns={[
        {
          key: "title",
          label: "Headline",
          render: (r) => <span className="font-bold text-[#050505]">{r.title}</span>,
        },
        {
          key: "category",
          label: "Category",
          render: (r) => <TablePill>{r.category}</TablePill>,
        },
        { key: "author", label: "Author" },
        { key: "view_count", label: "Views", align: "right" },
      ]}
      fields={[
        { key: "title", label: "Headline", required: true },
        {
          key: "category",
          label: "Category",
          type: "select",
          required: true,
          options: NEWS_CATEGORIES.map((c) => ({ value: c, label: c })),
        },
        { key: "author", label: "Author" },
        {
          key: "image_url",
          label: "Story image",
          type: "image",
          fullWidth: true,
        },
        { key: "summary", label: "Summary", type: "textarea" },
        { key: "body", label: "Article body", type: "textarea" },
      ]}
      initialValues={{
        category: "SOMALILAND",
        status: "PUBLISHED",
      }}
    />
  );
}

export function AdminPresentersPage() {
  return (
    <ContentManager
      entity="Presenter"
      eyebrow="PEOPLE"
      title="Presenters"
      description="On-air hosts, journalists, and producers."
      newLabel="New presenter"
      searchPlaceholder="Search presenters…"
      emptyIcon={Users}
      searchKeys={["full_name", "role_title", "bio"]}
      statusOptions={["ACTIVE", "INACTIVE"]}
      filters={[{ key: "role_title", label: "Roles" }]}
      columns={[
        {
          key: "full_name",
          label: "Name",
          render: (r) => (
            <span className="font-bold text-[#050505]">{r.full_name}</span>
          ),
        },
        { key: "role_title", label: "Role" },
        {
          key: "program_titles",
          label: "Programs",
          render: (r) => (r.program_titles || []).join(", ") || "—",
        },
        { key: "years_at_station", label: "Years", align: "right" },
      ]}
      fields={[
        { key: "full_name", label: "Full name", required: true },
        { key: "role_title", label: "Role", placeholder: "Morning show host" },
        {
          key: "photo_url",
          label: "Presenter photo",
          type: "image",
          fullWidth: true,
        },
        {
          key: "program_titles",
          label: "Programs comma separated",
          isArray: true,
        },
        { key: "years_at_station", label: "Years at station", type: "number" },
        { key: "bio", label: "Biography", type: "textarea" },
      ]}
    />
  );
}

export function AdminMediaPage() {
  return (
    <ContentManager
      entity="MediaAsset"
      eyebrow="ASSETS"
      title="Media Library"
      description="Audio, video, thumbnails, and documents stored on the platform."
      newLabel="Add asset"
      searchPlaceholder="Search media…"
      emptyIcon={FolderOpen}
      searchKeys={["title", "type", "program_title", "uploaded_by"]}
      statusOptions={["READY", "PROCESSING", "ARCHIVED", "ERROR"]}
      filters={[
        {
          key: "type",
          label: "Types",
          options: MEDIA_TYPES.map((m) => ({ value: m, label: m })),
        },
        { key: "program_title", label: "Programs" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => <span className="font-bold text-[#050505]">{r.title}</span>,
        },
        {
          key: "type",
          label: "Type",
          render: (r) => <TablePill>{r.type}</TablePill>,
        },
        { key: "program_title", label: "Program" },
        {
          key: "size_mb",
          label: "Size",
          render: (r) => `${r.size_mb || 0} MB`,
        },
      ]}
      fields={[
        { key: "title", label: "Title", required: true },
        {
          key: "type",
          label: "Type",
          type: "select",
          options: MEDIA_TYPES.map((m) => ({ value: m, label: m })),
        },
        { key: "program_title", label: "Program" },
        { key: "file_uri", label: "File URL" },
        { key: "size_mb", label: "Size MB", type: "number" },
        { key: "tags", label: "Tags", isArray: true },
      ]}
      initialValues={{
        type: "AUDIO",
        status: "READY",
      }}
    />
  );
}

export function AdminOrganizationsPage() {
  return (
    <ContentManager
      entity="Organization"
      eyebrow="NETWORK"
      title="Organizations"
      description="Broadcasting entities operating Radio Hargeysa stations."
      newLabel="New organization"
      searchPlaceholder="Search organizations…"
      emptyIcon={Building2}
      searchKeys={["name", "city", "country", "contact_email"]}
      statusOptions={["ACTIVE", "INACTIVE"]}
      filters={[
        { key: "country", label: "Countries" },
        { key: "city", label: "Cities" },
      ]}
      columns={[
        {
          key: "name",
          label: "Organization",
          render: (r) => <span className="font-bold text-[#050505]">{r.name}</span>,
        },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        { key: "contact_email", label: "Contact" },
      ]}
      fields={[
        { key: "name", label: "Organization name", required: true },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        { key: "contact_email", label: "Contact email" },
        { key: "website", label: "Website", fullWidth: true },
      ]}
    />
  );
}

export function AdminStationsPage() {
  return (
    <ContentManager
      entity="Station"
      eyebrow="NETWORK"
      title="Stations"
      description="Configure broadcast stations, studios, and identity."
      newLabel="New station"
      searchPlaceholder="Search stations…"
      emptyIcon={Radio}
      searchKeys={["name", "city", "country", "studio_name", "tagline"]}
      statusOptions={["ACTIVE", "INACTIVE"]}
      filters={[
        { key: "city", label: "Cities" },
        { key: "country", label: "Countries" },
      ]}
      columns={[
        {
          key: "name",
          label: "Station",
          render: (r) => <span className="font-bold text-[#050505]">{r.name}</span>,
        },
        { key: "city", label: "City" },
        { key: "studio_name", label: "Studio" },
        { key: "founded_year", label: "Founded", align: "right" },
      ]}
      fields={[
        { key: "name", label: "Station name", required: true },
        { key: "tagline", label: "Tagline" },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        { key: "founded_year", label: "Founded year", type: "number" },
        { key: "studio_name", label: "Studio name" },
        {
          key: "logo_url",
          label: "Station logo",
          type: "image",
          fullWidth: true,
        },
        { key: "description", label: "Description", type: "textarea" },
        { key: "is_primary", label: "Primary station", type: "checkbox" },
      ]}
      initialValues={{
        country: "Somaliland",
        founded_year: 1942,
        status: "ACTIVE",
      }}
    />
  );
}
