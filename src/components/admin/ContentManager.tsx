import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Plus, RotateCcw, Search, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import { PageHeader, SectionCard, ToolbarButton } from "../shared/Surface";
import { DataTable, type Column } from "../shared/DataTable";
import { EmptyState } from "../shared/EmptyState";
import {
  ConfirmDeleteDialog,
  RecordActions,
  RecordEditDialog,
  RecordViewDialog,
  type FieldDef,
  type ViewFieldDef,
} from "../studio/RecordActions";

export interface ContentFilterDef {
  key: string;
  label: string;
  options?: Array<{ value: string; label: string }>;
}

export function ContentManager({
  entity,
  eyebrow,
  title,
  description,
  newLabel = "New",
  searchPlaceholder = "Search…",
  emptyTitle = "No records yet",
  emptyDescription = "Create the first entry to populate this section.",
  emptyIcon,
  columns,
  fields,
  viewFields,
  filters = [],
  statusOptions,
  searchKeys = ["title", "name", "full_name", "program_title", "email"],
  initialValues = {},
}: {
  entity: string;
  eyebrow?: string;
  title: string;
  description?: string;
  newLabel?: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  columns: Column<any>[];
  fields: FieldDef[];
  viewFields?: ViewFieldDef[];
  filters?: ContentFilterDef[];
  statusOptions?: string[];
  searchKeys?: string[];
  initialValues?: Record<string, any>;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/api/admin/entities/${entity}`);
      setRows(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  const resolvedFilters = useMemo(() => {
    return filters.map((f) => {
      if (f.options && f.options.length > 0) return f;
      const unique = Array.from(
        new Set(
          rows
            .map((r) => r[f.key])
            .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
            .map((v) => String(v))
        )
      ).sort();
      return {
        ...f,
        options: unique.map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
      };
    });
  }, [filters, rows]);

  const hasActiveFilters =
    Boolean(query.trim()) ||
    statusFilter !== "ALL" ||
    Object.values(extraFilters).some((v) => v && v !== "ALL");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusOptions && statusFilter !== "ALL") {
        if ((r.status || statusOptions[0]) !== statusFilter) return false;
      }
      for (const f of resolvedFilters) {
        const val = extraFilters[f.key];
        if (val && val !== "ALL") {
          if (String(r[f.key] ?? "") !== val) return false;
        }
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const matches = searchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, statusOptions, statusFilter, resolvedFilters, extraFilters, query, searchKeys]);

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setExtraFilters({});
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/admin/entities/${entity}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success("Changes saved");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/entities/${entity}/${id}`, {
        method: "DELETE",
      });
      toast.success("Deleted");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete record");
    }
  };

  const tableColumns: Column<any>[] = [
    ...columns,
    ...(statusOptions
      ? [
          {
            key: "status",
            label: "Status",
            render: (row: any) => (
              <select
                value={row.status || statusOptions[0]}
                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-[#E7E9EC] bg-white px-2 py-1 text-[11px] font-bold text-[#050505] focus:border-[#047422] focus:outline-none"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            ),
          },
        ]
      : []),
    {
      key: "_actions",
      label: "Actions",
      align: "right" as const,
      render: (row: any) => (
        <RecordActions
          onView={() => setViewing(row)}
          onEdit={() => setEditing(row)}
          onDelete={() => setDeleting(row)}
        />
      ),
    },
  ];

  const singularLabel = title.toLowerCase().replace(/ies$/, "y").replace(/s$/, "");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>{newLabel}</span>
          </ToolbarButton>
        }
      />

      <SectionCard padded={false}>
        {/* Data Table Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            {statusOptions && (
              <div className="inline-flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                  className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {resolvedFilters.map((f) => (
              <select
                key={f.key}
                value={extraFilters[f.key] || "ALL"}
                onChange={(e) =>
                  setExtraFilters((prev) => ({
                    ...prev,
                    [f.key]: e.target.value,
                  }))
                }
                aria-label={`Filter by ${f.label}`}
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All {f.label}</option>
                {(f.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

            {hasActiveFilters && (
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
            columns={tableColumns}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={emptyIcon}
                title={hasActiveFilters ? "No matching records" : emptyTitle}
                description={
                  hasActiveFilters
                    ? "Try clearing or adjusting your search and filters."
                    : emptyDescription
                }
                action={
                  hasActiveFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>{newLabel}</span>
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
        title={
          viewing?.title ||
          viewing?.name ||
          viewing?.full_name ||
          viewing?.program_title ||
          `View ${singularLabel}`
        }
        record={viewing}
        fields={fields}
        extraFields={viewFields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title={`Create ${singularLabel}`}
        fields={fields}
        initialValues={initialValues}
        onClose={() => setCreating(false)}
        onSave={async (values) => {
          await apiFetch(`/api/admin/entities/${entity}`, {
            method: "POST",
            body: JSON.stringify(values),
          });
          toast.success("Created");
          await load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title={`Edit ${singularLabel}`}
        fields={fields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (values) => {
          await apiFetch(`/api/admin/entities/${entity}/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          });
          toast.success("Changes saved");
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title={`Delete ${singularLabel}`}
        description={`Are you sure you want to delete "${
          deleting?.title ||
          deleting?.name ||
          deleting?.full_name ||
          deleting?.program_title ||
          "this item"
        }"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await handleDelete(deleting.id);
          }
        }}
      />
    </div>
  );
}
