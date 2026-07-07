import { DEFAULT_STATUS } from "../constants.js";

export function normalizeCell(value) {
  return String(value ?? "").trim();
}

export function makeCompositeKey(row) {
  const fileNumber = normalizeCell(row["File #"]);
  const checkNumber = normalizeCell(row["Type / Check #"]);

  if (!fileNumber || !checkNumber) {
    return "";
  }

  return `${fileNumber}_${checkNumber}`;
}

export function loadStoredRecords(storageKey) {
  try {
    const rawRecords = localStorage.getItem(storageKey);
    return rawRecords ? JSON.parse(rawRecords) : [];
  } catch {
    return [];
  }
}

export function saveStoredRecords(storageKey, records) {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

export function getRecordDisplayFields(record) {
  return Object.entries(record).filter(
    ([key]) =>
      key !== "compositeKey" &&
      key !== "status" &&
      key !== "notes" &&
      key !== "contacts"
  );
}

export function getRecordContacts(record) {
  if (Array.isArray(record.contacts) && record.contacts.length) {
    return [...record.contacts];
  }

  return [""];
}

export function normalizeContacts(contacts) {
  if (!Array.isArray(contacts)) {
    return [];
  }

  return contacts.map((contact) => normalizeCell(contact)).filter(Boolean);
}

export function recordsHaveSameContacts(left, right) {
  return (
    JSON.stringify(normalizeContacts(left)) ===
    JSON.stringify(normalizeContacts(right))
  );
}

export function normalizeStatus(status) {
  return normalizeCell(status) || DEFAULT_STATUS;
}
