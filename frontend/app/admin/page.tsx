export default function AdminHome() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/health" className="block rounded-xl border p-6 hover:bg-gray-50">
          <h2 className="font-semibold text-lg">System Health</h2>
          <p className="text-sm text-gray-600">Next.js, MongoDB, Backend checks</p>
        </a>

        <a href="/admin/metrics" className="block rounded-xl border p-6 hover:bg-gray-50">
          <h2 className="font-semibold text-lg">Metrics</h2>
          <p className="text-sm text-gray-600">Sessions, submissions, chunks, etc.</p>
        </a>
      </div>
    </main>
  );
}
