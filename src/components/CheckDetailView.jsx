import React, { useEffect, useMemo, useState } from "react";
import { STATUS_TABS } from "../config/app.js";
import StopPayExportModal from "./StopPayExportModal.jsx";
import {
  formatRecordFieldValue,
  getRecordContacts,
  getRecordDisplayFields,
  normalizeContacts,
  normalizeStatus,
  recordsHaveSameContacts
} from "../services/records.js";

function buildDraft(record) {
  return {
    notes: record.notes ?? "",
    contacts: getRecordContacts(record),
    status: normalizeStatus(record.status)
  };
}

export default function CheckDetailView({ record, onBack, onSave }) {
  const [draft, setDraft] = useState(() => buildDraft(record));
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showStopPayExport, setShowStopPayExport] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setDraft(buildDraft(record));
    setSaveMessage("");
    setShowSavePrompt(false);
    setShowStopPayExport(false);
  }, [record]);

  const displayFields = getRecordDisplayFields(record);

  const isDirty = useMemo(() => {
    const savedContacts = getRecordContacts(record);

    return (
      draft.notes !== (record.notes ?? "") ||
      draft.status !== normalizeStatus(record.status) ||
      !recordsHaveSameContacts(draft.contacts, savedContacts)
    );
  }, [draft, record]);

  function updateNotes(value) {
    setDraft((current) => ({ ...current, notes: value }));
    setSaveMessage("");
  }

  function updateStatus(value) {
    setDraft((current) => ({ ...current, status: value }));
    setSaveMessage("");
  }

  function updateContact(index, value) {
    setDraft((current) => {
      const nextContacts = [...current.contacts];
      nextContacts[index] = value;
      return { ...current, contacts: nextContacts };
    });
    setSaveMessage("");
  }

  function addContact() {
    setDraft((current) => ({
      ...current,
      contacts: [...current.contacts, ""]
    }));
    setSaveMessage("");
  }

  function removeContact(index) {
    setDraft((current) => {
      if (current.contacts.length === 1) {
        return { ...current, contacts: [""] };
      }

      return {
        ...current,
        contacts: current.contacts.filter((_, contactIndex) => contactIndex !== index)
      };
    });
    setSaveMessage("");
  }

  function persistChanges() {
    const payload = {
      notes: draft.notes.trim(),
      contacts: normalizeContacts(draft.contacts),
      status: draft.status
    };

    onSave(record.compositeKey, payload);
    setSaveMessage("Changes saved.");
    return payload;
  }

  function handleSave() {
    persistChanges();
  }

  function handleBackClick() {
    if (!isDirty) {
      onBack();
      return;
    }

    setShowSavePrompt(true);
  }

  function handleSaveAndBack() {
    persistChanges();
    setShowSavePrompt(false);
    onBack();
  }

  function handleDiscardAndBack() {
    setShowSavePrompt(false);
    onBack();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Dashboard
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Save
        </button>
      </div>

      {saveMessage ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {saveMessage}
        </div>
      ) : null}

      {displayFields.length ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              Spreadsheet fields
            </h2>
          </header>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {displayFields.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {key}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatRecordFieldValue(key, value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Check Detail
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {record["File #"]} &middot; {record["Type / Check #"]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{record.compositeKey}</p>
        </header>

        <div className="space-y-6 p-6">
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <h2 className="text-base font-semibold text-slate-950">Notes</h2>
            <p className="mt-1 text-sm text-slate-600">
              Record updates, follow-ups, or context for this check.
            </p>
            <textarea
              value={draft.notes}
              onChange={(event) => updateNotes(event.target.value)}
              rows={5}
              placeholder="Add notes for this check..."
              className="mt-4 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Contacts
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Log contact details for this check. Add more fields as needed.
                </p>
              </div>
              <button
                type="button"
                onClick={addContact}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800"
              >
                Add contact
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {draft.contacts.map((contact, index) => (
                <div key={`contact-${index}`} className="flex gap-3">
                  <input
                    type="text"
                    value={contact}
                    onChange={(event) => updateContact(index, event.target.value)}
                    placeholder={`Contact ${index + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  />
                  {draft.contacts.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <h2 className="text-base font-semibold text-slate-950">Status</h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose the current workflow stage for this check.
            </p>
            <select
              value={draft.status}
              onChange={(event) => updateStatus(event.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            >
              {STATUS_TABS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <h2 className="text-base font-semibold text-slate-950">
              Stop Pay Request
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Generate a filled stop pay request form from this check&apos;s
              details.
            </p>
            <button
              type="button"
              onClick={() => setShowStopPayExport(true)}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Export Stop Pay Request
            </button>
          </section>
        </div>
      </section>

      {showStopPayExport ? (
        <StopPayExportModal
          record={record}
          onClose={() => setShowStopPayExport(false)}
        />
      ) : null}

      {showSavePrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-prompt-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="save-prompt-title"
              className="text-lg font-semibold text-slate-950"
            >
              Save changes before leaving?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              You edited notes, contacts, or status for this check. Save your
              changes to keep them linked to {record.compositeKey}.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSavePrompt(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardAndBack}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveAndBack}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Save &amp; go back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
