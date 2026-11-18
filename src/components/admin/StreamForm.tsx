import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

export function StreamForm({
  open,
  stream,
  onClose,
  onSaved,
}: {
  open: boolean;
  stream?: any;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    kind: "AUDIO",
    primary_url: "",
    backup_url: "",
    hls_output_url: "",
    rtmp_ingest_url: "",
    bitrate_kbps: 64,
    codec: "AAC",
    provider: "icecast",
    is_primary: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (stream) {
      setForm({
        id: stream.id || "",
        name: stream.name || "",
        kind: stream.kind || "AUDIO",
        primary_url: stream.primary_url || "",
        backup_url: stream.backup_url || "",
        hls_output_url: stream.hls_output_url || "",
        rtmp_ingest_url: stream.rtmp_ingest_url || "",
        bitrate_kbps: stream.bitrate_kbps || 64,
        codec: stream.codec || "AAC",
        provider: stream.provider || "icecast",
        is_primary: Boolean(stream.is_primary),
      });
    } else {
      setForm({
        id: "",
        name: "Radio Hargeysa Stream",
        kind: "AUDIO",
        primary_url: "",
        backup_url: "",
        hls_output_url: "",
        rtmp_ingest_url: "",
        bitrate_kbps: 64,
        codec: "AAC",
        provider: "icecast",
        is_primary: false,
      });
    }
    setError(null);
  }, [open, stream]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Stream name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/studio/streams/save", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success(form.id ? "Stream updated" : "Stream added");
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not save stream");
      toast.error(err.message || "Could not save stream");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
          <h3 className="text-[16px] font-extrabold text-[#050505]">
            {form.id ? "Edit stream endpoints" : "Add stream"}
          </h3>
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
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Name <span className="text-[#C40D0F]">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Kind
              </label>
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
              >
                <option value="AUDIO">AUDIO</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Primary endpoint
              </label>
              <input
                value={form.primary_url}
                placeholder="https://stream.radiohargeysa.so/live.mp3"
                onChange={(e) =>
                  setForm((f) => ({ ...f, primary_url: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] font-mono focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Backup endpoint
              </label>
              <input
                value={form.backup_url}
                placeholder="https://backup.radiohargeysa.so/live.mp3"
                onChange={(e) =>
                  setForm((f) => ({ ...f, backup_url: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] font-mono focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                HLS output
              </label>
              <input
                value={form.hls_output_url}
                placeholder="https://cdn.radiohargeysa.so/hls/index.m3u8"
                onChange={(e) =>
                  setForm((f) => ({ ...f, hls_output_url: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] font-mono focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                RTMP ingest
              </label>
              <input
                value={form.rtmp_ingest_url}
                placeholder="rtmp://ingest.radiohargeysa.so/live"
                onChange={(e) =>
                  setForm((f) => ({ ...f, rtmp_ingest_url: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] font-mono focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Bitrate (kbps)
              </label>
              <input
                type="number"
                value={form.bitrate_kbps}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bitrate_kbps: Number(e.target.value) || 64,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Codec
              </label>
              <input
                value={form.codec}
                onChange={(e) => setForm((f) => ({ ...f, codec: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Provider
              </label>
              <input
                value={form.provider}
                onChange={(e) =>
                  setForm((f) => ({ ...f, provider: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_primary: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#047422]"
                />
                <span>Primary station stream</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-[11.5px] font-semibold text-[#C40D0F]">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#F0F1F3] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E7E9EC] bg-white px-4 py-2 text-[12px] font-bold text-[#050505]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#047422] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save stream</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
