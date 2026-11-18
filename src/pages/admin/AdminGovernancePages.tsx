import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Search,
  UserPlus,
  Megaphone,
  ScrollText,
  BarChart3,
  Download,
  PlayCircle,
  Smartphone,
  Plus,
  Filter,
  RotateCcw,
  Bell,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import {
  ALL_ROLES,
  STAFF_ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  resolveRole,
} from "../../lib/rbac";
import {
  AD_PLACEMENTS,
  AI_KINDS,
  LANGUAGES,
  NOTIFICATION_TYPES,
} from "../../lib/constants";
import { initials, relativeTime } from "../../lib/format";
import {
  PageHeader,
  SectionCard,
  StatCard,
  ToolbarButton,
} from "../../components/shared/Surface";
import { DataTable, TablePill } from "../../components/shared/DataTable";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { ImageUploadField } from "../../components/shared/ImageUploadField";
import { TrendChart, RankedBars } from "../../components/shared/Charts";
import {
  ConfirmDeleteDialog,
  RecordActions,
  RecordEditDialog,
  RecordViewDialog,
  type FieldDef,
} from "../../components/studio/RecordActions";

/* -------------------------------------------------------------------------- */
/* 1. AI Operations (/admin/ai)                                               */
/* -------------------------------------------------------------------------- */

export function AdminAiPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");

  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>("/api/admin/entities/AiJob");
      setJobs(list);
    } catch {
      const res = await apiFetch<any>("/api/studio/production").catch(() => ({ jobs: [] }));
      setJobs(res.jobs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (kindFilter !== "ALL" && j.kind !== kindFilter) return false;
      if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
      if (langFilter !== "ALL" && (j.language || "so") !== langFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          j.target_title?.toLowerCase().includes(q) ||
          j.kind?.toLowerCase().includes(q) ||
          j.output?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [jobs, kindFilter, statusFilter, langFilter, query]);

  const hasFilters =
    Boolean(query.trim()) ||
    kindFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    langFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setKindFilter("ALL");
    setStatusFilter("ALL");
    setLangFilter("ALL");
  };

  const awaiting = jobs.filter((j) => j.status === "COMPLETE").length;
  const approved = jobs.filter((j) => j.status === "APPROVED").length;
  const failed = jobs.filter((j) => j.status === "ERROR").length;

  const fields: FieldDef[] = [
    {
      key: "kind",
      label: "AI Task Kind",
      type: "select",
      required: true,
      options: AI_KINDS.map((k) => ({ value: k.value, label: k.label })),
    },
    {
      key: "target_type",
      label: "Target Type",
      type: "select",
      required: true,
      options: ["EPISODE", "RECORDING", "VIDEO", "NEWS"].map((v) => ({
        value: v,
        label: v,
      })),
    },
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
      options: ["QUEUED", "PROCESSING", "COMPLETE", "APPROVED", "REJECTED", "ERROR"].map(
        (s) => ({ value: s, label: s })
      ),
    },
    { key: "target_id", label: "Target Record ID", placeholder: "Optional ID" },
    { key: "output", label: "Generated Output", type: "textarea", fullWidth: true },
  ];

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/entities/AiJob/${id}`, { method: "DELETE" });
      toast.success("AI job deleted");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete AI job");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="OPERATIONS"
        title="AI Operations"
        description="Oversee Studio AI Desk jobs, filter outputs, and enforce human approval before publication."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New AI job</span>
          </ToolbarButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="AWAITING APPROVAL" value={awaiting} icon={Sparkles} tone="brand" />
        <StatCard label="APPROVED" value={approved} icon={Check} />
        <StatCard label="FAILED" value={failed} icon={X} tone="live" />
      </div>

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search target or output…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                aria-label="Filter by kind"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
              >
                <option value="ALL">All Kinds</option>
                {AI_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Statuses</option>
              {["QUEUED", "PROCESSING", "COMPLETE", "APPROVED", "REJECTED", "ERROR"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>

            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              aria-label="Filter by language"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
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
            Showing {filtered.length} of {jobs.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "kind",
                label: "Kind",
                render: (r) => <TablePill tone="brand">{r.kind}</TablePill>,
              },
              {
                key: "target_title",
                label: "Target",
                render: (r) => (
                  <div>
                    <p className="font-bold text-[#050505]">{r.target_title}</p>
                    <p className="text-[11px] text-[#6B7280]">{r.target_type || "EPISODE"}</p>
                  </div>
                ),
              },
              {
                key: "language",
                label: "Language",
                render: (r) => (r.language || "so").toUpperCase(),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "created_date",
                label: "Created",
                render: (r) => relativeTime(r.created_date),
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
                    extra={
                      r.status === "COMPLETE" ? (
                        <div className="mr-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/studio/ai/${r.id}/approve`, {
                                  method: "POST",
                                });
                                toast.success("Approved and applied");
                                load();
                              } catch (err: any) {
                                toast.error(err.message || "Could not approve AI job");
                              }
                            }}
                            className="rounded-lg bg-[#047422] px-2 py-1 text-[10.5px] font-bold text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/studio/ai/${r.id}/reject`, {
                                  method: "POST",
                                });
                                toast.success("Rejected");
                                load();
                              } catch (err: any) {
                                toast.error(err.message || "Could not reject AI job");
                              }
                            }}
                            className="rounded-lg bg-[#FDE7E7] px-2 py-1 text-[10.5px] font-bold text-[#C40D0F]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null
                    }
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Sparkles}
                title={hasFilters ? "No matching AI jobs" : "No AI jobs queued yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New AI job</span>
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
        title={viewing ? `${viewing.kind} · ${viewing.target_title}` : "AI Job Details"}
        record={viewing}
        fields={fields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? "Edit AI job" : "Create AI job"}
        fields={fields}
        initialValues={
          editing || {
            kind: "SUMMARY",
            target_type: "EPISODE",
            language: "so",
            status: "COMPLETE",
          }
        }
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          if (editing) {
            await apiFetch(`/api/admin/entities/AiJob/${editing.id}`, {
              method: "PATCH",
              body: JSON.stringify(vals),
            });
            toast.success("AI job updated");
          } else {
            await apiFetch("/api/admin/entities/AiJob", {
              method: "POST",
              body: JSON.stringify(vals),
            });
            toast.success("AI job created");
          }
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete AI job"
        description={`Delete AI job for "${deleting?.target_title || "this item"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) await handleDelete(deleting.id);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Users (/admin/users)                                                    */
/* -------------------------------------------------------------------------- */

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    staff_role: "PRODUCER",
    station_id: "",
  });

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, st] = await Promise.all([
        apiFetch<any[]>("/api/admin/users").catch(() => []),
        apiFetch<any[]>("/api/admin/entities/Station").catch(() => []),
      ]);
      setUsers(u);
      setStations(st);
      if (st[0]?.id) {
        setInviteForm((f) => (f.station_id ? f : { ...f, station_id: st[0].id }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const r = resolveRole(u);
      if (roleFilter !== "ALL" && r !== roleFilter) return false;
      if (statusFilter !== "ALL" && (u.account_status || "ACTIVE") !== statusFilter)
        return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          u.email?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || roleFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/invitations", {
        method: "POST",
        body: JSON.stringify(inviteForm),
      });
      toast.success("Invitation sent");
      setInviteOpen(false);
      setInviteForm({ ...inviteForm, email: "" });
    } catch (err: any) {
      toast.error(err.message || "Could not invite staff");
    }
  };

  const userFields: FieldDef[] = [
    { key: "full_name", label: "Full Name", required: true },
    { key: "email", label: "Email Address", required: true },
    { key: "phone", label: "Phone Number", placeholder: "+252 63 …" },
    {
      key: "staff_role",
      label: "Staff Role (leave blank for Listener)",
      type: "select",
      options: STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
    },
    {
      key: "account_status",
      label: "Account Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "ACTIVE" },
        { value: "SUSPENDED", label: "SUSPENDED" },
      ],
    },
    {
      key: "station_id",
      label: "Assigned Station",
      type: "select",
      options: stations.map((s) => ({ value: s.id, label: s.name })),
    },
    ...(creating
      ? [
          {
            key: "password",
            label: "Initial Password",
            placeholder: "Default: RadioHargeysa@2026",
            fullWidth: true,
          },
        ]
      : []),
  ];

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      toast.success("User deleted");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete user");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="PEOPLE"
        title="Users"
        description="Manage staff roles, listener accounts, station assignments, and invitations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton variant="outline" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite staff</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add user</span>
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
                placeholder="Search name, email, phone…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
              >
                <option value="ALL">All Roles</option>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by account status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
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
            Showing {filtered.length} of {users.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "person",
                label: "Person",
                render: (u) => (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E7F5EA] text-[10.5px] font-extrabold text-[#047422]">
                      {initials(u.full_name, u.email)}
                    </div>
                    <div>
                      <p className="font-bold text-[#050505]">{u.full_name || "User"}</p>
                      <p className="text-[11px] text-[#6B7280]">{u.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "staff_role",
                label: "Staff role",
                render: (u) => {
                  const currentRole = resolveRole(u);
                  return (
                    <select
                      value={currentRole === "USER" ? "" : currentRole}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        try {
                          await apiFetch(`/api/admin/users/${u.id}/access`, {
                            method: "POST",
                            body: JSON.stringify({
                              staff_role: e.target.value || null,
                            }),
                          });
                          toast.success("Role updated");
                          load();
                        } catch (err: any) {
                          toast.error(err.message);
                        }
                      }}
                      className="rounded-lg border border-[#E7E9EC] bg-white px-2.5 py-1 text-[11.5px] font-bold"
                    >
                      <option value="">Listener</option>
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  );
                },
              },
              {
                key: "account_status",
                label: "Account",
                render: (u) => (
                  <select
                    value={u.account_status || "ACTIVE"}
                    onClick={(e) => e.stopPropagation()}
                    onChange={async (e) => {
                      try {
                        await apiFetch(`/api/admin/users/${u.id}/access`, {
                          method: "POST",
                          body: JSON.stringify({
                            account_status: e.target.value,
                          }),
                        });
                        toast.success("Status updated");
                        load();
                      } catch (err: any) {
                        toast.error(err.message || "Could not update account status");
                      }
                    }}
                    className="rounded-lg border border-[#E7E9EC] bg-white px-2.5 py-1 text-[11.5px] font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                ),
              },
              {
                key: "last_active_at",
                label: "Last active",
                render: (u) => relativeTime(u.last_active_at || u.created_date),
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (u) => (
                  <RecordActions
                    onView={() => setViewing(u)}
                    onEdit={() => setEditing(u)}
                    onDelete={() => setDeleting(u)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(u) => setViewing(u)}
            empty={
              <EmptyState
                icon={UserPlus}
                title={hasFilters ? "No matching users" : "No users found"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add user</span>
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
        title={viewing?.full_name || viewing?.email || "User Details"}
        record={viewing}
        extraFields={[
          { key: "full_name", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          {
            key: "staff_role",
            label: "Effective Role",
            format: (_v, rec) => ROLE_LABELS[resolveRole(rec)],
          },
          { key: "account_status", label: "Account Status" },
          { key: "verified", label: "Email Verified" },
          {
            key: "last_active_at",
            label: "Last Active",
            format: (v, rec) => relativeTime(v || rec.created_date),
          },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? `Edit ${editing.full_name || editing.email}` : "Add new user"}
        fields={userFields}
        initialValues={
          editing || {
            account_status: "ACTIVE",
            station_id: stations[0]?.id || "",
          }
        }
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          if (editing) {
            await apiFetch(`/api/admin/users/${editing.id}`, {
              method: "PATCH",
              body: JSON.stringify({
                ...vals,
                staff_role: vals.staff_role || null,
              }),
            });
            toast.success("User updated");
          } else {
            await apiFetch("/api/admin/users", {
              method: "POST",
              body: JSON.stringify({
                ...vals,
                staff_role: vals.staff_role || null,
              }),
            });
            toast.success("User created");
          }
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete user account"
        description={`Permanently delete user "${deleting?.full_name || deleting?.email || "this account"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) await handleDelete(deleting.id);
        }}
      />

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
              <h3 className="text-[16px] font-extrabold">Invite a staff member</h3>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="p-1 text-[#6B7280]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={sendInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Email <span className="text-[#C40D0F]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  placeholder="name@radiohargeysa.so"
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Staff role
                </label>
                <select
                  value={inviteForm.staff_role}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, staff_role: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Station
                </label>
                <select
                  value={inviteForm.station_id}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, station_id: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ToolbarButton
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </ToolbarButton>
                <ToolbarButton type="submit">Send invitation</ToolbarButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Roles & Permissions (/admin/roles)                                      */
/* -------------------------------------------------------------------------- */

const PERM_COLS = [
  { key: "content.write", label: "Edit content" },
  { key: "content.publish", label: "Publish" },
  { key: "broadcast.control", label: "Live control" },
  { key: "broadcast.emergency", label: "Emergency" },
  { key: "ai.run", label: "AI run" },
  { key: "ai.approve", label: "AI approve" },
  { key: "streams.manage", label: "Streams" },
  { key: "users.manage", label: "Users & roles" },
  { key: "audit.read", label: "Audit logs" },
];

export function AdminRolesPage() {
  const [station, setStation] = useState<any>(null);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await apiFetch<any[]>("/api/admin/entities/Station");
      const primary = list.find((s) => s.is_primary) || list[0];
      if (primary) {
        setStation(primary);
        setCustomRoles(
          Array.isArray(primary.features?.custom_roles)
            ? primary.features.custom_roles
            : []
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleOverrides: Record<string, string[]> =
    station?.features?.role_overrides || {};

  const rows = useMemo(() => {
    const core = ALL_ROLES.map((r) => {
      const perms = roleOverrides[r] || PERMISSIONS[r] || [];
      return {
        id: r,
        key: r,
        label: ROLE_LABELS[r],
        kind: "CORE",
        description:
          r === "SUPER_ADMIN"
            ? "Unrestricted platform access across Admin, Studio, and Network."
            : r === "ADMIN"
              ? "Full station governance, users, ads, and catalog management."
              : r === "USER"
                ? "Public listener account with mobile playback and favorites."
                : "Studio & editorial operations role.",
        permissions: perms,
      };
    });
    const custom = customRoles.map((cr: any) => ({
      ...cr,
      kind: "CUSTOM",
    }));
    return [...core, ...custom];
  }, [customRoles, roleOverrides]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (scopeFilter === "CORE" && r.kind !== "CORE") return false;
      if (scopeFilter === "CUSTOM" && r.kind !== "CUSTOM") return false;
      if (
        scopeFilter !== "ALL" &&
        scopeFilter !== "CORE" &&
        scopeFilter !== "CUSTOM"
      ) {
        const has =
          r.permissions.includes("*") || r.permissions.includes(scopeFilter);
        if (!has) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.label?.toLowerCase().includes(q) ||
          r.key?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, scopeFilter, query]);

  const hasFilters = Boolean(query.trim()) || scopeFilter !== "ALL";

  const persistStationFeatures = async (nextFeatures: Record<string, any>) => {
    if (!station?.id) return;
    await apiFetch("/api/admin/stations/save", {
      method: "POST",
      body: JSON.stringify({
        id: station.id,
        features: nextFeatures,
      }),
    });
    await load();
  };

  const roleFields: FieldDef[] = [
    { key: "label", label: "Role Name", required: true, placeholder: "Senior Producer" },
    { key: "key", label: "Role Code", required: true, placeholder: "SENIOR_PRODUCER" },
    {
      key: "permissions",
      label: "Permissions (comma separated, e.g. content.write, content.publish, ai.run)",
      isArray: true,
      fullWidth: true,
    },
    { key: "description", label: "Description", type: "textarea", fullWidth: true },
  ];

  const hasPerm = (perms: string[], perm: string) =>
    perms.includes("*") || perms.includes(perm);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="GOVERNANCE"
        title="Roles & Permissions"
        description="Filter system RBAC roles, inspect granted capabilities, and manage custom role policies."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New role policy</span>
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
                placeholder="Search role or description…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                aria-label="Filter by role scope or capability"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
              >
                <option value="ALL">All Roles &amp; Capabilities</option>
                <option value="CORE">Core System Roles</option>
                <option value="CUSTOM">Custom Role Policies</option>
                {PERM_COLS.map((c) => (
                  <option key={c.key} value={c.key}>
                    Can: {c.label}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setScopeFilter("ALL");
                }}
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
            columns={[
              {
                key: "label",
                label: "Role",
                render: (r) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#050505]">{r.label}</span>
                      <TablePill tone={r.kind === "CUSTOM" ? "brand" : "neutral"}>
                        {r.kind}
                      </TablePill>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">{r.description}</p>
                  </div>
                ),
              },
              ...PERM_COLS.slice(0, 6).map((c) => ({
                key: c.key,
                label: c.label,
                render: (r: any) =>
                  hasPerm(r.permissions || [], c.key) ? (
                    <Check className="h-4 w-4 text-[#047422]" />
                  ) : (
                    <span className="text-[#C4C9CF]">—</span>
                  ),
              })),
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={
                      r.kind === "CUSTOM" ? () => setDeleting(r) : undefined
                    }
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={ShieldCheck}
                title="No matching roles"
                action={
                  <ToolbarButton
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setScopeFilter("ALL");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset filters</span>
                  </ToolbarButton>
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.label || "Role Details"}
        record={viewing}
        extraFields={[
          { key: "label", label: "Role Name" },
          { key: "key", label: "Role Key" },
          { key: "kind", label: "Policy Type" },
          { key: "description", label: "Description" },
          {
            key: "permissions",
            label: "Granted Permissions",
            format: (v) =>
              Array.isArray(v) && v.length > 0 ? v.join(", ") : "None (Listener)",
          },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={
          viewing?.kind === "CUSTOM" ? () => setDeleting(viewing) : undefined
        }
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? `Edit ${editing.label}` : "Create custom role policy"}
        fields={roleFields}
        initialValues={
          editing || {
            permissions: ["content.read", "content.write"],
          }
        }
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          const features = { ...(station?.features || {}) };
          if (editing?.kind === "CORE") {
            const nextOverrides = { ...(features.role_overrides || {}) };
            nextOverrides[editing.key] = vals.permissions || [];
            await persistStationFeatures({ ...features, role_overrides: nextOverrides });
            toast.success("Role permissions updated");
          } else if (editing) {
            const nextCustom = customRoles.map((cr) =>
              cr.id === editing.id ? { ...cr, ...vals } : cr
            );
            await persistStationFeatures({ ...features, custom_roles: nextCustom });
            toast.success("Custom role updated");
          } else {
            const newRole = {
              id: `role_${Date.now()}`,
              ...vals,
              key: String(vals.key || "").toUpperCase().replace(/\s+/g, "_"),
            };
            await persistStationFeatures({
              ...features,
              custom_roles: [...customRoles, newRole],
            });
            toast.success("Custom role policy created");
          }
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete custom role policy"
        description={`Delete custom role "${deleting?.label || "this role"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const features = { ...(station?.features || {}) };
          const nextCustom = customRoles.filter((cr) => cr.id !== deleting.id);
          await persistStationFeatures({ ...features, custom_roles: nextCustom });
          toast.success("Custom role deleted");
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Notifications & Staff Invitations (/admin/notifications)                */
/* -------------------------------------------------------------------------- */

export function AdminNotificationsPage() {
  const [tab, setTab] = useState<"notifications" | "invitations">("notifications");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notifs, invs] = await Promise.all([
        apiFetch<any[]>("/api/admin/entities/Notification").catch(() => []),
        apiFetch<any[]>("/api/admin/invitations").catch(() => []),
      ]);
      setNotifications(notifs);
      setInvites(invs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (typeFilter !== "ALL" && n.type !== typeFilter) return false;
      if (statusFilter === "READ" && !n.is_read) return false;
      if (statusFilter === "UNREAD" && n.is_read) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !n.title?.toLowerCase().includes(q) &&
          !n.body?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, typeFilter, statusFilter, query]);

  const filteredInvites = useMemo(() => {
    return invites.filter((inv) => {
      if (typeFilter !== "ALL" && inv.staff_role !== typeFilter) return false;
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !inv.email?.toLowerCase().includes(q) &&
          !inv.staff_role?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [invites, typeFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || typeFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  const notifFields: FieldDef[] = [
    {
      key: "type",
      label: "Notification Type",
      type: "select",
      required: true,
      options: NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    { key: "title", label: "Title", required: true, placeholder: "Subaxnimo is live now" },
    { key: "href", label: "Target Link", placeholder: "/mobile/live" },
    { key: "is_read", label: "Marked as read", type: "checkbox" },
    { key: "body", label: "Message", type: "textarea", fullWidth: true },
  ];

  const inviteFields: FieldDef[] = [
    { key: "email", label: "Email Address", required: true, placeholder: "staff@radiohargeysa.so" },
    {
      key: "staff_role",
      label: "Staff Role",
      type: "select",
      required: true,
      options: STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["PENDING", "ACCEPTED", "REVOKED"].map((s) => ({ value: s, label: s })),
    },
  ];

  const currentFields = tab === "notifications" ? notifFields : inviteFields;
  const activeRows = tab === "notifications" ? filteredNotifs : filteredInvites;
  const totalCount =
    tab === "notifications" ? notifications.length : invites.length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="COMMUNICATIONS"
        title="Notifications & Staff Invitations"
        description="Manage listener push alerts and staff onboarding invitations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#E7E9EC] bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("notifications");
                  resetFilters();
                }}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  tab === "notifications"
                    ? "bg-[#047422] text-white"
                    : "text-[#6B7280] hover:text-[#050505]"
                }`}
              >
                Notifications ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("invitations");
                  resetFilters();
                }}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  tab === "invitations"
                    ? "bg-[#047422] text-white"
                    : "text-[#6B7280] hover:text-[#050505]"
                }`}
              >
                Staff Invitations ({invites.length})
              </button>
            </div>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>
                {tab === "notifications" ? "Send notification" : "Invite staff"}
              </span>
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
                placeholder={
                  tab === "notifications"
                    ? "Search title or message…"
                    : "Search email or role…"
                }
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              {tab === "notifications" ? (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
                >
                  <option value="ALL">All Types</option>
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
                >
                  <option value="ALL">All Roles</option>
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Statuses</option>
              {tab === "notifications" ? (
                <>
                  <option value="UNREAD">UNREAD</option>
                  <option value="READ">READ</option>
                </>
              ) : (
                <>
                  <option value="PENDING">PENDING</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REVOKED">REVOKED</option>
                </>
              )}
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
            Showing {activeRows.length} of {totalCount}
          </span>
        </div>

        <div className="p-4">
          {tab === "notifications" ? (
            <DataTable
              loading={loading}
              columns={[
                {
                  key: "type",
                  label: "Type",
                  render: (r) => <TablePill tone="brand">{r.type}</TablePill>,
                },
                {
                  key: "title",
                  label: "Notification",
                  render: (r) => (
                    <div>
                      <p className="font-bold text-[#050505]">{r.title}</p>
                      {r.body && (
                        <p className="max-w-md truncate text-[11px] text-[#6B7280]">
                          {r.body}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "href",
                  label: "Opens",
                  render: (r) => (
                    <span className="font-mono text-[11px] text-[#4B5563]">
                      {r.href || "/mobile/home"}
                    </span>
                  ),
                },
                {
                  key: "is_read",
                  label: "State",
                  render: (r) => (
                    <TablePill tone={r.is_read ? "neutral" : "live"}>
                      {r.is_read ? "READ" : "UNREAD"}
                    </TablePill>
                  ),
                },
                {
                  key: "created_date",
                  label: "Sent",
                  render: (r) => relativeTime(r.created_date),
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
              rows={filteredNotifs}
              onRowClick={(r) => setViewing(r)}
              empty={
                <EmptyState
                  icon={Bell}
                  title={hasFilters ? "No matching notifications" : "No notifications sent yet"}
                  action={
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Send notification</span>
                    </ToolbarButton>
                  }
                />
              }
            />
          ) : (
            <DataTable
              loading={loading}
              columns={[
                {
                  key: "email",
                  label: "Email",
                  render: (r) => <span className="font-bold text-[#050505]">{r.email}</span>,
                },
                {
                  key: "staff_role",
                  label: "Staff Role",
                  render: (r) => <TablePill tone="brand">{r.staff_role}</TablePill>,
                },
                {
                  key: "invited_by",
                  label: "Invited By",
                  render: (r) => r.invited_by || "—",
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "created_date",
                  label: "Invited",
                  render: (r) => relativeTime(r.created_date),
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
                      extra={
                        r.status === "PENDING" ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await apiFetch(
                                  `/api/admin/invitations/${r.id}/revoke`,
                                  { method: "POST" }
                                );
                                toast.success("Invitation revoked");
                                load();
                              } catch (err: any) {
                                toast.error(err.message || "Could not revoke invitation");
                              }
                            }}
                            className="mr-1 rounded-lg border border-[#E7E9EC] px-2 py-1 text-[10.5px] font-bold text-[#050505]"
                          >
                            Revoke
                          </button>
                        ) : null
                      }
                    />
                  ),
                },
              ]}
              rows={filteredInvites}
              onRowClick={(r) => setViewing(r)}
              empty={
                <EmptyState
                  icon={UserPlus}
                  title={hasFilters ? "No matching invitations" : "No staff invitations yet"}
                  action={
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Invite staff</span>
                    </ToolbarButton>
                  }
                />
              }
            />
          )}
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.title || viewing?.email || "Details"}
        record={viewing}
        fields={currentFields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={
          editing
            ? tab === "notifications"
              ? "Edit notification"
              : "Edit invitation"
            : tab === "notifications"
              ? "Send broadcast notification"
              : "Invite staff member"
        }
        fields={currentFields}
        initialValues={
          editing ||
          (tab === "notifications"
            ? { type: "LIVE_STARTED", href: "/mobile/live", is_read: false }
            : { staff_role: "PRODUCER", status: "PENDING" })
        }
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          if (tab === "notifications") {
            if (editing) {
              await apiFetch(`/api/admin/entities/Notification/${editing.id}`, {
                method: "PATCH",
                body: JSON.stringify(vals),
              });
              toast.success("Notification updated");
            } else {
              await apiFetch("/api/studio/notifications/broadcast", {
                method: "POST",
                body: JSON.stringify(vals),
              });
              toast.success("Notification sent");
            }
          } else {
            if (editing) {
              await apiFetch(`/api/admin/entities/StaffInvitation/${editing.id}`, {
                method: "PATCH",
                body: JSON.stringify(vals),
              });
              toast.success("Invitation updated");
            } else {
              await apiFetch("/api/admin/invitations", {
                method: "POST",
                body: JSON.stringify(vals),
              });
              toast.success("Invitation sent");
            }
          }
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title={tab === "notifications" ? "Delete notification" : "Delete invitation"}
        description={`Delete "${deleting?.title || deleting?.email || "this record"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting?.id) return;
          const entity = tab === "notifications" ? "Notification" : "StaffInvitation";
          await apiFetch(`/api/admin/entities/${entity}/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("Deleted");
          await load();
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Advertisements (/admin/advertisements)                                  */
/* -------------------------------------------------------------------------- */

export function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [placementFilter, setPlacementFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>("/api/admin/advertisements");
      setAds(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return ads.filter((a) => {
      if (placementFilter !== "ALL" && a.placement !== placementFilter) return false;
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          a.name?.toLowerCase().includes(q) ||
          a.advertiser?.toLowerCase().includes(q) ||
          a.target_url?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [ads, placementFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || placementFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setPlacementFilter("ALL");
    setStatusFilter("ALL");
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/entities/Advertisement/${id}`, {
        method: "DELETE",
      });
      toast.success("Campaign deleted");
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete campaign");
    }
  };

  const fields: FieldDef[] = [
    { key: "name", label: "Campaign / Brand title", required: true, placeholder: "HOBHOB Marketplace" },
    { key: "advertiser", label: "Tagline / Advertiser", placeholder: "Everything You Need in One Place" },
    {
      key: "placement",
      label: "Placement",
      type: "select",
      options: AD_PLACEMENTS.map((p) => ({ value: p, label: p })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["ACTIVE", "DRAFT", "PAUSED", "ENDED"].map((s) => ({
        value: s,
        label: s,
      })),
    },
    {
      key: "creative_url",
      label: "Banner / Creative image",
      type: "image",
      fullWidth: true,
    },
    { key: "target_url", label: "Target URL", placeholder: "https://... or /mobile/programs" },
    { key: "starts_at", label: "Starts", type: "datetime-local" },
    { key: "ends_at", label: "Ends", type: "datetime-local" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="SPONSORSHIPS"
        title="Advertisements"
        description="Campaigns with placement MOBILE_HOME and status ACTIVE appear in the mobile home screen advertisement carousel."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New campaign</span>
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
                placeholder="Search campaign or brand…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={placementFilter}
                onChange={(e) => setPlacementFilter(e.target.value)}
                aria-label="Filter by placement"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
              >
                <option value="ALL">All Placements</option>
                {AD_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Statuses</option>
              {["ACTIVE", "DRAFT", "PAUSED", "ENDED"].map((s) => (
                <option key={s} value={s}>
                  {s}
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
            Showing {filtered.length} of {ads.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "name",
                label: "Campaign",
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    {r.creative_url ? (
                      <img
                        src={r.creative_url}
                        alt={r.name}
                        className="h-9 w-14 shrink-0 rounded-lg border border-[#E7E9EC] object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-[#E7E9EC] bg-[#F5F6F7] text-[#9CA3AF]">
                        <Megaphone className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#050505]">{r.name}</p>
                      {r.advertiser && (
                        <p className="truncate text-[11px] text-[#6B7280]">{r.advertiser}</p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: "placement",
                label: "Placement",
                render: (r) => <TablePill>{r.placement}</TablePill>,
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              { key: "impressions", label: "Impressions", align: "right" },
              { key: "clicks", label: "Clicks", align: "right" },
              {
                key: "ctr",
                label: "CTR",
                align: "right",
                render: (r) => `${r.ctr || 0}%`,
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
                icon={Megaphone}
                title={hasFilters ? "No matching campaigns" : "No campaigns yet"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New campaign</span>
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
        title={viewing?.name || "Campaign Details"}
        record={viewing}
        fields={fields}
        extraFields={[
          { key: "impressions", label: "Impressions" },
          { key: "clicks", label: "Clicks" },
          { key: "ctr", label: "CTR", format: (v) => `${v || 0}%` },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? "Edit campaign" : "New campaign"}
        fields={fields}
        initialValues={editing || { placement: "MOBILE_HOME", status: "ACTIVE" }}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          await apiFetch("/api/admin/advertisements/save", {
            method: "POST",
            body: JSON.stringify({ ...vals, id: editing?.id }),
          });
          toast.success(editing ? "Changes saved" : "Campaign created");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete advertisement campaign"
        description={`Delete "${deleting?.name || "this campaign"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) await handleDelete(deleting.id);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Network Analytics (/admin/analytics)                                    */
/* -------------------------------------------------------------------------- */

const EVENT_TYPES = [
  "APP_OPEN",
  "LIVE_PLAY",
  "AUDIO_PLAY",
  "EPISODE_PLAY",
  "VIDEO_PLAY",
  "DOWNLOAD",
  "AD_IMPRESSION",
  "AD_CLICK",
];

export function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [targetFilter, setTargetFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, evs] = await Promise.all([
        apiFetch(`/api/admin/analytics?days=${days}`).catch(() => null),
        apiFetch<any[]>("/api/admin/entities/AnalyticsEvent").catch(() => []),
      ]);
      setData(analytics);
      setEvents(evs);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals || {};

  const targetTypes = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.target_type).filter(Boolean))
      ).sort() as string[],
    [events]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (eventFilter !== "ALL" && ev.event_type !== eventFilter) return false;
      if (targetFilter !== "ALL" && ev.target_type !== targetFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          ev.event_type?.toLowerCase().includes(q) ||
          ev.target_title?.toLowerCase().includes(q) ||
          ev.target_id?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [events, eventFilter, targetFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || eventFilter !== "ALL" || targetFilter !== "ALL";

  const eventFields: FieldDef[] = [
    {
      key: "event_type",
      label: "Event Type",
      type: "select",
      required: true,
      options: EVENT_TYPES.map((e) => ({ value: e, label: e })),
    },
    { key: "target_type", label: "Target Type", placeholder: "Episode / LiveStream / Ad" },
    { key: "target_title", label: "Target Title", required: true },
    { key: "target_id", label: "Target ID" },
    { key: "user_id", label: "User / Session ID" },
    { key: "duration_seconds", label: "Duration (seconds)", type: "number" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="INSIGHTS"
        title="Network analytics"
        description="Track audience plays, downloads, and raw listener telemetry events."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5">
              {[7, 30, 90].map((d) => (
                <ToolbarButton
                  key={d}
                  variant={days === d ? "primary" : "outline"}
                  onClick={() => setDays(d)}
                >
                  {d}d
                </ToolbarButton>
              ))}
            </div>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Log event</span>
            </ToolbarButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="APP OPENS" value={t.opens || 0} icon={Smartphone} />
        <StatCard label="TOTAL PLAYS" value={t.plays || 0} icon={PlayCircle} tone="brand" />
        <StatCard label="LIVE LISTENS" value={t.listens || 0} icon={BarChart3} />
        <StatCard label="DOWNLOADS" value={t.downloads || 0} icon={Download} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Daily trend">
          <TrendChart data={data?.series || []} dataKey="plays" />
        </SectionCard>
        <SectionCard title="Category breakdown">
          <RankedBars data={data?.categories || []} labelKey="name" />
        </SectionCard>
      </div>

      <SectionCard title="Analytics Events" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search event or target…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
              >
                <option value="ALL">All Event Types</option>
                {EVENT_TYPES.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Targets</option>
              {targetTypes.map((tt) => (
                <option key={tt} value={tt}>
                  {tt}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setEventFilter("ALL");
                  setTargetFilter("ALL");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
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
                render: (r) => <TablePill tone="brand">{r.event_type}</TablePill>,
              },
              {
                key: "target_title",
                label: "Target",
                render: (r) => (
                  <span className="font-bold text-[#050505]">
                    {r.target_title || r.target_id || "—"}
                  </span>
                ),
              },
              { key: "target_type", label: "Target Type" },
              {
                key: "created_date",
                label: "Recorded",
                render: (r) => relativeTime(r.created_date),
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
            rows={filteredEvents}
            onRowClick={(r) => setViewing(r)}
            empty={<EmptyState icon={BarChart3} title="No analytics events yet" />}
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing ? `${viewing.event_type} Event` : "Event Details"}
        record={viewing}
        fields={eventFields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? "Edit analytics event" : "Log analytics event"}
        fields={eventFields}
        initialValues={editing || { event_type: "EPISODE_PLAY", target_type: "Episode" }}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          if (editing) {
            await apiFetch(`/api/admin/entities/AnalyticsEvent/${editing.id}`, {
              method: "PATCH",
              body: JSON.stringify(vals),
            });
            toast.success("Event updated");
          } else {
            await apiFetch("/api/admin/entities/AnalyticsEvent", {
              method: "POST",
              body: JSON.stringify(vals),
            });
            toast.success("Event logged");
          }
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete analytics event"
        description="Permanently delete this analytics event entry?"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting?.id) return;
          await apiFetch(`/api/admin/entities/AnalyticsEvent/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("Event deleted");
          await load();
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Audit Logs (/admin/audit-logs)                                          */
/* -------------------------------------------------------------------------- */

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>("/api/admin/audit-logs");
      setLogs(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roles = useMemo(
    () => Array.from(new Set(logs.map((l) => l.actor_role).filter(Boolean))).sort(),
    [logs]
  );
  const entityTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entity_type).filter(Boolean))).sort(),
    [logs]
  );

  const visible = useMemo(() => {
    return logs.filter((l) => {
      if (roleFilter !== "ALL" && l.actor_role !== roleFilter) return false;
      if (entityFilter !== "ALL" && l.entity_type !== entityFilter) return false;
      if (actionFilter.trim()) {
        const q = actionFilter.trim().toLowerCase();
        const hit =
          l.action?.toLowerCase().includes(q) ||
          l.actor_email?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.entity_type?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [logs, roleFilter, entityFilter, actionFilter]);

  const hasFilters =
    Boolean(actionFilter.trim()) || roleFilter !== "ALL" || entityFilter !== "ALL";

  const auditFields: FieldDef[] = [
    { key: "action", label: "Action Code", required: true, placeholder: "MANUAL_REVIEW" },
    { key: "actor_email", label: "Actor Email", required: true },
    { key: "actor_role", label: "Actor Role", placeholder: "SUPER_ADMIN" },
    { key: "entity_type", label: "Entity Type", placeholder: "Program" },
    { key: "entity_id", label: "Entity ID" },
    { key: "details", label: "Details", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="SECURITY"
        title="Audit Logs"
        description="Inspect platform security trail, filter by actor or entity, and annotate entries."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add audit note</span>
          </ToolbarButton>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="Search action, actor, details…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Entities</option>
              {entityTypes.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setActionFilter("");
                  setRoleFilter("ALL");
                  setEntityFilter("ALL");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {visible.length} of {logs.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "created_date",
                label: "Time",
                render: (r) => relativeTime(r.created_date),
              },
              { key: "actor_email", label: "Actor" },
              {
                key: "actor_role",
                label: "Role",
                render: (r) => <TablePill>{r.actor_role}</TablePill>,
              },
              {
                key: "action",
                label: "Action",
                render: (r) => (
                  <span className="font-mono text-[11.5px] font-bold text-[#050505]">
                    {r.action}
                  </span>
                ),
              },
              { key: "entity_type", label: "Entity" },
              {
                key: "details",
                label: "Details",
                render: (r) => (
                  <span className="block max-w-xs truncate">{r.details || "—"}</span>
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
            rows={visible}
            onRowClick={(r) => setViewing(r)}
            empty={<EmptyState icon={ScrollText} title="No audit entries yet" />}
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.action || "Audit Entry"}
        record={viewing}
        fields={auditFields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? "Edit audit log entry" : "Add audit log note"}
        fields={auditFields}
        initialValues={editing || { actor_role: "SUPER_ADMIN", entity_type: "System" }}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          if (editing) {
            await apiFetch(`/api/admin/entities/AuditLog/${editing.id}`, {
              method: "PATCH",
              body: JSON.stringify(vals),
            });
            toast.success("Audit entry updated");
          } else {
            await apiFetch("/api/admin/entities/AuditLog", {
              method: "POST",
              body: JSON.stringify(vals),
            });
            toast.success("Audit entry added");
          }
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete audit log entry"
        description={`Remove audit entry "${deleting?.action || ""}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting?.id) return;
          await apiFetch(`/api/admin/entities/AuditLog/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("Deleted");
          await load();
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Settings (/admin/settings)                                              */
/* -------------------------------------------------------------------------- */

export function AdminSettingsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [station, setStation] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "Radio Hargeysa",
    tagline: "Codka Jamhuuriyadda Somaliland",
    city: "Hargeisa",
    founded_year: 1942,
    logo_url: "",
    downloads_enabled: true,
    ai_enabled: true,
    emergency_enabled: true,
  });

  const load = useCallback(async () => {
    try {
      const list = await apiFetch<any[]>("/api/admin/entities/Station");
      setStations(list);
      const primary = list.find((s) => s.is_primary) || list[0];
      if (primary) {
        setStation(primary);
        setForm({
          name: primary.name || "Radio Hargeysa",
          tagline: primary.tagline || "",
          city: primary.city || "Hargeisa",
          founded_year: primary.founded_year || 1942,
          logo_url: primary.logo_url || "",
          downloads_enabled: primary.features?.downloads_enabled ?? true,
          ai_enabled: primary.features?.ai_enabled ?? true,
          emergency_enabled: primary.features?.emergency_enabled ?? true,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch("/api/admin/stations/save", {
      method: "POST",
      body: JSON.stringify({
        id: station?.id,
        name: form.name,
        tagline: form.tagline,
        city: form.city,
        founded_year: Number(form.founded_year),
        logo_url: form.logo_url,
        features: {
          ...(station?.features || {}),
          downloads_enabled: form.downloads_enabled,
          ai_enabled: form.ai_enabled,
          emergency_enabled: form.emergency_enabled,
        },
      }),
    });
    await apiFetch("/api/admin/settings/audit", {
      method: "POST",
      body: JSON.stringify({
        action: "SETTINGS_UPDATED",
        entity_type: "Station",
        entity_id: station?.id || "",
        details: `Updated station identity and feature toggles for ${form.name}`,
      }),
    });
    toast.success("Station settings saved");
    await load();
  };

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (statusFilter !== "ALL" && (s.status || "ACTIVE") !== statusFilter)
        return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          s.name?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.studio_name?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [stations, statusFilter, query]);

  const stationFields: FieldDef[] = [
    { key: "name", label: "Station Name", required: true },
    { key: "tagline", label: "Tagline" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
    { key: "studio_name", label: "Studio Name" },
    { key: "founded_year", label: "Founded Year", type: "number" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "ACTIVE" },
        { value: "INACTIVE", label: "INACTIVE" },
      ],
    },
    { key: "is_primary", label: "Primary Station", type: "checkbox" },
    { key: "logo_url", label: "Station Logo", type: "image", fullWidth: true },
    { key: "description", label: "Description", type: "textarea", fullWidth: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CONFIGURE"
        title="Settings"
        description="Configure primary station identity, platform toggles, and station profiles."
      />

      <form onSubmit={save} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="Station identity" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Station name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Tagline
              </label>
              <input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                City
              </label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Founded year
              </label>
              <input
                type="number"
                value={form.founded_year}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    founded_year: Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Station logo"
                value={form.logo_url}
                onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-[#E7E9EC] bg-[#F5F6F7] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-lg bg-[#047422]" />
                <div>
                  <p className="text-[12px] font-bold text-[#050505]">Brand green</p>
                  <p className="font-mono text-[11px] text-[#6B7280]">#047422</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#047422]">Active</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <ToolbarButton type="submit">Save changes</ToolbarButton>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Feature toggles">
            <div className="space-y-3 text-[12.5px]">
              <label className="flex items-center gap-2.5 font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={form.downloads_enabled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      downloads_enabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#047422]"
                />
                <span>Allow listener downloads</span>
              </label>
              <label className="flex items-center gap-2.5 font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={form.ai_enabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ai_enabled: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#047422]"
                />
                <span>Enable Studio AI Desk</span>
              </label>
              <label className="flex items-center gap-2.5 font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={form.emergency_enabled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      emergency_enabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#047422]"
                />
                <span>Enable emergency broadcast override</span>
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Platform Notice">
            <p className="text-[12px] leading-relaxed text-[#6B7280]">
              Station identity, feature toggles, and broadcast configuration updates are
              automatically audited for compliance.
            </p>
          </SectionCard>
        </div>
      </form>

      {/* Station Configurations Table */}
      <SectionCard
        title="Station Configurations"
        description="Manage broadcast station records and identity overrides."
        padded={false}
        actions={
          <ToolbarButton type="button" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add station</span>
          </ToolbarButton>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search station or city…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filteredStations.length} of {stations.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            columns={[
              {
                key: "name",
                label: "Station",
                render: (s) => (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#050505]">{s.name}</span>
                    {s.is_primary && <TablePill tone="brand">Primary</TablePill>}
                  </div>
                ),
              },
              { key: "city", label: "City" },
              { key: "studio_name", label: "Studio" },
              {
                key: "status",
                label: "Status",
                render: (s) => <StatusBadge status={s.status || "ACTIVE"} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (s) => (
                  <RecordActions
                    onView={() => setViewing(s)}
                    onEdit={() => setEditing(s)}
                    onDelete={
                      !s.is_primary ? () => setDeleting(s) : undefined
                    }
                  />
                ),
              },
            ]}
            rows={filteredStations}
            onRowClick={(s) => setViewing(s)}
            empty={<EmptyState icon={Radio} title="No station profiles found" />}
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.name || "Station Profile"}
        record={viewing}
        fields={stationFields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={
          viewing && !viewing.is_primary ? () => setDeleting(viewing) : undefined
        }
      />

      <RecordEditDialog
        open={creating || Boolean(editing)}
        title={editing ? "Edit station configuration" : "Add station configuration"}
        fields={stationFields}
        initialValues={editing || { status: "ACTIVE", founded_year: 1942 }}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (vals) => {
          await apiFetch("/api/admin/stations/save", {
            method: "POST",
            body: JSON.stringify({ ...vals, id: editing?.id }),
          });
          toast.success(editing ? "Station updated" : "Station created");
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete station profile"
        description={`Delete "${deleting?.name || "this station"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting?.id) return;
          await apiFetch(`/api/admin/entities/Station/${deleting.id}`, {
            method: "DELETE",
          });
          toast.success("Station deleted");
          await load();
        }}
      />
    </div>
  );
}
