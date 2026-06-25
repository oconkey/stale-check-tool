import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const STORAGE_KEY = "stale-check-records";
const DEFAULT_STATUS = "Untouched";

function normalizeCell(value) {
  return String(value ?? "").trim();
}

function makeCompositeKey(row) {
  const fileNumber = normalizeCell(row["File #"]);
  const checkNumber = normalizeCell(row["Type / Check #"]);

  if (!fileNumber || !checkNumber) {
    return "";
  }

  return `${fileNumber}_${checkNumber}`;
}

function loadStoredRecords() {
  try {
    const rawRecords = localStorage.getItem(STORAGE_KEY);
    return rawRecords ? JSON.parse(rawRecords) : [];
  } catch {
    return [];
  }
}

function saveStoredRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setRecords(loadStoredRecords());
  }, []);

  const recordMap = useMemo(() => {
    return new Map(records.map((record) => [record.compositeKey, record]));
  }, [records]);

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    setError("");
    setUploadSummary(null);

    if (!file) {
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The workbook does not contain any sheets.");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const incomingRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const nextRecords = [...records];
      const seenKeys = new Set(recordMap.keys());

      let addedCount = 0;
      let duplicateCount = 0;
      let skippedCount = 0;

      incomingRows.forEach((row) => {
        const compositeKey = makeCompositeKey(row);

        if (!compositeKey) {
          skippedCount += 1;
          return;
        }

        if (seenKeys.has(compositeKey)) {
          duplicateCount += 1;
          return;
        }

        nextRecords.push({
          ...row,
          compositeKey,
          status: DEFAULT_STATUS
        });
        seenKeys.add(compositeKey);
        addedCount += 1;
      });

      saveStoredRecords(nextRecords);
      setRecords(nextRecords);
      setUploadSummary({
        fileName: file.name,
        totalRows: incomingRows.length,
        addedCount,
        duplicateCount,
        skippedCount
      });
    } catch (uploadError) {
      setError(uploadError.message || "Unable to read this spreadsheet.");
    } finally {
      event.target.value = "";
    }
  }

  function clearRecords() {
    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
    setUploadSummary(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Stale Check Organizer
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Upload stale check spreadsheets
          </h1>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <label
              htmlFor="spreadsheet-upload"
              className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-teal-500 hover:bg-teal-50"
            >
              <span className="text-lg font-semibold text-slate-950">
                Choose an Excel spreadsheet
              </span>
              <span className="mt-2 max-w-md text-sm text-slate-600">
                Rows are matched by File # and Type / Check #. Existing records
                stay untouched, including notes, contacts, and status.
              </span>
              <span className="mt-5 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
                Select file
              </span>
            </label>
            <input
              id="spreadsheet-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={handleFileUpload}
            />
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Stored records
            </h2>
            <p className="mt-2 text-4xl font-semibold text-teal-700">
              {records.length}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Saved locally in this browser.
            </p>
            <button
              type="button"
              onClick={clearRecords}
              className="mt-5 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700"
            >
              Clear local records
            </button>
          </aside>
        </section>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {uploadSummary ? (
          <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
            <h2 className="font-semibold text-teal-950">
              Imported {uploadSummary.fileName}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <SummaryStat label="Rows read" value={uploadSummary.totalRows} />
              <SummaryStat label="New saved" value={uploadSummary.addedCount} />
              <SummaryStat
                label="Duplicates kept"
                value={uploadSummary.duplicateCount}
              />
              <SummaryStat
                label="Skipped"
                value={uploadSummary.skippedCount}
              />
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Current records</h2>
          </div>

          {records.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Composite Key</th>
                    <th className="px-4 py-3">File #</th>
                    <th className="px-4 py-3">Type / Check #</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.slice(0, 25).map((record) => (
                    <tr key={record.compositeKey}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                        {record.compositeKey}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {record["File #"]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {record["Type / Check #"]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No records have been uploaded yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}
