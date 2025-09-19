"use client";

import { useState } from "react";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");

  const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASS || "gsos123";

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-20 border rounded-xl shadow bg-white">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <input
          type="password"
          className="w-full border rounded p-2 mb-4"
          placeholder="Enter admin password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="w-full rounded bg-indigo-600 text-white px-4 py-2"
          onClick={() => {
            if (input === PASSWORD) setAuthed(true);
            else alert("Incorrect password");
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">System Health</h1>
      {/* keep your existing health components here */}
    </div>
  );
}
