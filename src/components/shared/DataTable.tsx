import React from "react";
import { cn } from "../../lib/utils";

export interface Column<T = any> {
  key: string;
  label: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  onRowClick,
  empty,
  dense = false,
  loading = false,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  dense?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2.5 py-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-full animate-pulse rounded-xl bg-[#F5F6F7]"
          />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <>{empty || null}</>;
  }

  return (
    <div className="rh-scroll overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "border-b border-[#F0F1F3] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]",
                  col.align === "right" && "text-right"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-[#F5F6F7] last:border-b-0 transition-colors",
                onRowClick ? "cursor-pointer hover:bg-[#FAFBFC]" : "hover:bg-[#FAFBFC]"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3 text-[12.5px] text-[#1F2937] tabular-nums",
                    dense ? "py-2" : "py-3",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TablePill({
  tone = "neutral",
  children,
}: {
  tone?: "brand" | "live" | "neutral";
  children: React.ReactNode;
}) {
  const cls =
    tone === "brand"
      ? "bg-[#E7F5EA] text-[#047422]"
      : tone === "live"
        ? "bg-[#FDE7E7] text-[#C40D0F]"
        : "bg-[#F1F2F4] text-[#4B5563]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] whitespace-nowrap",
        cls
      )}
    >
      {children}
    </span>
  );
}
