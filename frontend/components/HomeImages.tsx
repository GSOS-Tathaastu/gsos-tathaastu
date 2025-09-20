"use client";

import Image from "next/image";
import { useState } from "react";

type SafeImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

function SafeImage({ src, alt, width, height, className = "", priority }: SafeImageProps) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`} style={{ width, height }}>
        <span className="text-xs">Image missing: {src}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setOk(false)}
    />
  );
}

export default function HomeImages() {
  return (
    <section className="space-y-10">
      {/* Logo / Tagline */}
      <div className="text-center">
        <SafeImage
          src="/tathaastu-logo.png"
          alt="TATHAASTU Logo"
          width={640}
          height={200}
          className="mx-auto h-auto w-auto"
          priority
        />
      </div>

      {/* Hero banner with subtle overlay (ensures text is readable) */}
      <div className="relative overflow-hidden rounded-2xl border shadow">
        <SafeImage
          src="/operating-system.png"
          alt="Supply Chains need an Operating System"
          width={1600}
          height={640}
          className="w-full h-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h2 className="text-2xl font-bold">The Nervous System of Global Trade</h2>
          <p className="text-sm opacity-90">Identity • Finance • Logistics • Compliance</p>
        </div>
      </div>

      {/* Single feature image */}
      <div className="rounded-2xl border shadow p-3 bg-white">
        <SafeImage
          src="/reality-check.png"
          alt="The Reality Check — Supply Chain Fragmentation"
          width={1600}
          height={1000}
          className="w-full h-auto rounded-xl"
        />
      </div>

      {/* Optional: 3-up story thumbnails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { src: "/story-1.png", alt: "Story 1" },
          { src: "/story-2.png", alt: "Story 2" },
          { src: "/story-3.png", alt: "Story 3" },
        ].map((it) => (
          <div key={it.src} className="rounded-xl border overflow-hidden bg-white">
            <SafeImage src={it.src} alt={it.alt} width={800} height={600} className="w-full h-auto" />
          </div>
        ))}
      </div>
    </section>
  );
}
