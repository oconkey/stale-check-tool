import React, { useMemo, useState } from "react";
import { STATUS_TABS } from "../config/app.js";
import { getDaysSinceIssueForRecord } from "../services/dates.js";
import { normalizeStatus } from "../services/records.js";

export default function Dashboard({ records, onSelectCheck }) {
  const [activeTab, setActiveTab] = useState(STATUS_TABS[0]);

  const tabCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_TABS.map((tab) => [tab, 0]));

    records.forEach((record) => {
      const status = normalizeStatus(record.status);
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => normalizeStatus(record.status) === activeTab)
      .sort((left, right) => {
        const leftDays = getDaysSinceIssueForRecord(left);
        const rightDays = getDaysSinceIssueForRecord(right);

        if (leftDays === null && rightDays === null) {
          return 0;
        }

        if (leftDays === null) {
          return 1;
        }

        if (rightDays === null) {
          return -1;
        }

        return rightDays - leftDays;
      });
  }, [records, activeTab]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Filter checks by workflow status. Select a row to open its detail view.
        </p>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/80">
        <nav
          className="flex gap-1 overflow-x-auto px-3 py-3"
          aria-label="Check status tabs"
        >
          {STATUS_TABS.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-teal-800 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <span className="whitespace-nowrap">{tab}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {tabCounts[tab]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {filteredRecords.length ? (
        <div className="overflow-x-auto p-4">
          <div role="table" className="min-w-full text-sm">
            <div
              role="row"
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 px-4 pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <span role="columnheader">File #</span>
              <span role="columnheader">Type / Check #</span>
              <span role="columnheader">Composite Key</span>
              <span role="columnheader">Days Since Issue</span>
            </div>

            <div role="rowgroup" className="flex flex-col gap-2">
              {filteredRecords.map((record) => {
                const daysSinceIssue = getDaysSinceIssueForRecord(record);

                return (
                  <div
                    key={record.compositeKey}
                    role="row"
                    onClick={() => onSelectCheck(record.compositeKey)}
                    className="grid cursor-pointer grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 rounded-lg border border-transparent bg-white px-4 py-3 shadow-sm transition-all duration-200 ease-out hover:scale-[1.01] hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-md"
                  >
                    <span
                      role="cell"
                      className="font-medium text-slate-950"
                    >
                      {record["File #"]}
                    </span>
                    <span role="cell" className="text-slate-700">
                      {record["Type / Check #"]}
                    </span>
                    <span role="cell" className="text-slate-500">
                      {record.compositeKey}
                    </span>
                    <span
                      role="cell"
                      className="font-medium text-slate-900"
                    >
                      {daysSinceIssue === null ? "—" : daysSinceIssue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">
            No checks in &ldquo;{activeTab}&rdquo;
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a spreadsheet or move checks into this status to see them
            here.
          </p>
        </div>
      )}
    </section>
  );
}
