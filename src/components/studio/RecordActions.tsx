import React, { useEffect, useState } from "react";
import { Eye, Pencil, Trash2, X, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { ImageUploadField } from "../shared/ImageUploadField";

export interface FieldDef {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "checkbox"
    | "datetime-local"
    | "image";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  isArray?: boolean;
  fullWidth?: boolean;
}

export interface ViewFieldDef {
  key: string;
  label: string;
  type?: "image" | "badge" | "url" | "boolean" | "date" | "text" | "json";
  format?: (value: any, record: Record<string, any>) => React.ReactNode;
}

export function RecordEditDialog({
  open,
  title,
  fields,
  initialValues,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initialValues: Record<string, any>;
  onClose: () => void;
  onSave: (values: Record<string, any>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const init: Record<string, any> = {};
    fields.forEach((f) => {
      const raw = initialValues?.[f.key];
      if (f.isArray && Array.isArray(raw)) {
        init[f.key] = raw.join(", ");
      } else if (f.type === "checkbox") {
        init[f.key] = Boolean(raw);
      } else {
        init[f.key] = raw ?? "";
      }
    });
    setValues(init);
    setError(null);
  }, [open, initialValues, fields]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? "").trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const out: Record<string, any> = {};
      fields.forEach((f) => {
        const val = values[f.key];
        if (f.isArray) {
          out[f.key] = String(val || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (f.type === "number") {
          out[f.key] = val === "" ? 0 : Number(val);
        } else {
          out[f.key] = val;
        }
      });
      await onSave(out);
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
          <h3 className="text-[16px] font-extrabold text-[#050505]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F5F6F7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div
                key={f.key}
                className={
                  f.fullWidth || f.type === "textarea" ? "sm:col-span-2" : ""
                }
              >
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-2.5 pt-2 text-[12.5px] font-semibold text-[#1F2937]">
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.key])}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#047422]"
                    />
                    <span>{f.label}</span>
                  </label>
                ) : (
                  <>
                    {f.type === "image" ? (
                      <ImageUploadField
                        label={f.label}
                        required={f.required}
                        value={values[f.key] ?? ""}
                        onChange={(url) =>
                          setValues((v) => ({ ...v, [f.key]: url }))
                        }
                      />
                    ) : (
                      <>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                          {f.label}
                          {f.required && <span className="ml-1 text-[#C40D0F]">*</span>}
                        </label>
                        {f.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={values[f.key] ?? ""}
                            placeholder={f.placeholder}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [f.key]: e.target.value }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] text-[#050505] focus:border-[#047422] focus:outline-none"
                          />
                        ) : f.type === "select" ? (
                          <select
                            value={values[f.key] ?? ""}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [f.key]: e.target.value }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px] text-[#050505] focus:border-[#047422] focus:outline-none"
                          >
                            <option value="">Select…</option>
                            {(f.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type || "text"}
                            value={values[f.key] ?? ""}
                            placeholder={f.placeholder}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [f.key]: e.target.value }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] text-[#050505] focus:border-[#047422] focus:outline-none"
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[11.5px] font-semibold text-[#C40D0F]">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#F0F1F3] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E7E9EC] bg-white px-4 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#047422] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const IMAGE_KEYS = [
  "cover_url",
  "image_url",
  "thumbnail_url",
  "photo_url",
  "logo_url",
  "creative_url",
];

export function RecordViewDialog({
  open,
  title,
  record,
  fields,
  extraFields,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  title: string;
  record: Record<string, any> | null;
  fields?: FieldDef[];
  extraFields?: ViewFieldDef[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!open || !record) return null;

  const imageKey =
    fields?.find((f) => f.type === "image")?.key ||
    IMAGE_KEYS.find((k) => Boolean(record[k]));
  const imageUrl = imageKey ? record[imageKey] : null;

  const items: Array<{
    key: string;
    label: string;
    value: any;
    isLong?: boolean;
    custom?: React.ReactNode;
  }> = [];
  const seen = new Set<string>();

  if (fields) {
    fields.forEach((f) => {
      if (f.type === "image") return;
      seen.add(f.key);
      items.push({
        key: f.key,
        label: f.label,
        value: record[f.key],
        isLong: f.type === "textarea" || f.fullWidth,
      });
    });
  }

  if (extraFields) {
    extraFields.forEach((ef) => {
      seen.add(ef.key);
      items.push({
        key: ef.key,
        label: ef.label,
        value: record[ef.key],
        custom: ef.format ? ef.format(record[ef.key], record) : undefined,
      });
    });
  }

  // Always include status and created_date if present and not already listed
  ["status", "created_date", "updated_date"].forEach((k) => {
    if (!seen.has(k) && record[k] !== undefined && record[k] !== null && record[k] !== "") {
      seen.add(k);
      items.push({
        key: k,
        label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: record[k],
      });
    }
  });

  const renderVal = (val: any) => {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "—";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    const s = String(val);
    if (/^https?:\/\/.+/.test(s)) {
      return (
        <a
          href={s}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[#047422] hover:underline break-all"
        >
          <span>{s}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString();
      }
    }
    return s;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#047422]">
              Record Details
            </p>
            <h3 className="text-[16px] font-extrabold text-[#050505]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F5F6F7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {imageUrl && (
            <div className="overflow-hidden rounded-2xl border border-[#E7E9EC] bg-[#F5F7F6]">
              <img
                src={imageUrl}
                alt={title}
                className="max-h-56 w-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl border border-[#F0F1F3] bg-[#FAFBFC] p-3 ${
                  item.isLong ? "sm:col-span-2" : ""
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  {item.label}
                </p>
                <div className="mt-1 text-[12.5px] font-semibold text-[#111827] whitespace-pre-wrap break-words">
                  {item.custom !== undefined ? item.custom : renderVal(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F1F3] pt-4">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FDE7E7] bg-[#FFF5F5] px-3.5 py-2 text-[12px] font-bold text-[#C40D0F] hover:bg-[#FDE7E7]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E7E9EC] bg-white px-4 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#047422] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#035A1B]"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDeleteDialog({
  open,
  title = "Delete record",
  description = "Are you sure you want to permanently delete this item? This action cannot be undone.",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FDE7E7] text-[#C40D0F]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-[#050505]">{title}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B7280]">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-[#E7E9EC] bg-white px-4 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#C40D0F] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#A10B0D] disabled:opacity-40"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecordActions({
  onView,
  onEdit,
  onDelete,
  extra,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {extra}
      {onView && (
        <button
          type="button"
          onClick={onView}
          title="View details"
          aria-label="View details"
          className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#E7F5EA] hover:text-[#047422]"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          aria-label="Edit"
          className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#050505]"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete"
          className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#FDE7E7] hover:text-[#C40D0F]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
