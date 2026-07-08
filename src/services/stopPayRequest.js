import { PDFDocument } from "pdf-lib";
import {
  STOP_PAY_HARDCODED_FIELDS,
  STOP_PAY_PDF_FIELD_NAMES,
  STOP_PAY_RECORD_FIELD_MAPPINGS,
  STOP_PAY_TEMPLATE_PATH
} from "../config/stopPayRequest.js";
import { formatSpreadsheetDate } from "./dates.js";
import { normalizeCell } from "./records.js";

function resolvePdfFieldName(logicalFieldName) {
  return STOP_PAY_PDF_FIELD_NAMES[logicalFieldName] ?? logicalFieldName;
}

function formatStopPayDate(value) {
  return formatSpreadsheetDate(value);
}

function formatStopPayAmount(value) {
  const text = normalizeCell(value);
  if (!text) {
    return "";
  }

  const numeric = Number(text.replace(/[$,]/g, ""));
  if (!Number.isNaN(numeric) && /^[$]?[\d,]+(\.\d+)?$/.test(text)) {
    return numeric.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return text;
}

function formatStopPayFieldValue(logicalFieldName, value) {
  if (logicalFieldName === "date_requested" || logicalFieldName === "date_check") {
    return formatStopPayDate(value);
  }

  if (logicalFieldName === "amount") {
    return formatStopPayAmount(value);
  }

  return normalizeCell(value);
}

function getRecordColumnValue(record, columnName) {
  if (!columnName) {
    return "";
  }

  return normalizeCell(record[columnName]);
}

export function buildStopPayRequestFieldValues(
  record,
  requestedAt = new Date(),
  reasonStop = ""
) {
  if (!record || typeof record !== "object") {
    throw new Error("A check record is required to build stop pay request fields.");
  }

  const fieldValues = {};

  Object.entries(STOP_PAY_HARDCODED_FIELDS).forEach(([fieldName, value]) => {
    fieldValues[resolvePdfFieldName(fieldName)] = value;
  });

  Object.entries(STOP_PAY_RECORD_FIELD_MAPPINGS).forEach(
    ([logicalFieldName, columnName]) => {
      const pdfFieldName = resolvePdfFieldName(logicalFieldName);
      const rawValue =
        logicalFieldName === "date_requested"
          ? requestedAt
          : getRecordColumnValue(record, columnName);

      fieldValues[pdfFieldName] = formatStopPayFieldValue(
        logicalFieldName,
        rawValue
      );
    }
  );

  fieldValues.reason_stop = normalizeCell(reasonStop);

  return fieldValues;
}

export async function loadStopPayTemplateBytes(templateUrl) {
  if (!templateUrl) {
    throw new Error(
      `A template URL is required to load ${STOP_PAY_TEMPLATE_PATH}.`
    );
  }

  const response = await fetch(templateUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to load stop pay template from ${STOP_PAY_TEMPLATE_PATH}.`
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function fillStopPayRequestPdf(record, options = {}) {
  const {
    requestedAt = new Date(),
    reasonStop = "",
    flatten = true,
    templateBytes,
    templateUrl
  } = options;

  const resolvedTemplateBytes =
    templateBytes ??
    (templateUrl ? await loadStopPayTemplateBytes(templateUrl) : null);

  if (!resolvedTemplateBytes) {
    throw new Error(
      `Stop pay export requires templateBytes or templateUrl for ${STOP_PAY_TEMPLATE_PATH}.`
    );
  }

  const pdfDoc = await PDFDocument.load(resolvedTemplateBytes);
  const form = pdfDoc.getForm();
  const fieldValues = buildStopPayRequestFieldValues(
    record,
    requestedAt,
    reasonStop
  );

  Object.entries(fieldValues).forEach(([fieldName, value]) => {
    try {
      form.getTextField(fieldName).setText(String(value ?? ""));
    } catch (error) {
      throw new Error(
        `Unable to fill PDF field "${fieldName}": ${error.message}`
      );
    }
  });

  if (flatten) {
    form.flatten();
  }

  return pdfDoc.save();
}

export function buildStopPayRequestFilename(record) {
  const fileNumber = normalizeCell(record["File #"]) || "unknown-file";
  const checkNumber = normalizeCell(record["Type / Check #"]) || "unknown-check";

  return `stop-pay-request_${fileNumber}_${checkNumber}.pdf`;
}
