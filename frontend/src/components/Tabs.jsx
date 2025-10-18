import React from "react";

export default function Tabs({ active, onChange }) {
  const tabs = [
    { id: "bar", label: "Bar" },
    { id: "radar", label: "Radar" },
    { id: "line", label: "Trend" },
  ];

  return (
    <div className="flex gap-2 items-center">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1 rounded-md text-sm ${
            active === t.id
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
