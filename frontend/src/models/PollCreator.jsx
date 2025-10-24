// components/PollCreator.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";

const serverUrl = "https://trip-collab-be.livelydesert-2195a427.southeastasia.azurecontainerapps.io";

export default function PollCreator({ group_id, user_id, onClose, onCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(0); // minutes

  const addOption = () => setOptions((o) => [...o, ""]);
  const updateOption = (i, v) => setOptions((o) => o.map((x, idx) => (idx === i ? v : x)));
  const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));

  const submit = async () => {
    const cleaned = options.map((s) => s.trim()).filter(Boolean);
    if (question.trim().length < 3) return toast.warn("Question is too short");
    if (cleaned.length < 2) return toast.warn("Add at least 2 options");

    try {
      const res = await fetch(`${serverUrl}/polls/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id,
          created_by: user_id,
          question: question.trim(),
          options: cleaned,
          duration_minutes: Number(duration) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || "Failed to create poll");
        return;
      }
      toast.success("Poll created");
      onCreated?.();
    } catch {
      toast.error("Failed to create poll");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Question</label>
      <input
        className="w-full border rounded px-3 py-2 mb-3"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Where should we go next?"
      />

      <label className="block text-sm font-medium mb-1">Options</label>
      <div className="space-y-2 mb-3">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
            />
            {options.length > 2 && (
              <button
                className="px-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={() => removeOption(i)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="text-sm text-indigo-600" onClick={addOption}>
          + Add option
        </button>
      </div>

      <label className="block text-sm font-medium mb-1">
        Auto-close (minutes, optional)
      </label>
      <input
        type="number"
        min={0}
        className="w-32 border rounded px-3 py-2 mb-4"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="0"
      />

      <div className="flex justify-end gap-2">
        <button className="px-3 py-1.5 rounded bg-gray-100" onClick={onClose}>
          Cancel
        </button>
        <button
          className="px-3 py-1.5 rounded bg-indigo-600 text-white"
          onClick={submit}
        >
          Create
        </button>
      </div>
    </div>
  );
}
