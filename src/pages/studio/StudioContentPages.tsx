import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Upload,
  Sparkles,
  Disc,
  Mic,
  Video,
  Newspaper,
  Users,
  FolderOpen,
  Loader2,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import {
  PROGRAM_CATEGORIES,
  NEWS_CATEGORIES,
  VIDEO_KINDS,
  MEDIA_TYPES,
  LANGUAGES,
  titleCaseCategory,
} from "../../lib/constants";
import { formatDuration } from "../../lib/format";
import {
  PageHeader,
  SectionCard,
  ToolbarButton,
} from "../../components/shared/Surface";
import { DataTable, TablePill } from "../../components/shared/DataTable";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import {
  ConfirmDeleteDialog,
  FieldDef,
  RecordActions,
  RecordEditDialog,
  RecordViewDialog,
} from "../../components/studio/RecordActions";
import {
  ImageUploadField,
  uploadMediaFile as uploadLocalFile,
} from "../../components/shared/ImageUploadField";

export function StudioProgramsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const [catOptions, setCatOptions] = useState<Array<{ value: string; label: string }>>(
    PROGRAM_CATEGORIES.map((c) => ({ value: c, label: titleCaseCategory(c) }))
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prod, cats] = await Promise.all([
        apiFetch<any>("/api/studio/production"),
        apiFetch<any[]>("/api/content/categories").catch(() => []),
      ]);
      setRows(prod.programs || []);
      if (Array.isArray(cats) && cats.length > 0) {
        setCatOptions(cats.map((c) => ({ value: c.slug, label: c.name })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (catFilter !== "ALL" && r.category !== catFilter) return false;
      if (langFilter !== "ALL" && (r.language || "so") !== langFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          (r.presenter_names || []).join(", ").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, catFilter, langFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) ||
    catFilter !== "ALL" ||
    langFilter !== "ALL" ||
    statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setCatFilter("ALL");
    setLangFilter("ALL");
    setStatusFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: catOptions,
    },
    {
      key: "presenter_names",
      label: "Presenters (comma-separated)",
      isArray: true,
      placeholder: "Axmed Cali, Nimco Hassan",
    },
    {
      key: "schedule_text",
      label: "Schedule",
      placeholder: "Mon–Fri · 07:00",
    },
    {
      key: "language",
      label: "Language",
      type: "select",
      options: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "DRAFT", label: "DRAFT" },
        { value: "PUBLISHED", label: "PUBLISHED" },
        { value: "ARCHIVED", label: "ARCHIVED" },
      ],
    },
    {
      key: "cover_url",
      label: "Program cover image",
      type: "image",
      fullWidth: true,
    },
    { key: "description", label: "Description", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="PROGRAMMING"
        title="Programs"
        description="Manage shows, presenters, and broadcast schedules."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New program</span>
          </ToolbarButton>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, presenter…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filter by category"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {catOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              aria-label="Filter by language"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={r.cover_url || "/media/radio-studio.jpg"}
                      alt={r.title}
                      className="h-8 w-8 rounded-lg object-cover border border-[#E7E9EC]"
                    />
                    <span className="font-bold text-[#050505]">{r.title}</span>
                  </div>
                ),
              },
              {
                key: "category",
                label: "Category",
                render: (r) => <TablePill>{r.category}</TablePill>,
              },
              {
                key: "presenter_names",
                label: "Presenter",
                render: (r) => (r.presenter_names || []).join(", ") || "—",
              },
              { key: "schedule_text", label: "Schedule" },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Disc}
                title={hasFilters ? "No matching programs" : "No programs yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New program</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "Program Details"}
        record={viewing}
        fields={fields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="New program"
        fields={fields}
        initialValues={{
          category: "NEWS",
          language: "so",
          status: "DRAFT",
          cover_url: "/media/radio-studio.jpg",
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/programs", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Created");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit program"
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Program/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete program"
        description={`Delete program "${deleting?.title || "this program"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Program/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioEpisodesPage() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production");
      setEpisodes(prod.episodes || []);
      setPrograms(prod.programs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    return episodes.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (programFilter !== "ALL" && e.program_id !== programFilter) return false;
      if (langFilter !== "ALL" && (e.language || "so") !== langFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          e.title?.toLowerCase().includes(q) ||
          e.program_title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [episodes, statusFilter, programFilter, langFilter, query]);

  const hasFilters =
    Boolean(query.trim()) ||
    statusFilter !== "ALL" ||
    programFilter !== "ALL" ||
    langFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setProgramFilter("ALL");
    setLangFilter("ALL");
  };

  const episodeFields: FieldDef[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "program_id",
      label: "Program",
      type: "select",
      options: programs.map((p) => ({ value: p.id, label: p.title })),
    },
    {
      key: "language",
      label: "Language",
      type: "select",
      options: LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["DRAFT", "PENDING_APPROVAL", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map(
        (s) => ({ value: s, label: s })
      ),
    },
    { key: "audio_url", label: "Audio URL", placeholder: "https://…/episode.mp3" },
    { key: "duration_seconds", label: "Duration (sec)", type: "number" },
    {
      key: "cover_url",
      label: "Cover image",
      type: "image",
      fullWidth: true,
    },
    { key: "description", label: "Description", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="PRODUCTION"
        title="Episodes"
        description="Review, edit, and publish recorded radio episodes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/studio/episodes/upload"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E9EC] bg-white px-3.5 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
            >
              <Upload className="h-3.5 w-3.5 text-[#047422]" />
              <span>Upload audio</span>
            </Link>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>New episode</span>
            </ToolbarButton>
          </div>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search episode, program…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by episode status"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              aria-label="Filter by program"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              aria-label="Filter by language"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {visible.length} of {episodes.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={r.cover_url || "/media/radio-studio.jpg"}
                      alt={r.title}
                      className="h-8 w-8 rounded-lg object-cover border border-[#E7E9EC]"
                    />
                    <span className="font-bold text-[#050505]">{r.title}</span>
                  </div>
                ),
              },
              { key: "program_title", label: "Program" },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "play_count",
                label: "Plays",
                align: "right",
                render: (r) => (
                  <span className="font-mono tabular-nums">{r.play_count || 0}</span>
                ),
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    extra={
                      r.status === "DRAFT" ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/studio/episodes/${r.id}/status`, {
                              method: "POST",
                              body: JSON.stringify({ status: "PENDING_APPROVAL" }),
                            });
                            toast.success("Submitted for review");
                            load();
                          }}
                          className="mr-1 rounded-lg border border-[#E7E9EC] px-2 py-1 text-[10.5px] font-bold text-[#047422] hover:bg-[#E7F5EA]"
                        >
                          Submit for review
                        </button>
                      ) : null
                    }
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={visible}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Disc}
                title={hasFilters ? "No matching episodes" : "No episodes yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New episode</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "Episode Details"}
        record={viewing}
        fields={episodeFields}
        extraFields={[{ key: "play_count", label: "Plays" }]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="New episode"
        fields={episodeFields}
        initialValues={{
          language: "so",
          status: "DRAFT",
          cover_url: "/media/radio-studio.jpg",
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/episodes", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Episode created");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit episode"
        fields={episodeFields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Episode/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete episode"
        description={`Delete episode "${deleting?.title || "this episode"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Episode/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioEpisodeUploadPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<any[]>([]);
  const [presenters, setPresenters] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    program_id: "",
    presenter_name: "",
    category: "NEWS",
    language: "so",
    tags: "",
    description: "",
    download_allowed: true,
    cover_url: "/media/radio-studio.jpg",
    audio_url: "",
  });
  const [fileStatus, setFileStatus] = useState("No file selected");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<any>("/api/studio/production")
      .then((res) => {
        setPrograms(res.programs || []);
        setPresenters(res.presenters || []);
      })
      .catch(() => {});
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileStatus(`Uploading ${file.name}…`);
    try {
      const res = await uploadLocalFile(file);
      setForm((f) => ({ ...f, audio_url: res.url }));
      setFileStatus(`Uploaded: ${file.name} (${res.size_mb} MB)`);
      toast.success("Audio uploaded");
    } catch (err: any) {
      setFileStatus("Upload failed");
      toast.error(err.message || "Could not upload audio");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (status: "DRAFT" | "PUBLISHED", runAi = false) => {
    if (!form.title.trim()) {
      toast.error("Episode title is required.");
      return;
    }
    setSaving(true);
    try {
      const ep = await apiFetch<any>("/api/studio/episodes", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          program_id: form.program_id || null,
          presenter_names: form.presenter_name ? [form.presenter_name] : [],
          category: form.category,
          language: form.language,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          description: form.description,
          download_allowed: form.download_allowed,
          cover_url: form.cover_url,
          audio_url: form.audio_url,
          status,
        }),
      });
      if (runAi) {
        await apiFetch("/api/studio/ai/run", {
          method: "POST",
          body: JSON.stringify({
            kind: "SUMMARY",
            target_type: "EPISODE",
            target_id: ep.id,
            language: form.language,
          }),
        }).catch(() => {});
        toast.success("Saved · AI summary queued for review");
        navigate("/studio/ai");
      } else {
        toast.success(status === "PUBLISHED" ? "Episode published" : "Draft saved");
        navigate("/studio/episodes");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not save episode");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="PRODUCTION"
        title="Upload episode"
        description="MP3, WAV or M4A. Files are stored publicly so listeners can stream and download them."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="Episode details" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Title <span className="text-[#C40D0F]">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Program
              </label>
              <select
                value={form.program_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, program_id: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                <option value="">Unassigned</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Presenter
              </label>
              <select
                value={form.presenter_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, presenter_name: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                <option value="">Select presenter…</option>
                {presenters.map((p) => (
                  <option key={p.id} value={p.full_name}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                {PROGRAM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {titleCaseCategory(c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Language
              </label>
              <select
                value={form.language}
                onChange={(e) =>
                  setForm((f) => ({ ...f, language: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Tags
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="morning, culture, interview"
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUploadField
                label="Cover image"
                value={form.cover_url}
                onChange={(url) => setForm((f) => ({ ...f, cover_url: url }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={form.download_allowed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      download_allowed: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#047422]"
                />
                <span>Allow downloads</span>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Audio file">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3E5E9] bg-[#F5F6F7] p-6 text-center hover:border-[#047422]">
            <Upload className="h-6 w-6 text-[#047422]" />
            <p className="mt-2 text-[12.5px] font-bold text-[#050505]">
              Drop your audio file or browse
            </p>
            <p className="mt-1 text-[11px] text-[#6B7280]">{fileStatus}</p>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          <div className="mt-5 space-y-2">
            <ToolbarButton
              variant="outline"
              disabled={saving || uploading}
              onClick={() => submit("DRAFT")}
              className="w-full"
            >
              Save draft
            </ToolbarButton>
            <ToolbarButton
              disabled={saving || uploading}
              onClick={() => submit("PUBLISHED")}
              className="w-full"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Publish</span>
            </ToolbarButton>
            <ToolbarButton
              variant="dark"
              disabled={saving || uploading}
              onClick={() => submit("DRAFT", true)}
              className="w-full"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#4ADE80]" />
              <span>AI assist</span>
            </ToolbarButton>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function StudioRecordingsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production");
      setRows(prod.recordings || []);
      setPrograms(prod.programs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (sourceFilter === "AUTO" && !r.is_automatic) return false;
      if (sourceFilter === "MANUAL" && r.is_automatic) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.title?.toLowerCase().includes(q) ||
          r.program_title?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, statusFilter, sourceFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || statusFilter !== "ALL" || sourceFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "program_id",
      label: "Program",
      type: "select",
      options: programs.map((p) => ({ value: p.id, label: p.title })),
    },
    { key: "program_title", label: "Program Title" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["SAVED", "PROCESSING", "PROCESSED", "FAILED"].map((s) => ({
        value: s,
        label: s,
      })),
    },
    { key: "duration_seconds", label: "Duration (sec)", type: "number" },
    { key: "size_mb", label: "Size (MB)", type: "number" },
    { key: "file_uri", label: "File URL", placeholder: "/uploads/recording.mp3" },
    { key: "is_automatic", label: "Automatic capture", type: "checkbox" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CAPTURE"
        title="Recordings"
        description="Automatic broadcast captures ready to convert into episodes."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add recording</span>
          </ToolbarButton>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recording, program…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by recording status"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SAVED">SAVED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PROCESSED">PROCESSED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter by capture source"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="AUTO">Auto Capture</option>
              <option value="MANUAL">Manual Upload</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (r) => (
                  <span className="font-bold text-[#050505]">{r.title}</span>
                ),
              },
              { key: "program_title", label: "Program" },
              {
                key: "duration_seconds",
                label: "Duration",
                render: (r) => (
                  <span className="font-mono tabular-nums">
                    {formatDuration(r.duration_seconds)}
                  </span>
                ),
              },
              {
                key: "size_mb",
                label: "Size",
                render: (r) => (
                  <span className="tabular-nums">{r.size_mb || 0} MB</span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "is_automatic",
                label: "Source",
                render: (r) => (r.is_automatic ? "Auto" : "Manual"),
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    extra={
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(
                            `/api/studio/recordings/${r.id}/to-episode`,
                            { method: "POST" }
                          );
                          toast.success("Converted to draft episode");
                          navigate("/studio/episodes");
                        }}
                        className="mr-1 rounded-lg border border-[#E7E9EC] px-2 py-1 text-[10.5px] font-bold text-[#047422] hover:bg-[#E7F5EA]"
                      >
                        Turn into episode
                      </button>
                    }
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Mic}
                title={hasFilters ? "No matching recordings" : "No recordings yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add recording</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "Recording Details"}
        record={viewing}
        fields={fields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Add recording"
        fields={fields}
        initialValues={{
          status: "SAVED",
          duration_seconds: 900,
          size_mb: 7.2,
          is_automatic: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          const matched = programs.find((p) => p.id === vals.program_id);
          await apiFetch("/api/studio/record/Recording", {
            method: "POST",
            body: JSON.stringify({
              ...vals,
              program_title: matched?.title || vals.program_title || "",
            }),
          });
          toast.success("Recording added");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit recording"
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          const matched = programs.find((p) => p.id === vals.program_id);
          await apiFetch(`/api/studio/record/Recording/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              ...vals,
              program_title: matched?.title || vals.program_title || "",
            }),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete recording"
        description={`Delete recording "${deleting?.title || "this capture"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Recording/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioVideosPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production");
      setRows(prod.videos || []);
      setPrograms(prod.programs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (kindFilter !== "ALL" && r.kind !== kindFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.title?.toLowerCase().includes(q) ||
          r.program_title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, kindFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || kindFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setKindFilter("ALL");
    setStatusFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "kind",
      label: "Kind",
      type: "select",
      options: VIDEO_KINDS.map((k) => ({ value: k, label: k })),
    },
    {
      key: "program_id",
      label: "Program",
      type: "select",
      options: programs.map((p) => ({ value: p.id, label: p.title })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((s) => ({
        value: s,
        label: s,
      })),
    },
    { key: "video_url", label: "Video URL" },
    { key: "duration_seconds", label: "Duration (sec)", type: "number" },
    {
      key: "thumbnail_url",
      label: "Thumbnail image",
      type: "image",
      fullWidth: true,
    },
    { key: "description", label: "Description", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="PRODUCTION"
        title="Videos"
        description="Studio video sessions, interviews, and news highlights."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/studio/videos/upload"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E9EC] bg-white px-3.5 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
            >
              <Upload className="h-3.5 w-3.5 text-[#047422]" />
              <span>Upload file</span>
            </Link>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>New video</span>
            </ToolbarButton>
          </div>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, program…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                aria-label="Filter by video kind"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Kinds</option>
                {VIDEO_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by video status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={r.thumbnail_url || "/media/radio-studio.jpg"}
                      alt={r.title}
                      className="h-8 w-12 rounded-lg object-cover border border-[#E7E9EC]"
                    />
                    <span className="font-bold text-[#050505]">{r.title}</span>
                  </div>
                ),
              },
              {
                key: "kind",
                label: "Kind",
                render: (r) => <TablePill>{r.kind}</TablePill>,
              },
              { key: "program_title", label: "Program" },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Video}
                title={hasFilters ? "No matching videos" : "No videos yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New video</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "Video Details"}
        record={viewing}
        fields={fields}
        extraFields={[{ key: "view_count", label: "Views" }]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="New video"
        fields={fields}
        initialValues={{
          kind: "RECORDED",
          status: "DRAFT",
          thumbnail_url: "/media/radio-studio.jpg",
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/videos", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Video created");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit video"
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Video/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete video"
        description={`Delete video "${deleting?.title || "this video"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Video/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioVideoUploadPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    program_id: "",
    thumbnail_url: "/media/radio-studio.jpg",
    video_url: "",
    kind: "RECORDED",
    tags: "",
    description: "",
  });
  const [fileStatus, setFileStatus] = useState("No video selected");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<any>("/api/studio/production")
      .then((res) => setPrograms(res.programs || []))
      .catch(() => {});
  }, []);

  const submit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/studio/videos", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status,
        }),
      });
      toast.success(status === "PUBLISHED" ? "Video published" : "Draft saved");
      navigate("/studio/videos");
    } catch (err: any) {
      toast.error(err.message || "Could not save video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="PRODUCTION" title="Upload video" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="Video details" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Title <span className="text-[#C40D0F]">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Program
              </label>
              <select
                value={form.program_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, program_id: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                <option value="">Unassigned</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Kind
              </label>
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                {VIDEO_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Thumbnail image"
                value={form.thumbnail_url}
                onChange={(url) =>
                  setForm((f) => ({ ...f, thumbnail_url: url }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Video file">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3E5E9] bg-[#F5F6F7] p-6 text-center">
            <Upload className="h-6 w-6 text-[#047422]" />
            <p className="mt-2 text-[12.5px] font-bold">
              Drop video file or browse
            </p>
            <p className="mt-1 text-[11px] text-[#6B7280]">{fileStatus}</p>
            <input
              type="file"
              accept="video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileStatus(`Uploading ${file.name}…`);
                try {
                  const res = await uploadLocalFile(file);
                  setForm((f) => ({ ...f, video_url: res.url }));
                  setFileStatus(`Uploaded: ${file.name}`);
                } catch (err: any) {
                  setFileStatus("Upload failed — try another video file.");
                  toast.error(err.message || "Video upload failed");
                }
              }}
              className="hidden"
            />
          </label>
          <div className="mt-5 space-y-2">
            <ToolbarButton
              variant="outline"
              disabled={saving}
              onClick={() => submit("DRAFT")}
              className="w-full"
            >
              Save draft
            </ToolbarButton>
            <ToolbarButton
              disabled={saving}
              onClick={() => submit("PUBLISHED")}
              className="w-full"
            >
              Publish
            </ToolbarButton>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function StudioNewsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production");
      setRows(prod.news || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (catFilter !== "ALL" && r.category !== catFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.title?.toLowerCase().includes(q) ||
          r.summary?.toLowerCase().includes(q) ||
          r.author?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, catFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || catFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setCatFilter("ALL");
    setStatusFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "title", label: "Headline", required: true },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: NEWS_CATEGORIES.map((c) => ({ value: c, label: c })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((s) => ({
        value: s,
        label: s,
      })),
    },
    { key: "is_breaking", label: "Breaking alert", type: "checkbox" },
    {
      key: "image_url",
      label: "Story image",
      type: "image",
      fullWidth: true,
    },
    { key: "summary", label: "Summary", type: "textarea", fullWidth: true },
    { key: "body", label: "Body", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="NEWSROOM"
        title="News"
        description="Draft, schedule, and publish newsroom stories."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/studio/news/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E9EC] bg-white px-3.5 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
            >
              <span>Full composer</span>
            </Link>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>New story</span>
            </ToolbarButton>
          </div>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search headline, author…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filter by news category"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by news status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Headline",
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={r.image_url || "/media/hargeisa-sunset.jpg"}
                      alt={r.title}
                      className="h-8 w-10 rounded-lg object-cover border border-[#E7E9EC]"
                    />
                    <span className="font-bold text-[#050505]">{r.title}</span>
                  </div>
                ),
              },
              {
                key: "category",
                label: "Category",
                render: (r) => <TablePill>{r.category}</TablePill>,
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "view_count",
                label: "Views",
                align: "right",
                render: (r) => (
                  <span className="font-mono tabular-nums">{r.view_count || 0}</span>
                ),
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Newspaper}
                title={hasFilters ? "No matching stories" : "No stories filed yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New story</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "News Story"}
        record={viewing}
        fields={fields}
        extraFields={[
          { key: "author", label: "Author" },
          { key: "view_count", label: "Views" },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="New story"
        fields={fields}
        initialValues={{
          category: "SOMALILAND",
          status: "DRAFT",
          image_url: "/media/hargeisa-sunset.jpg",
          is_breaking: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/news", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Story saved");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit story"
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/NewsArticle/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete story"
        description={`Delete story "${deleting?.title || "this article"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/NewsArticle/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioNewsCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    category: "SOMALILAND",
    summary: "",
    body: "",
    image_url: "/media/hargeisa-sunset.jpg",
    audio_url: "",
    is_breaking: false,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (status: "DRAFT" | "SCHEDULED" | "PUBLISHED") => {
    if (!form.title.trim()) {
      toast.error("Headline is required.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/studio/news", {
        method: "POST",
        body: JSON.stringify({ ...form, status }),
      });
      toast.success(
        status === "PUBLISHED" ? "Story published" : "Story saved"
      );
      navigate("/studio/news");
    } catch (err: any) {
      toast.error(err.message || "Could not save story");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="NEWSROOM" title="New story" />
      <SectionCard>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Article <span className="text-[#C40D0F]">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
            >
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Story image"
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Summary
            </label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Body
            </label>
            <textarea
              rows={6}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Audio narration URL
            </label>
            <input
              value={form.audio_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, audio_url: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <ToolbarButton
            variant="outline"
            disabled={saving}
            onClick={() => submit("DRAFT")}
          >
            Save draft
          </ToolbarButton>
          <ToolbarButton
            variant="ghost"
            disabled={saving}
            onClick={() => submit("SCHEDULED")}
          >
            Schedule
          </ToolbarButton>
          <ToolbarButton disabled={saving} onClick={() => submit("PUBLISHED")}>
            Publish
          </ToolbarButton>
        </div>
      </SectionCard>
    </div>
  );
}

export function StudioPresentersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<any>("/api/studio/production")
      .then((r) => setRows(r.presenters || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (statusFilter !== "ALL" && (p.status || "ACTIVE") !== statusFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          p.full_name?.toLowerCase().includes(q) ||
          p.role_title?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          (p.program_titles || []).join(", ").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, statusFilter, query]);

  const hasFilters = Boolean(query.trim()) || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "full_name", label: "Full name", required: true },
    {
      key: "role_title",
      label: "Role",
      placeholder: "Morning show host",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "ACTIVE" },
        { value: "INACTIVE", label: "INACTIVE" },
      ],
    },
    { key: "email", label: "Email" },
    {
      key: "program_titles",
      label: "Assigned programs (comma-separated)",
      isArray: true,
    },
    {
      key: "years_at_station",
      label: "Years at station",
      type: "number",
    },
    {
      key: "photo_url",
      label: "Presenter photo",
      type: "image",
      fullWidth: true,
    },
    { key: "bio", label: "Bio", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="TALENT"
        title="Presenters"
        description="On-air hosts, journalists, and studio talent roster."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add presenter</span>
          </ToolbarButton>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search presenter, role, email…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by presenter status"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "full_name",
                label: "Presenter",
                render: (p) => (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.photo_url || "/media/radio-studio.jpg"}
                      alt={p.full_name}
                      className="h-9 w-9 rounded-full object-cover border border-[#E7E9EC]"
                    />
                    <div>
                      <p className="font-bold text-[#050505]">{p.full_name}</p>
                      {p.email && (
                        <p className="text-[11px] text-[#6B7280]">{p.email}</p>
                      )}
                    </div>
                  </div>
                ),
              },
              { key: "role_title", label: "Role" },
              {
                key: "program_titles",
                label: "Programs",
                render: (p) => (p.program_titles || []).join(", ") || "—",
              },
              {
                key: "status",
                label: "Status",
                render: (p) => <StatusBadge status={p.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (p) => (
                  <RecordActions
                    onView={() => setViewing(p)}
                    onEdit={() => setEditing(p)}
                    onDelete={() => setDeleting(p)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(p) => setViewing(p)}
            empty={
              <EmptyState
                icon={Users}
                title={hasFilters ? "No matching presenters" : "No presenters yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add presenter</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.full_name || "Presenter Profile"}
        record={viewing}
        fields={fields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Add presenter"
        fields={fields}
        initialValues={{ status: "ACTIVE", years_at_station: 1 }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/presenters", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Created");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit presenter"
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Presenter/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete presenter"
        description={`Delete presenter "${deleting?.full_name || "this presenter"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Presenter/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioMediaPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production");
      setRows(prod.media || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && (r.status || "READY") !== statusFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.title?.toLowerCase().includes(q) ||
          r.program_title?.toLowerCase().includes(q) ||
          r.uploaded_by?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, typeFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || typeFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "title", label: "Title", required: true },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: MEDIA_TYPES.map((m) => ({ value: m, label: m })),
    },
    { key: "program_title", label: "Program" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["READY", "PROCESSING", "ARCHIVED", "ERROR"].map((s) => ({
        value: s,
        label: s,
      })),
    },
    { key: "file_uri", label: "File URL", required: true, fullWidth: true },
    { key: "size_mb", label: "Size (MB)", type: "number" },
    { key: "duration_seconds", label: "Duration (sec)", type: "number" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="ASSETS"
        title="Media Library"
        description="Manage uploaded audio, video, thumbnail, and document files."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E7E9EC] bg-white px-3.5 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]">
              <Upload className="h-3.5 w-3.5 text-[#047422]" />
              <span>Upload file</span>
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const up = await uploadLocalFile(file);
                  const t = file.type.startsWith("video")
                    ? "VIDEO"
                    : file.type.startsWith("image")
                      ? "IMAGE"
                      : "AUDIO";
                  await apiFetch("/api/studio/media/upload", {
                    method: "POST",
                    body: JSON.stringify({
                      title: file.name,
                      type: t,
                      file_uri: up.url,
                      size_mb: up.size_mb,
                    }),
                  });
                  toast.success("Media uploaded");
                  load();
                }}
                className="hidden"
              />
            </label>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add asset</span>
            </ToolbarButton>
          </div>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, program, uploader…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by media type"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Types</option>
                {MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by media status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">READY</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="ERROR">ERROR</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (r) => (
                  <span className="font-bold text-[#050505]">{r.title}</span>
                ),
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
                render: (r) => (
                  <span className="tabular-nums">{r.size_mb || 0} MB</span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={FolderOpen}
                title={hasFilters ? "No matching media assets" : "No media assets yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add asset</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "Media Asset"}
        record={viewing}
        fields={fields}
        extraFields={[{ key: "uploaded_by", label: "Uploaded By" }]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Add media asset"
        fields={fields}
        initialValues={{ type: "AUDIO", status: "READY", size_mb: 1 }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/media/upload", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Media asset added");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit media asset"
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/MediaAsset/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete media asset"
        description={`Delete media asset "${deleting?.title || "this file"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/MediaAsset/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}
