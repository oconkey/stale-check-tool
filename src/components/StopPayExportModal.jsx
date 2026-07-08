import React, { useEffect, useState } from "react";
import { stopPayTemplateUrl } from "../assets/stopPayTemplate.js";
import { fillStopPayRequestPdf } from "../utils/stopPayRequest.js";

function revokePreviewUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export default function StopPayExportModal({ record, onClose }) {
  const [step, setStep] = useState("reason");
  const [reasonStop, setReasonStop] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      revokePreviewUrl(previewUrl);
    };
  }, [previewUrl]);

  function handleClose() {
    revokePreviewUrl(previewUrl);
    onClose();
  }

  function handleDecline() {
    handleClose();
  }

  async function handleNext() {
    const trimmedReason = reasonStop.trim();
    if (!trimmedReason) {
      setError("Please enter a reason for stop payment.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const pdfBytes = await fillStopPayRequestPdf(record, {
        templateUrl: stopPayTemplateUrl,
        reasonStop: trimmedReason
      });

      revokePreviewUrl(previewUrl);
      const nextPreviewUrl = URL.createObjectURL(
        new Blob([pdfBytes], { type: "application/pdf" })
      );

      setPreviewUrl(nextPreviewUrl);
      setStep("preview");
    } catch (generationError) {
      setError(
        generationError.message ||
          "Unable to generate the stop pay request preview."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-pay-export-title"
        className={`flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${
          step === "preview" ? "max-h-[92vh] max-w-5xl" : "max-w-lg"
        }`}
      >
        {step === "reason" ? (
          <>
            <div className="border-b border-slate-200 px-6 py-5">
              <h2
                id="stop-pay-export-title"
                className="text-lg font-semibold text-slate-950"
              >
                Export Stop Pay Request
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter the reason for stop payment. This will appear on the
                generated form.
              </p>
            </div>

            <div className="px-6 py-5">
              <label
                htmlFor="reason-stop-payment"
                className="text-sm font-semibold text-slate-900"
              >
                Reason for Stop Payment
              </label>
              <textarea
                id="reason-stop-payment"
                value={reasonStop}
                onChange={(event) => {
                  setReasonStop(event.target.value);
                  setError("");
                }}
                rows={5}
                placeholder="Type the reason for stop payment..."
                className="mt-3 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              />

              {error ? (
                <p className="mt-3 text-sm text-rose-700">{error}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isGenerating}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isGenerating ? "Generating..." : "Next"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-slate-200 px-6 py-5">
              <h2
                id="stop-pay-export-title"
                className="text-lg font-semibold text-slate-950"
              >
                Stop Pay Request Preview
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Review the filled form before continuing.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 px-6 py-5">
              <div className="h-[min(70vh,720px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-inner">
                <iframe
                  title="Stop pay request preview"
                  src={previewUrl}
                  className="h-full w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleDecline}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                Decline
              </button>
              <button
                type="button"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Accept
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
