"use client";

import { useEffect, useState } from "react";

interface Key {
  id: string;
  label: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export function ApiKeys() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    if (res.ok) setKeys(data.keys ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label || "API key" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create key");
      return;
    }
    setNewKey(data.key);
    setLabel("");
    load();
  }

  async function revoke(id: string) {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">API keys</h2>
        <a href="/developers" className="text-xs text-brand hover:underline">API docs →</a>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Use the REST API to check shipments from your own systems (for forwarders / 3PLs).
      </p>

      {newKey && (
        <div className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-800">Copy this key now — it won&apos;t be shown again:</p>
          <code className="mt-1 block break-all rounded bg-white p-2 text-xs">{newKey}</code>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Key label (e.g. Production)"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button onClick={create} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Generate key
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-slate-500">No keys yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-1 font-medium">Label</th>
                <th className="py-1 font-medium">Requests</th>
                <th className="py-1 font-medium">Last used</th>
                <th className="py-1 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-slate-100">
                  <td className="py-2">{k.label}</td>
                  <td className="py-2">{k.usage_count}</td>
                  <td className="py-2 text-slate-500">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => revoke(k.id)} className="text-xs text-red-600 hover:underline">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
