// frontend/components/HealthGrid.tsx
"use client";

type CardProps = {
  title: string;
  status: "ok" | "degraded" | "down";
  latency?: number;
  details?: string;
};

function StatusBadge({ status }: { status: CardProps["status"] }) {
  const m = {
    ok: "bg-green-100 text-green-800",
    degraded: "bg-amber-100 text-amber-800",
    down: "bg-red-100 text-red-800",
  }[status];
  const label = { ok: "OK", degraded: "Degraded", down: "Down" }[status];
  return <span className={`px-2 py-1 text-xs rounded-full ${m}`}>{label}</span>;
}

export function HealthCard(props: CardProps) {
  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{props.title}</h3>
        <StatusBadge status={props.status} />
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {props.latency !== undefined && (
          <div>Latency: <span className="font-mono">{props.latency} ms</span></div>
        )}
        {props.details && (
          <div className="mt-1 whitespace-pre-wrap break-words">{props.details}</div>
        )}
      </div>
    </div>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>;
}
