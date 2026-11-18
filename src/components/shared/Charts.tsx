import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export function TrendChart({
  data,
  dataKey = "plays",
  height = 220,
}: {
  data: any[];
  dataKey?: string;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-[12.5px] text-[#9CA3AF]"
      >
        No listening activity yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rhGreenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#047422" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#047422" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F0F1F3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#050505",
              border: "none",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#047422"
            strokeWidth={2}
            fill="url(#rhGreenFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RankedBars({
  data,
  labelKey = "title",
  valueKey = "value",
  emptyText = "No play data yet.",
  height = 200,
}: {
  data: any[];
  labelKey?: string;
  valueKey?: string;
  emptyText?: string;
  height?: number;
}) {
  if (!data || data.length === 0 || data.every((d) => !d[valueKey])) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-[12.5px] text-[#9CA3AF]">
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
        >
          <CartesianGrid stroke="#F0F1F3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={110}
            tick={{ fontSize: 11, fill: "#1F2937" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#050505",
              border: "none",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "12px",
            }}
          />
          <Bar dataKey={valueKey} fill="#047422" radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BroadcastOverviewChart({
  data,
  height = 210,
}: {
  data: Array<{ day: string; listeners: number; streams: number }>;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-[12.5px] text-[#9CA3AF]"
      >
        No broadcast telemetry recorded yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="rhStudioListenersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#047422" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#047422" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="rhStudioStreamsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C40D0F" stopOpacity={0.14} />
              <stop offset="95%" stopColor="#C40D0F" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#050505",
              border: "none",
              borderRadius: "12px",
              color: "#FFFFFF",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="listeners"
            name="Listeners"
            stroke="#047422"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "#047422", stroke: "#FFFFFF", strokeWidth: 1.5 }}
            activeDot={{ r: 5 }}
            fill="url(#rhStudioListenersFill)"
          />
          <Area
            type="monotone"
            dataKey="streams"
            name="Streams"
            stroke="#C40D0F"
            strokeWidth={2.2}
            dot={{ r: 3.5, fill: "#C40D0F", stroke: "#FFFFFF", strokeWidth: 1.5 }}
            activeDot={{ r: 5 }}
            fill="url(#rhStudioStreamsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
