"use client";
import React from "react";

type Props = {
  id: string;
  label: string;
  options: string[];
  value?: string;
  onChange: (val: string) => void;
};

export default function MCQ({ id, label, options, value, onChange }: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const checked = value === opt;
          return (
            <label
              key={opt}
              className={`border rounded-xl px-4 py-3 cursor-pointer transition 
                ${checked ? "border-indigo-600 ring-2 ring-indigo-500" : "border-gray-300 hover:border-gray-400"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name={id}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                aria-checked={checked}
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
