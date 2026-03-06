"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TypeItem {
  id: string;
  name: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  isDefault: boolean;
  recordCount: number;
}

export default function MaintenanceTypeList({ types: initialTypes }: { types: TypeItem[] }) {
  const router = useRouter();
  const [types, setTypes] = useState(initialTypes);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKm, setEditKm] = useState("");
  const [editMonths, setEditMonths] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Nový typ
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKm, setNewKm] = useState("");
  const [newMonths, setNewMonths] = useState("");

  function startEdit(t: TypeItem) {
    setEditId(t.id);
    setEditName(t.name);
    setEditKm(t.intervalKm?.toString() || "");
    setEditMonths(t.intervalMonths?.toString() || "");
    setError("");
  }

  async function handleSave() {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/maintenance-types/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        intervalKm: editKm || null,
        intervalMonths: editMonths || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setTypes((prev) => prev.map((t) => (t.id === editId ? { ...t, ...updated } : t)));
      setEditId(null);
    } else {
      const data = await res.json();
      setError(data.error || "Chyba při ukládání");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tento typ?")) return;
    setError("");

    const res = await fetch(`/api/maintenance-types/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTypes((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Chyba při mazání");
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/maintenance-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        intervalKm: newKm || null,
        intervalMonths: newMonths || null,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setTypes((prev) => [...prev, { ...created, isDefault: false, recordCount: 0 }]);
      setShowNew(false);
      setNewName("");
      setNewKm("");
      setNewMonths("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Chyba při vytváření");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Název</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Interval km</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Interval měsíců</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Záznamů</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                {editId === t.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={editKm}
                        onChange={(e) => setEditKm(e.target.value)}
                        placeholder="—"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={editMonths}
                        onChange={(e) => setEditMonths(e.target.value)}
                        placeholder="—"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">{t.recordCount}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-emerald-600 hover:underline text-xs mr-2 disabled:opacity-50"
                      >
                        Uložit
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-gray-400 hover:underline text-xs"
                      >
                        Zrušit
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-right">
                      {t.intervalKm ? `${t.intervalKm.toLocaleString("cs-CZ")} km` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.intervalMonths ? `${t.intervalMonths} měs.` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{t.recordCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-emerald-600 hover:underline text-xs mr-2"
                      >
                        Upravit
                      </button>
                      {t.recordCount === 0 && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Smazat
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nový typ */}
      {showNew ? (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3 max-w-lg">
          <p className="font-medium text-gray-700">Nový typ údržby</p>
          <input
            placeholder="Název *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Interval km (volitelné)"
              type="number"
              min="0"
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              placeholder="Interval měsíců (volitelné)"
              type="number"
              min="0"
              value={newMonths}
              onChange={(e) => setNewMonths(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Ukládám..." : "Vytvořit"}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Zrušit
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm"
        >
          + Přidat typ
        </button>
      )}
    </div>
  );
}
