// frontend/app/fx/page.tsx
"use client";
import dynamic from "next/dynamic";

const LiveFXWidget = dynamic(() => import("@/components/LiveFXWidget"), { ssr: false });

export default function FXPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Live FX</h1>
      <LiveFXWidget base="INR" symbols={["USD", "EUR", "AED"]} />
      <div className="text-xs opacity-60">
        Served by <code>/api/fx</code>. Set <code>FX_PROVIDER</code> in env to switch provider.
      </div>
    </div>
  );
}
