import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Bell,
  BarChart3,
  Loader2,
  Send,
  Disc,
  Download,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Radio,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { ROLE_LABELS } from "../../lib/rbac";
import {
  AI_KINDS,
  LANGUAGES,
  NOTIFICATION_TYPES,
} from "../../lib/constants";
import { relativeTime } from "../../lib/format";
import {
  PageHeader,
  SectionCard,
  StatCard,
  ToolbarButton,
} from "../../components/shared/Surface";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { DataTable, TablePill } from "../../components/shared/DataTable";
import { EmptyState } from "../../components/shared/EmptyState";
import { TrendChart, RankedBars } from "../../components/shared/Charts";
import {
  ConfirmDeleteDialog,
  FieldDef,
  RecordActions,
  RecordEditDialog,
  RecordViewDialog,
} from "../../components/studio/RecordActions";

const AI_STATUSES = [
  "QUEUED",
  "PROCESSING",
  "COMPLETE",
  "APPROVED",
  "REJECTED",
  "ERROR",
];

const EVENT_TYPES = [
  "APP_OPEN",
  "LIVE_PLAY",
  "EPISODE_PLAY",
  "VIDEO_PLAY",
  "NEWS_READ",
  "DOWNLOAD",
  "AD_CLICK",
];

const ITEM_TYPES = ["EPISODE", "VIDEO", "NEWS", "LIVE", "PROGRAM", "AD"];
const PLATFORMS = ["web", "mobile", "ios", "android"];
const STATION_STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE"];

export function StudioAiPage() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("SUMMARY");
  const [targetId, setTargetId] = useState("");
  const [language, setLanguage] = useState("so");
  const [running, setRunning] = useState(false);

  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production").catch(() => null);
      if (!prod) return;
      setEpisodes(prod.episodes || []);
      setJobs(prod.jobs || []);
      if (!targetId && prod.episodes?.length > 0) {
        setTargetId(prod.episodes[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (kindFilter !== "ALL" && j.kind !== kindFilter) return false;
      if (langFilter !== "ALL" && (j.language || "so") !== langFilter) return false;
      if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          j.target_title?.toLowerCase().includes(q) ||
          j.output?.toLowerCase().includes(q) ||
          j.approved_by?.toLowerCase().includes(q) ||
          j.kind?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [jobs, kindFilter, langFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) ||
    kindFilter !== "ALL" ||
    langFilter !== "ALL" ||
    statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setKindFilter("ALL");
    setLangFilter("ALL");
    setStatusFilter("ALL");
  };

  const fields: FieldDef[] = [
    {
      key: "kind",
      label: "Tool",
      type: "select",
      required: true,
      options: AI_KINDS.map((k) => ({ value: k.value, label: k.label })),
    },
    {
      key: "target_type",
      label: "Target Type",
      type: "select",
      required: true,
      options: [
        { value: "EPISODE", label: "Episode" },
        { value: "VIDEO", label: "Video" },
        { value: "NEWS", label: "News Article" },
        { value: "PROGRAM", label: "Program" },
      ],
    },
    { key: "target_id", label: "Target ID", required: true },
    { key: "target_title", label: "Target Title", required: true },
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
      options: AI_STATUSES.map((s) => ({ value: s, label: s })),
    },
    { key: "output", label: "Generated Output", type: "textarea", fullWidth: true },
    { key: "approved_by", label: "Reviewed By" },
  ];

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) {
      toast.error("Select an episode first.");
      return;
    }
    setRunning(true);
    try {
      await apiFetch("/api/studio/ai/run", {
        method: "POST",
        body: JSON.stringify({
          kind,
          target_type: "EPISODE",
          target_id: targetId,
          language,
        }),
      });
      toast.success("AI output ready — review before publishing");
      await load();
    } catch (err: any) {
      toast.error(err.message || "AI job failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI DESK"
        title="AI Tools"
        description="Draft transcripts, summaries, chapters, titles, and captions. All outputs require human approval before reaching listeners."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add AI job</span>
          </ToolbarButton>
        }
      />

      <SectionCard title="Run an AI assistant job">
        <form
          onSubmit={handleRun}
          className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Tool
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
            >
              {AI_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Episode
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
            >
              {episodes.length === 0 ? (
                <option value="">No episodes available</option>
              ) : (
                episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <ToolbarButton type="submit" disabled={running || episodes.length === 0}>
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>Run</span>
          </ToolbarButton>
        </form>
      </SectionCard>

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0F1F3] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search episode title, AI output or reviewer…"
              className="w-full rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] py-2 pl-8 pr-3 text-[12.5px] focus:border-[#047422] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All tools</option>
              {AI_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All languages</option>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All status</option>
              {AI_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] px-2.5 py-2 text-[11.5px] font-semibold text-[#6B7280] hover:bg-[#F5F6F7]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-[#9CA3AF]">
            Showing {filtered.length} of {jobs.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "target_title",
                label: "Target",
                render: (row) => (
                  <div className="max-w-[260px]">
                    <p className="truncate font-bold text-[#050505]">
                      {row.target_title || row.target_id}
                    </p>
                    <p className="truncate text-[11px] text-[#6B7280]">
                      {row.output || "No output yet"}
                    </p>
                  </div>
                ),
              },
              {
                key: "kind",
                label: "Tool",
                render: (row) => <TablePill>{row.kind}</TablePill>,
              },
              {
                key: "language",
                label: "Lang",
                render: (row) => (
                  <span className="text-[11.5px] font-bold uppercase text-[#6B7280]">
                    {row.language || "so"}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: "created_date",
                label: "Created",
                render: (row) => (
                  <span className="text-[11.5px] text-[#6B7280]">
                    {relativeTime(row.created_date)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (row) => (
                  <RecordActions
                    onView={() => setViewing(row)}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                    extra={
                      row.status === "COMPLETE" ? (
                        <>
                          <button
                            type="button"
                            title="Approve"
                            onClick={async () => {
                              await apiFetch(`/api/studio/ai/${row.id}/approve`, {
                                method: "POST",
                              });
                              toast.success("Approved and applied");
                              load();
                            }}
                            className="rounded-lg bg-[#E7F5EA] p-1.5 text-[#047422] hover:bg-[#D1F0D8]"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Reject"
                            onClick={async () => {
                              await apiFetch(`/api/studio/ai/${row.id}/reject`, {
                                method: "POST",
                              });
                              toast.success("Rejected");
                              load();
                            }}
                            className="rounded-lg bg-[#FDE7E7] p-1.5 text-[#C40D0F] hover:bg-[#FBD1D1]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : null
                    }
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(row) => setViewing(row)}
            empty={
              <EmptyState
                icon={Sparkles}
                title={hasFilters ? "No matching AI jobs" : "No AI jobs yet"}
                description={
                  hasFilters
                    ? "Try clearing your search or filters."
                    : "Upload or create an episode, then run an AI tool above."
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.target_title || viewing?.kind || "AI Job"}
        record={viewing}
        fields={fields}
        extraFields={[
          { key: "approved_at", label: "Approved At" },
          { key: "id", label: "Job ID" },
        ]}
        onClose={() => setViewing(null)}
        onEdit={() => setEditing(viewing)}
        onDelete={() => setDeleting(viewing)}
      />

      <RecordEditDialog
        open={creating}
        title="Add AI job"
        fields={fields}
        initialValues={{
          kind: "SUMMARY",
          target_type: "EPISODE",
          target_id: episodes[0]?.id || "",
          target_title: episodes[0]?.title || "",
          language: "so",
          status: "COMPLETE",
          output: "",
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/record/AiJob", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("AI job created");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title={editing ? `Edit AI job: ${editing.target_title || editing.kind}` : "Edit AI job"}
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/AiJob/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("AI job updated");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete AI job"
        description={`Delete AI job for "${deleting?.target_title || deleting?.id}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await apiFetch(`/api/studio/record/AiJob/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("AI job deleted");
          load();
        }}
      />
    </div>
  );
}

export function StudioNotificationsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: "LIVE_STARTED",
    title: "",
    body: "",
    href: "/mobile/live",
  });
  const [sending, setSending] = useState(false);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/studio/production").catch(() => null);
      if (res) setList(res.notifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return list.filter((n) => {
      if (typeFilter !== "ALL" && n.type !== typeFilter) return false;
      if (readFilter === "READ" && !n.is_read) return false;
      if (readFilter === "UNREAD" && n.is_read) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          n.title?.toLowerCase().includes(q) ||
          n.body?.toLowerCase().includes(q) ||
          n.href?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [list, typeFilter, readFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || typeFilter !== "ALL" || readFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("ALL");
    setReadFilter("ALL");
  };

  const fields: FieldDef[] = [
    {
      key: "type",
      label: "Type",
      type: "select",
      required: true,
      options: NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    { key: "title", label: "Title", required: true },
    { key: "body", label: "Message", type: "textarea", fullWidth: true },
    { key: "href", label: "Destination Path", placeholder: "/mobile/live" },
    { key: "is_read", label: "Mark as read", type: "checkbox" },
  ];

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSending(true);
    try {
      await apiFetch("/api/studio/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Notification broadcast to listeners");
      setForm({ ...form, title: "", body: "" });
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AUDIENCE"
        title="Notifications"
        description="Send in-app broadcast alerts to listeners and manage notification records."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New alert</span>
          </ToolbarButton>
        }
      />

      <SectionCard title="Compose broadcast alert">
        <form
          onSubmit={send}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
            >
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Title <span className="text-[#C40D0F]">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Subaxnimo is live now"
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Opens
            </label>
            <input
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
          <ToolbarButton type="submit" disabled={sending}>
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Broadcast alert</span>
          </ToolbarButton>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Message
            </label>
            <input
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Tune in live on Radio Hargeysa Studio 1…"
              className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
            />
          </div>
        </form>
      </SectionCard>

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0F1F3] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notification title, body or target link…"
              className="w-full rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] py-2 pl-8 pr-3 text-[12.5px] focus:border-[#047422] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All types</option>
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All states</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] px-2.5 py-2 text-[11.5px] font-semibold text-[#6B7280] hover:bg-[#F5F6F7]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-[#9CA3AF]">
            Showing {filtered.length} of {list.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "title",
                label: "Notification",
                render: (row) => (
                  <div className="max-w-[300px]">
                    <p className="truncate font-bold text-[#050505]">{row.title}</p>
                    <p className="truncate text-[11px] text-[#6B7280]">
                      {row.body || row.href}
                    </p>
                  </div>
                ),
              },
              {
                key: "type",
                label: "Type",
                render: (row) => <TablePill>{row.type}</TablePill>,
              },
              {
                key: "href",
                label: "Link",
                render: (row) => (
                  <span className="font-mono text-[11px] text-[#6B7280]">
                    {row.href || "/mobile/home"}
                  </span>
                ),
              },
              {
                key: "is_read",
                label: "State",
                render: (row) => (
                  <StatusBadge status={row.is_read ? "READ" : "ACTIVE"} />
                ),
              },
              {
                key: "created_date",
                label: "Sent",
                render: (row) => (
                  <span className="text-[11.5px] text-[#6B7280]">
                    {relativeTime(row.created_date)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (row) => (
                  <RecordActions
                    onView={() => setViewing(row)}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(row) => setViewing(row)}
            empty={
              <EmptyState
                icon={Bell}
                title={hasFilters ? "No matching notifications" : "No alerts sent yet"}
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || "Notification"}
        record={viewing}
        fields={fields}
        extraFields={[{ key: "id", label: "Notification ID" }]}
        onClose={() => setViewing(null)}
        onEdit={() => setEditing(viewing)}
        onDelete={() => setDeleting(viewing)}
      />

      <RecordEditDialog
        open={creating}
        title="New notification record"
        fields={fields}
        initialValues={{
          type: "LIVE_STARTED",
          title: "",
          body: "",
          href: "/mobile/live",
          is_read: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/record/Notification", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Notification created");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title={editing ? `Edit: ${editing.title}` : "Edit notification"}
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Notification/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Notification updated");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete notification"
        description={`Delete notification "${deleting?.title}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await apiFetch(`/api/studio/record/Notification/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("Notification deleted");
          load();
        }}
      />
    </div>
  );
}

export function StudioAnalyticsPage() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Episode breakdown filters & CRUD
  const [epQuery, setEpQuery] = useState("");
  const [epProgramFilter, setEpProgramFilter] = useState("ALL");
  const [viewingEp, setViewingEp] = useState<any | null>(null);
  const [editingEp, setEditingEp] = useState<any | null>(null);
  const [deletingEp, setDeletingEp] = useState<any | null>(null);

  // Analytics events filters & CRUD
  const [evQuery, setEvQuery] = useState("");
  const [evTypeFilter, setEvTypeFilter] = useState("ALL");
  const [evItemFilter, setEvItemFilter] = useState("ALL");
  const [evPlatformFilter, setEvPlatformFilter] = useState("ALL");
  const [creatingEv, setCreatingEv] = useState(false);
  const [viewingEv, setViewingEv] = useState<any | null>(null);
  const [editingEv, setEditingEv] = useState<any | null>(null);
  const [deletingEv, setDeletingEv] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/api/studio/analytics?days=${days}`).catch(
        () => null
      );
      if (res) setData(res);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals || {};
  const topEpisodes: any[] = data?.topEpisodes || [];
  const events: any[] = data?.events || [];

  const programNames = useMemo(
    () =>
      Array.from(
        new Set(topEpisodes.map((e) => e.program_title).filter(Boolean))
      ) as string[],
    [topEpisodes]
  );

  const filteredEpisodes = useMemo(() => {
    return topEpisodes.filter((ep) => {
      if (epProgramFilter !== "ALL" && ep.program_title !== epProgramFilter) {
        return false;
      }
      if (epQuery.trim()) {
        const q = epQuery.trim().toLowerCase();
        const hit =
          ep.title?.toLowerCase().includes(q) ||
          ep.program_title?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [topEpisodes, epProgramFilter, epQuery]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (evTypeFilter !== "ALL" && ev.event_type !== evTypeFilter) return false;
      if (evItemFilter !== "ALL" && ev.item_type !== evItemFilter) return false;
      if (evPlatformFilter !== "ALL" && (ev.platform || "web") !== evPlatformFilter) {
        return false;
      }
      if (evQuery.trim()) {
        const q = evQuery.trim().toLowerCase();
        const hit =
          ev.label?.toLowerCase().includes(q) ||
          ev.item_id?.toLowerCase().includes(q) ||
          ev.event_type?.toLowerCase().includes(q) ||
          ev.platform?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [events, evTypeFilter, evItemFilter, evPlatformFilter, evQuery]);

  const hasEpFilters = Boolean(epQuery.trim()) || epProgramFilter !== "ALL";
  const hasEvFilters =
    Boolean(evQuery.trim()) ||
    evTypeFilter !== "ALL" ||
    evItemFilter !== "ALL" ||
    evPlatformFilter !== "ALL";

  const eventFields: FieldDef[] = [
    {
      key: "event_type",
      label: "Event Type",
      type: "select",
      required: true,
      options: EVENT_TYPES.map((t) => ({ value: t, label: t })),
    },
    {
      key: "item_type",
      label: "Item Type",
      type: "select",
      options: ITEM_TYPES.map((t) => ({ value: t, label: t })),
    },
    { key: "item_id", label: "Item ID" },
    { key: "label", label: "Label / Description" },
    { key: "duration_seconds", label: "Duration (sec)", type: "number" },
    {
      key: "platform",
      label: "Platform",
      type: "select",
      options: PLATFORMS.map((p) => ({ value: p, label: p.toUpperCase() })),
    },
  ];

  const episodeEditFields: FieldDef[] = [
    { key: "title", label: "Title", required: true },
    { key: "program_title", label: "Program" },
    { key: "play_count", label: "Plays", type: "number" },
    { key: "download_count", label: "Downloads", type: "number" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="INSIGHTS"
        title="Studio analytics"
        description="Listening telemetry, top performing episodes, and raw event tracking."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {[7, 14, 30].map((d) => (
              <ToolbarButton
                key={d}
                variant={days === d ? "primary" : "outline"}
                onClick={() => setDays(d)}
              >
                {d}d
              </ToolbarButton>
            ))}
            <ToolbarButton onClick={() => setCreatingEv(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Log event</span>
            </ToolbarButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="PLAYS"
          value={totals.plays || 0}
          icon={BarChart3}
          tone="brand"
        />
        <StatCard label="DOWNLOADS" value={totals.downloads || 0} icon={Download} />
        <StatCard label="EPISODES" value={totals.episodesCount || 0} icon={Disc} />
        <StatCard label="AI APPROVED" value={totals.aiApproved || 0} icon={Sparkles} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Plays per day">
          <TrendChart data={data?.series || []} dataKey="plays" />
        </SectionCard>
        <SectionCard title="Top episodes">
          <RankedBars
            data={topEpisodes.map((e: any) => ({
              title: e.title,
              value: e.play_count || 0,
            }))}
          />
        </SectionCard>
      </div>

      <SectionCard title="Top episode breakdown" padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0F1F3] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={epQuery}
              onChange={(e) => setEpQuery(e.target.value)}
              placeholder="Filter episodes or programs…"
              className="w-full rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] py-2 pl-8 pr-3 text-[12.5px] focus:border-[#047422] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <select
              value={epProgramFilter}
              onChange={(e) => setEpProgramFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All programs</option>
              {programNames.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {hasEpFilters && (
              <button
                type="button"
                onClick={() => {
                  setEpQuery("");
                  setEpProgramFilter("ALL");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] px-2.5 py-2 text-[11.5px] font-semibold text-[#6B7280] hover:bg-[#F5F6F7]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-[#9CA3AF]">
            Showing {filteredEpisodes.length} of {topEpisodes.length}
          </span>
        </div>
        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              { key: "title", label: "Episode" },
              { key: "program_title", label: "Program" },
              {
                key: "play_count",
                label: "Plays",
                align: "right",
                render: (row) => (
                  <span className="font-bold tabular-nums">{row.play_count || 0}</span>
                ),
              },
              {
                key: "download_count",
                label: "Downloads",
                align: "right",
                render: (row) => (
                  <span className="font-bold tabular-nums">{row.download_count || 0}</span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (row) => (
                  <RecordActions
                    onView={() => setViewingEp(row)}
                    onEdit={() => setEditingEp(row)}
                    onDelete={() => setDeletingEp(row)}
                  />
                ),
              },
            ]}
            rows={filteredEpisodes}
            onRowClick={(row) => setViewingEp(row)}
            empty={<EmptyState icon={Disc} title="No episode plays yet" />}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Analytics events log"
        description="Filterable listener interaction events"
        padded={false}
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0F1F3] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={evQuery}
              onChange={(e) => setEvQuery(e.target.value)}
              placeholder="Search event label, item ID or platform…"
              className="w-full rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] py-2 pl-8 pr-3 text-[12.5px] focus:border-[#047422] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <select
              value={evTypeFilter}
              onChange={(e) => setEvTypeFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All events</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={evItemFilter}
              onChange={(e) => setEvItemFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All targets</option>
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={evPlatformFilter}
              onChange={(e) => setEvPlatformFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
            {hasEvFilters && (
              <button
                type="button"
                onClick={() => {
                  setEvQuery("");
                  setEvTypeFilter("ALL");
                  setEvItemFilter("ALL");
                  setEvPlatformFilter("ALL");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] px-2.5 py-2 text-[11.5px] font-semibold text-[#6B7280] hover:bg-[#F5F6F7]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-[#9CA3AF]">
            Showing {filteredEvents.length} of {events.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "event_type",
                label: "Event",
                render: (row) => <TablePill>{row.event_type}</TablePill>,
              },
              {
                key: "label",
                label: "Target / Label",
                render: (row) => (
                  <div>
                    <p className="font-semibold text-[#050505]">
                      {row.label || row.item_id || "—"}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {row.item_type || "GENERAL"}
                    </p>
                  </div>
                ),
              },
              {
                key: "platform",
                label: "Platform",
                render: (row) => (
                  <span className="text-[11.5px] font-bold uppercase text-[#6B7280]">
                    {row.platform || "web"}
                  </span>
                ),
              },
              {
                key: "duration_seconds",
                label: "Duration",
                align: "right",
                render: (row) => (
                  <span className="tabular-nums text-[12px] text-[#374151]">
                    {row.duration_seconds ? `${row.duration_seconds}s` : "—"}
                  </span>
                ),
              },
              {
                key: "created_date",
                label: "Time",
                render: (row) => (
                  <span className="text-[11.5px] text-[#6B7280]">
                    {relativeTime(row.created_date)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (row) => (
                  <RecordActions
                    onView={() => setViewingEv(row)}
                    onEdit={() => setEditingEv(row)}
                    onDelete={() => setDeletingEv(row)}
                  />
                ),
              },
            ]}
            rows={filteredEvents}
            onRowClick={(row) => setViewingEv(row)}
            empty={
              <EmptyState
                icon={Activity}
                title={hasEvFilters ? "No matching events" : "No analytics events yet"}
              />
            }
          />
        </div>
      </SectionCard>

      {/* Episode dialogs */}
      <RecordViewDialog
        open={Boolean(viewingEp)}
        title={viewingEp?.title || "Episode stats"}
        record={viewingEp}
        fields={episodeEditFields}
        extraFields={[{ key: "id", label: "Episode ID" }]}
        onClose={() => setViewingEp(null)}
        onEdit={() => setEditingEp(viewingEp)}
        onDelete={() => setDeletingEp(viewingEp)}
      />

      <RecordEditDialog
        open={Boolean(editingEp)}
        title={editingEp ? `Edit: ${editingEp.title}` : "Edit episode"}
        fields={episodeEditFields}
        initialValues={editingEp || {}}
        onClose={() => setEditingEp(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Episode/${editingEp.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Episode metrics updated");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingEp)}
        title="Delete episode"
        description={`Delete episode "${deletingEp?.title}"?`}
        onClose={() => setDeletingEp(null)}
        onConfirm={async () => {
          if (!deletingEp) return;
          await apiFetch(`/api/studio/record/Episode/${deletingEp.id}`, {
            method: "DELETE",
          });
          toast.success("Episode deleted");
          load();
        }}
      />

      {/* AnalyticsEvent dialogs */}
      <RecordViewDialog
        open={Boolean(viewingEv)}
        title={viewingEv?.event_type || "Analytics Event"}
        record={viewingEv}
        fields={eventFields}
        extraFields={[{ key: "id", label: "Event ID" }]}
        onClose={() => setViewingEv(null)}
        onEdit={() => setEditingEv(viewingEv)}
        onDelete={() => setDeletingEv(viewingEv)}
      />

      <RecordEditDialog
        open={creatingEv}
        title="Log analytics event"
        fields={eventFields}
        initialValues={{
          event_type: "EPISODE_PLAY",
          item_type: "EPISODE",
          platform: "web",
          duration_seconds: 60,
        }}
        onClose={() => setCreatingEv(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/record/AnalyticsEvent", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Analytics event logged");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editingEv)}
        title={editingEv ? `Edit event: ${editingEv.event_type}` : "Edit event"}
        fields={eventFields}
        initialValues={editingEv || {}}
        onClose={() => setEditingEv(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/AnalyticsEvent/${editingEv.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Analytics event updated");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingEv)}
        title="Delete analytics event"
        description={`Delete event "${deletingEv?.event_type}"?`}
        onClose={() => setDeletingEv(null)}
        onConfirm={async () => {
          if (!deletingEv) return;
          await apiFetch(`/api/studio/record/AnalyticsEvent/${deletingEv.id}`, {
            method: "DELETE",
          });
          toast.success("Analytics event deleted");
          load();
        }}
      />
    </div>
  );
}

export function StudioSettingsPage() {
  const { user, role } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrimary, setSavingPrimary] = useState(false);

  const [stationName, setStationName] = useState("Radio Hargeysa");
  const [studioName, setStudioName] = useState("Studio 1");
  const [city, setCity] = useState("Hargeisa");
  const [tagline, setTagline] = useState("Codka Jamhuuriyadda Somaliland");
  const [defaultBitrate, setDefaultBitrate] = useState("64");
  const [autoNotifyLive, setAutoNotifyLive] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [primaryFilter, setPrimaryFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const loadStations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>("/api/studio/record/Station").catch(
        () => []
      );
      setStations(list);
      const primary = list.find((s) => s.is_primary) || list[0];
      if (primary) {
        setStationName(primary.name || "Radio Hargeysa");
        setStudioName(primary.studio_name || "Studio 1");
        setCity(primary.city || "Hargeisa");
        setTagline(primary.tagline || "Codka Jamhuuriyadda Somaliland");
        if (primary.features?.auto_notify_live !== undefined) {
          setAutoNotifyLive(Boolean(primary.features.auto_notify_live));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const primaryStation = useMemo(
    () => stations.find((s) => s.is_primary) || stations[0] || null,
    [stations]
  );

  const filtered = useMemo(() => {
    return stations.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (primaryFilter === "PRIMARY" && !s.is_primary) return false;
      if (primaryFilter === "SECONDARY" && s.is_primary) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          s.name?.toLowerCase().includes(q) ||
          s.studio_name?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.tagline?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [stations, statusFilter, primaryFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || statusFilter !== "ALL" || primaryFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setPrimaryFilter("ALL");
  };

  const fields: FieldDef[] = [
    { key: "name", label: "Station Name", required: true },
    { key: "studio_name", label: "Studio Name", required: true },
    { key: "tagline", label: "Tagline" },
    { key: "city", label: "City", required: true },
    { key: "country", label: "Country" },
    { key: "brand_color", label: "Brand Color", placeholder: "#047422" },
    { key: "founded_year", label: "Founded Year", type: "number" },
    { key: "logo_url", label: "Station Logo", type: "image" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: STATION_STATUSES.map((s) => ({ value: s, label: s })),
    },
    { key: "is_primary", label: "Primary Broadcast Station", type: "checkbox" },
    { key: "description", label: "Description", type: "textarea", fullWidth: true },
  ];

  const handleSavePrimary = async () => {
    setSavingPrimary(true);
    try {
      if (primaryStation) {
        await apiFetch(`/api/studio/record/Station/${primaryStation.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: stationName,
            studio_name: studioName,
            city,
            tagline,
            features: {
              ...(primaryStation.features || {}),
              auto_notify_live: autoNotifyLive,
              default_bitrate: Number(defaultBitrate),
            },
          }),
        });
      } else {
        await apiFetch("/api/studio/record/Station", {
          method: "POST",
          body: JSON.stringify({
            name: stationName,
            studio_name: studioName,
            city,
            tagline,
            is_primary: true,
            status: "ACTIVE",
            features: {
              auto_notify_live: autoNotifyLive,
              default_bitrate: Number(defaultBitrate),
            },
          }),
        });
      }
      toast.success("Studio settings saved");
      loadStations();
    } catch (err: any) {
      toast.error(err.message || "Could not save studio settings");
    } finally {
      setSavingPrimary(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CONFIGURE"
        title="Studio settings"
        description="Manage primary studio configuration and station broadcast profiles."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add studio profile</span>
          </ToolbarButton>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="Studio profile" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Station name
              </label>
              <input
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Studio name
              </label>
              <input
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                City
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Tagline
              </label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Default stream bitrate (kbps)
              </label>
              <select
                value={defaultBitrate}
                onChange={(e) => setDefaultBitrate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
              >
                <option value="32">32 kbps</option>
                <option value="64">64 kbps</option>
                <option value="128">128 kbps</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={autoNotifyLive}
                  onChange={(e) => setAutoNotifyLive(e.target.checked)}
                  className="h-4 w-4 accent-[#047422]"
                />
                <span>Notify listeners automatically when Studio goes live</span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <ToolbarButton onClick={handleSavePrimary} disabled={savingPrimary}>
              {savingPrimary && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save settings</span>
            </ToolbarButton>
          </div>
        </SectionCard>

        <SectionCard title="Signed in as">
          <p className="text-[14px] font-extrabold text-[#050505]">
            {user?.full_name || "Staff member"}
          </p>
          <p className="mt-0.5 text-[12px] text-[#6B7280]">{user?.email}</p>
          <p className="mt-3 inline-block rounded-full bg-[#E7F5EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#047422]">
            {ROLE_LABELS[role]}
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Station & studio profiles"
        description="Configured broadcast desks and regional studios"
        padded={false}
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0F1F3] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search station, studio name, city or tagline…"
              className="w-full rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] py-2 pl-8 pr-3 text-[12.5px] focus:border-[#047422] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All status</option>
              {STATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={primaryFilter}
              onChange={(e) => setPrimaryFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <option value="ALL">All desks</option>
              <option value="PRIMARY">Primary station</option>
              <option value="SECONDARY">Secondary desk</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] px-2.5 py-2 text-[11.5px] font-semibold text-[#6B7280] hover:bg-[#F5F6F7]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-[#9CA3AF]">
            Showing {filtered.length} of {stations.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "name",
                label: "Station",
                render: (row) => (
                  <div>
                    <p className="font-bold text-[#050505]">{row.name}</p>
                    <p className="text-[11px] text-[#6B7280]">{row.tagline}</p>
                  </div>
                ),
              },
              { key: "studio_name", label: "Studio" },
              {
                key: "city",
                label: "Location",
                render: (row) => (
                  <span className="text-[12px] text-[#374151]">
                    {row.city}, {row.country || "Somaliland"}
                  </span>
                ),
              },
              {
                key: "is_primary",
                label: "Role",
                render: (row) => (
                  <TablePill tone={row.is_primary ? "brand" : "neutral"}>
                    {row.is_primary ? "PRIMARY" : "STUDIO DESK"}
                  </TablePill>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge status={row.status || "ACTIVE"} />,
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (row) => (
                  <RecordActions
                    onView={() => setViewing(row)}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(row) => setViewing(row)}
            empty={
              <EmptyState
                icon={Radio}
                title={hasFilters ? "No matching studio profiles" : "No studio profiles configured"}
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.name || "Studio Profile"}
        record={viewing}
        fields={fields}
        extraFields={[{ key: "id", label: "Station ID" }]}
        onClose={() => setViewing(null)}
        onEdit={() => setEditing(viewing)}
        onDelete={() => setDeleting(viewing)}
      />

      <RecordEditDialog
        open={creating}
        title="Add studio profile"
        fields={fields}
        initialValues={{
          name: "Radio Hargeysa Regional",
          studio_name: "Studio 2",
          city: "Berbera",
          country: "Somaliland",
          brand_color: "#047422",
          founded_year: 1942,
          status: "ACTIVE",
          is_primary: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/record/Station", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Studio profile created");
          loadStations();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title={editing ? `Edit: ${editing.name}` : "Edit studio profile"}
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Station/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Studio profile updated");
          loadStations();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete studio profile"
        description={`Delete studio profile "${deleting?.name}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await apiFetch(`/api/studio/record/Station/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("Studio profile deleted");
          loadStations();
        }}
      />
    </div>
  );
}
