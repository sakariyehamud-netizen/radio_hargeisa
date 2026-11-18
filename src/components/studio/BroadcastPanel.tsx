import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  Users,
  Radio,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import { formatClock } from "../../lib/format";
import { StatusBadge } from "../shared/StatusBadge";

export function BroadcastPanel({
  broadcast,
  currentProgram,
  audioStream,
  stationName = "Radio Hargeysa",
  onRefresh,
}: {
  broadcast: any;
  currentProgram: any;
  audioStream: any;
  stationName?: string;
  onRefresh: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!broadcast?.started_at || broadcast.status === "ENDED") {
      setElapsed(0);
      return;
    }
    const update = () => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(broadcast.started_at).getTime()) / 1000)
      );
      setElapsed(diff);
    };
    update();
    if (broadcast.status === "PAUSED") return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [broadcast?.started_at, broadcast?.status]);

  const handleStart = async () => {
    setBusy(true);
    try {
      await apiFetch("/api/studio/broadcast/start", {
        method: "POST",
        body: JSON.stringify({
          program_id: currentProgram?.program_id || null,
          program_title: currentProgram?.program_title || "Manual Studio Broadcast",
          presenter_name: currentProgram?.presenter_name || "Studio 1 Desk",
        }),
      });
      toast.success("Broadcast is now LIVE");
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Could not start broadcast");
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (action: "pause" | "resume" | "stop") => {
    if (!broadcast?.id) return;
    setBusy(true);
    try {
      await apiFetch(`/api/studio/broadcast/${broadcast.id}/${action}`, {
        method: "POST",
      });
      toast.success(
        action === "pause"
          ? "Broadcast paused"
          : action === "resume"
            ? "Broadcast resumed"
            : "Broadcast stopped and recording saved"
      );
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!broadcast) {
    return (
      <div className="flex flex-col justify-between rounded-3xl bg-white p-5 ring-1 ring-[#E7E9EC]">
        <div>
          <StatusBadge status="OFFLINE" />
          <h2 className="mt-3 text-[16px] font-extrabold text-[#050505]">
            Not on air
          </h2>
          <p className="mt-1 text-[12px] text-[#6B7280] leading-relaxed">
            {currentProgram
              ? `Scheduled now: ${currentProgram.program_title} (${currentProgram.presenter_name}).`
              : "No program is scheduled for this hour. You can still start a manual broadcast."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleStart}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#C40D0F] px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#A10B0D] disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>Start broadcast</span>
            </button>
            <Link
              to="/studio/live/emergency"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FDE7E7] bg-white px-3.5 py-2 text-[12px] font-bold text-[#C40D0F] transition-colors hover:bg-[#FEF7F7]"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Emergency</span>
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#F0F1F3] pt-3">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              STREAM
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[#050505]">
              {audioStream?.status === "LIVE" ? "Live" : "Offline"}
            </p>
          </div>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              HEALTH
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[#050505]">
              {audioStream?.primary_url ? audioStream.health || "GOOD" : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
              LATENCY
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[#050505] tabular-nums">
              {audioStream?.latency_ms || 0} ms
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-3xl bg-[#050505] p-5 text-white">
      <div>
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={broadcast.status} />
          {broadcast.recording_status === "RECORDING" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C40D0F]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#FF8A8A]">
              <Radio className="h-3 w-3" />
              RECORDING
            </span>
          )}
        </div>

        <p className="mt-3 font-mono text-[34px] font-bold tracking-tight tabular-nums">
          {formatClock(elapsed)}
        </p>
        <h2 className="mt-1 text-[15px] font-extrabold text-white">
          {broadcast.program_title}
        </h2>
        <p className="mt-0.5 text-[11.5px] text-white/50">
          {broadcast.presenter_name} · {stationName}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-white/70">
          <Users className="h-3.5 w-3.5 text-[#4ADE80]" />
          <span className="tabular-nums">
            {broadcast.listener_count || 0} listening
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        {broadcast.status === "PAUSED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction("resume")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#047422] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>RESUME</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction("pause")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-[12px] font-bold text-white hover:bg-white/20 disabled:opacity-40"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>PAUSE</span>
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => handleAction("stop")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#C40D0F] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[#A10B0D] disabled:opacity-40"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          <span>STOP</span>
        </button>

        <Link
          to="/studio/live/emergency"
          className="ml-auto text-[11.5px] font-bold text-[#FF8A8A] hover:underline"
        >
          Emergency
        </Link>
      </div>
    </div>
  );
}
