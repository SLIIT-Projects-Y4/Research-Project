// src/components/forms/MultiSelectPills.jsx
import React from 'react';

export default function MultiSelectPills({ options = [], value = [], onChange }) {
  const toggle = (opt) => {
    const exists = value.includes(opt);
    if (exists) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        const base =
          'px-3 py-2 rounded-full border text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1';
        const styles = active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400';
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`${base} ${styles}`}
            aria-pressed={active}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
