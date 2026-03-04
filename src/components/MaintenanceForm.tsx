"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { maintenanceTypeLabels } from "@/lib/utils";

interface Vehicle { id: string; name: string; }

export default function MaintenanceForm({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: formData.get("vehicleId"),
        date: formData.get("date"),
        type: formData.get("type"),
        description: formData.get("description"),
        odometer: formData.get("odometer") || null,
        cost: formData.get("cost") || null,
        nextDueDate: formData.get("nextDueDate") || null,
        nextDueOdometer: formData.get("nextDueOdometer") || null,
        note: formData.get("note"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Chyba při ukládání");
      setLoading(false);
      return;
    }

    router.push("/maintenance");
    router.refresh();
  }

  if (vehicles.length === 0) {
    return (
      <p className="text-gray-500">
        Nejprve přidejte vozidlo v sekci{" "}
        <a href="/vehicles/new" className="text-emerald-600 hover:underline">Vozidla</a>.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-lg">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      <div>
        <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">Vozidlo *</label>
        <select id="vehicleId" name="vehicleId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
          <input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Typ *</label>
          <select id="type" name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {Object.entries(maintenanceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
        <input id="description" name="description" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">Stav km</label>
          <input id="odometer" name="odometer" type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">Cena</label>
          <input id="cost" name="cost" type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700 mb-1">Příští termín</label>
          <input id="nextDueDate" name="nextDueDate" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label htmlFor="nextDueOdometer" className="block text-sm font-medium text-gray-700 mb-1">Příští km</label>
          <input id="nextDueOdometer" name="nextDueOdometer" type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
        <input id="note" name="note" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {loading ? "Ukládání..." : "Přidat záznam"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Zrušit</button>
      </div>
    </form>
  );
}
