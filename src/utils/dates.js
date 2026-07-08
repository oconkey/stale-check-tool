import * as XLSX from "xlsx";
import { ISSUE_DATE_COLUMN } from "../constants.js";

const ISSUE_DATE_KEY_PATTERN =
  /^(issue\s*)?date(\s*issued)?$|^check\s*date$/i;

export function isDateFieldKey(key) {
  return ISSUE_DATE_KEY_PATTERN.test(String(key ?? "").trim());
}

export function parseSpreadsheetDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return parseExcelSerial(value);
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (!Number.isNaN(numeric) && /^\d+(\.\d+)?$/.test(text) && numeric > 1000) {
    const fromSerial = parseExcelSerial(numeric);
    if (fromSerial) {
      return fromSerial;
    }
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function parseExcelSerial(serial) {
  const parts = XLSX.SSF?.parse_date_code?.(serial);
  if (parts) {
    return new Date(parts.y, parts.m - 1, parts.d);
  }

  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatSpreadsheetDate(value) {
  const date = parseSpreadsheetDate(value);
  if (!date) {
    return String(value ?? "");
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

export function getDaysSinceIssue(value, referenceDate = new Date()) {
  const issueDate = parseSpreadsheetDate(value);
  if (!issueDate) {
    return null;
  }

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const normalizedIssueDate = new Date(issueDate);
  normalizedIssueDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - normalizedIssueDate.getTime();
  return Math.floor(diffMs / 86_400_000);
}

export function getIssueDateFromRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  if (record[ISSUE_DATE_COLUMN] !== undefined && record[ISSUE_DATE_COLUMN] !== "") {
    return record[ISSUE_DATE_COLUMN];
  }

  const matchingKey = Object.keys(record).find((key) => isDateFieldKey(key));
  return matchingKey ? record[matchingKey] : null;
}

export function getDaysSinceIssueForRecord(record, referenceDate = new Date()) {
  return getDaysSinceIssue(getIssueDateFromRecord(record), referenceDate);
}
