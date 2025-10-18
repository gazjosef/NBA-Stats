import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RadarCompare({ data, p1Name = "A", p2Name = "B" }) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return <div className="text-slate-500">No data to chart</div>;
  }

  // Recharts expects numeric domain; we've normalised to 0..1 already
  // set domain max to 1
  return (
    <ResponsiveContainer>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="stat" />
        <PolarRadiusAxis angle={30} domain={[0, 1]} />
        <Radar
          name={p1Name}
          dataKey="A"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.25}
        />
        <Radar
          name={p2Name}
          dataKey="B"
          stroke="#ea580c"
          fill="#ea580c"
          fillOpacity={0.25}
        />
        <Tooltip
          formatter={(value) => (value !== null ? value.toFixed(2) : value)}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
