import React from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import { useLibrary } from "./useLibrary";
import { RowHeader, Row } from "./Media";

export function ContinueListening() {
  const { library } = useLibrary();
  const items = library.history.filter((h) => !h.completed).slice(0, 8);
  if (items.length === 0) return null;

  return (
    <div>
      <RowHeader title="Continue listening" seeAllTo="/mobile/library/history" />
      <Row>
        {items.map((item) => {
          const pct =
            item.duration_seconds > 0
              ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
              : 25;
          return (
            <Link
              key={item.id}
              to={item.href || "/mobile/episodes"}
              className="w-[152px] shrink-0 snap-start"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#050505]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/30">
                    <Radio className="h-6 w-6" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
                  <div
                    className="h-full bg-[#047422]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 truncate text-[12.5px] font-bold text-[#050505]">
                {item.title}
              </p>
              <p className="truncate text-[10.5px] font-medium text-[#6B7280]">
                {item.subtitle || "In progress"}
              </p>
            </Link>
          );
        })}
      </Row>
    </div>
  );
}
