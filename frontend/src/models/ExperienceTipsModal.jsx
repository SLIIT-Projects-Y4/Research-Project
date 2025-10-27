// components/ExperienceTipsModal.jsx
import React from "react";

export default function ExperienceTipsModal({ tips, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-6 rounded shadow-lg overflow-y-auto max-h-[80vh]">
        <h3 className="text-lg font-semibold mb-3">📝 Travel Tips Shared So Far</h3>
        {tips.length === 0 ? (
          <p className="text-gray-500">No tips shared yet.</p>
        ) : (
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i}>
                <strong className="text-orange-500">{tip.user}</strong>: {tip.message}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-amber-300 text-black rounded hover:bg-amber-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
