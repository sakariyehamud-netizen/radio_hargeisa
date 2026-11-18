import React, { useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

export async function uploadMediaFile(
  file: File
): Promise<{ url: string; size_mb: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.readAsDataURL(file);
  });
  return apiFetch("/api/studio/upload-file", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
}

export function ImageUploadField({
  label,
  value,
  onChange,
  required,
  hint = "PNG, JPG, WebP or SVG",
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image or photo file.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      onChange(res.url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
        {label}
        {required && <span className="ml-1 text-[#C40D0F]">*</span>}
      </label>

      <div className="mt-1 flex items-center gap-3 rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E7E9EC] bg-white">
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-[#9CA3AF]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#047422] px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-[#035A1B]">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>
                {uploading
                  ? "Uploading…"
                  : value
                    ? "Change photo"
                    : "Upload image / photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleFile}
                className="hidden"
              />
            </label>

            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#6B7280] hover:bg-[#FDE7E7] hover:text-[#C40D0F]"
              >
                <Trash2 className="h-3 w-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
          <p className="mt-1.5 truncate text-[11px] text-[#6B7280]">
            {value ? value : hint}
          </p>
        </div>
      </div>
    </div>
  );
}
