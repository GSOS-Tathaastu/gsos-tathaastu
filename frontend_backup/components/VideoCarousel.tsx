"use client";
import { useState } from "react";

type Item = { title: string; src: string };

export default function VideoCarousel({ items }: { items: Item[] }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);
  const active = items[idx];

  return (
    <div className="w-full">
      <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-zinc-200">
        <video key={active.src} className="h-full w-full" src={active.src} controls preload="metadata" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
          <div className="text-sm">{active.title}</div>
        </div>
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button onClick={prev} className="m-2 rounded-full bg-black/50 text-white px-3 py-2 hover:bg-black/70" aria-label="Previous video">‹</button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button onClick={next} className="m-2 rounded-full bg-black/50 text-white px-3 py-2 hover:bg-black/70" aria-label="Next video">›</button>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full ${i === idx ? "bg-black" : "bg-zinc-300"}`}
            aria-label={`Go to video ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
