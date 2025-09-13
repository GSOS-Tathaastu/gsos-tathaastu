export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">A neutral operating layer for global trade.</h1>
      <p className="mt-4 text-lg text-gray-600">
        GSOS connects identity, finance, logistics, and compliance—so SMEs trade like enterprises.
      </p>
      <div className="mt-8 flex gap-3">
        <a className="bg-indigo-600 text-white px-4 py-2 rounded" href="/survey">Take the Readiness Survey</a>
        <a className="border px-4 py-2 rounded" href="/contact">Book a Demo</a>
      </div>
    </main>
  );
}
