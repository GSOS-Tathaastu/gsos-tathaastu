// frontend/app/what-you-get/page.tsx
export default function WhatYouGet() {
  const items = [
    { title: "Forecasting", desc: "Modern demand sensing. Blend historicals with channel signals; push reliable plans to replenishment." },
    { title: "Inventory", desc: "Smart policies (ABC/XYZ, min-max, safety stock) and automation to reduce stockouts and working capital." },
    { title: "Compliance", desc: "Docs OS for GST/e-way, export docs, and audits. Single source of truth across partners." },
  ];
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">What You Get</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((x) => (
          <div key={x.title} className="border rounded-2xl p-4">
            <div className="font-semibold">{x.title}</div>
            <div className="opacity-80 text-sm mt-1">{x.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
