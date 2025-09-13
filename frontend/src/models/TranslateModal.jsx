import React, { useEffect, useMemo, useState } from "react";

const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "si", label: "Sinhala" },
  { code: "ta", label: "Tamil" },
  { code: "hi", label: "Hindi" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "ja", label: "Japanese" },
];

export default function TranslateModal({
  open,
  onClose,
  serverUrl,
  messageId,
  originalText,
}) {
  const defaultLang = useMemo(() => {
    const nav = navigator.language || "en";
    return nav.split("-")[0] || "en";
  }, []);

  const [targetLang, setTargetLang] = useState(defaultLang);
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTranslated("");
      setTargetLang(defaultLang);
    }
  }, [open, defaultLang]);

  if (!open) return null;

  const doTranslate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${serverUrl}/translate/${messageId}?target_lang=${encodeURIComponent(
          targetLang
        )}`
      );
      if (!res.ok) throw new Error("translate failed");
      const data = await res.json();
      setTranslated(data.translated || "");
    } catch (e) {
      setTranslated("⚠️ Translation failed. Please try again.", e);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!translated) return;
    try {
      await navigator.clipboard.writeText(translated);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="w-[540px] max-w-[92%] bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Translate message</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <div className="mb-3">
          <div className="text-xs uppercase text-gray-500 mb-1">Original</div>
          <div className="p-3 rounded bg-gray-50 text-sm whitespace-pre-wrap break-words">
            {originalText || "—"}
          </div>
        </div>

        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="text-xs uppercase text-gray-500">
              Target language
            </label>
            <select
              className="w-full border rounded px-2 py-2"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={doTranslate}
            disabled={loading}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Translating…" : "Translate"}
          </button>
        </div>

        <div>
          <div className="text-xs uppercase text-gray-500 mb-1">Result</div>
          <div className="p-3 rounded bg-emerald-50 text-sm whitespace-pre-wrap break-words min-h-[48px]">
            {translated || "—"}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={copy}
            disabled={!translated}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Copy
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
