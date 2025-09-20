"use client";

export default function InvestorDashboard() {
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-8">
      <h1 className="text-3xl font-bold">Investor Dashboard</h1>
      <p className="text-gray-600">
        Secure materials for investors.
      </p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Investor Presentation</h2>
        <div
          className="w-full"
          dangerouslySetInnerHTML={{
            __html:
              `<div id="1758322573597" style="width:100%;max-width:900px;height:600px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:6px;">
                <iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/qGqtoReMFY" scrolling="no"></iframe>
              </div>`,
          }}
        />
      </section>
    </div>
  );
}
