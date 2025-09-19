export default function AdminIndex() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p>Choose a tool:</p>
      <ul className="list-disc pl-6">
        <li><a className="text-indigo-700 underline" href="/admin/health">System Health</a></li>
      </ul>
    </div>
  );
}
