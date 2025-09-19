"use client";
import React from "react";

type Props = {
  id: string;
  label: string;
  min?: number;
  max?: number;
  value?: number;
  onChange: (val: number) => void;
};

export default function Likert({ id, label, min = 1, max = 5, value, onChange }: Props) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{label}</legend>
      <div className="flex gap-2">
        {nums.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              className={`w-10 h-10 rounded-full border transition
                ${active ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 hover:border-gray-400"}`}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
