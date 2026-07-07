import React from "react";

export default function SummaryStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}
