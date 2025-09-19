// frontend/components/FlowCanvas.tsx
"use client";

type Status = "ok" | "degraded" | "down";
type NodeKey = "browser" | "next" | "mongo" | "backend";

export function FlowCanvas(props: {
  statuses: Partial<Record<NodeKey, Status>>;
}) {
  const s = (k: NodeKey) => props.statuses[k] || "degraded";
  const fillFor = (st: Status) =>
    ({ ok: "#dcfce7", degraded: "#fef9c3", down: "#fee2e2" }[st]);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border bg-white p-4">
      <svg width="900" height="220" viewBox="0 0 900 220">
        {/* Browser */}
        <rect x="20" y="80" width="180" height="60" rx="16" fill={fillFor(s("browser"))} stroke="#111" />
        <text x="110" y="115" textAnchor="middle" fontSize="14">Browser / Client</text>

        {/* Next */}
        <rect x="250" y="80" width="180" height="60" rx="16" fill={fillFor(s("next"))} stroke="#111" />
        <text x="340" y="115" textAnchor="middle" fontSize="14">Next.js API</text>

        {/* Mongo */}
        <rect x="480" y="20" width="180" height="60" rx="16" fill={fillFor(s("mongo"))} stroke="#111" />
        <text x="570" y="55" textAnchor="middle" fontSize="14">MongoDB</text>

        {/* Backend */}
        <rect x="480" y="140" width="180" height="60" rx="16" fill={fillFor(s("backend"))} stroke="#111" />
        <text x="570" y="175" textAnchor="middle" fontSize="14">Railway Backend</text>

        {/* Arrows */}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#111" />
          </marker>
        </defs>

        {/* Browser -> Next */}
        <line x1="200" y1="110" x2="250" y2="110" stroke="#111" strokeWidth="2" markerEnd="url(#arrow)" />
        {/* Next -> Mongo */}
        <line x1="430" y1="90" x2="480" y2="50" stroke="#111" strokeWidth="2" markerEnd="url(#arrow)" />
        {/* Next -> Backend */}
        <line x1="430" y1="130" x2="480" y2="170" stroke="#111" strokeWidth="2" markerEnd="url(#arrow)" />
      </svg>
    </div>
  );
}
