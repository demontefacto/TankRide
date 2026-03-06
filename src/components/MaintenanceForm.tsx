"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vehicle {
  id: string;
  name: string;
}

interface MaintenanceTypeOption {
  id: string;
  name: string;
  intervalKm: number | null;
  intervalMonths: number | null;
}

export default function MaintenanceForm({
  vehicles,
  maintenanceTypes: initialTypes,
}: {
  vehicles: Vehicle[];
  maintenanceTypes: MaintenanceTypeOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [types, setTypes] = useState<MaintenanceTypeOption[]>(initialTypes);

  // Nový typ – inline formulář
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeKm, setNewTypeKm] = useState("");
  const [newTypeMonths, setNewTypeMonths] = useState("");
  const [creatingType, setCreatingType] = useState(false);

  // Vybraný typ a auto-výpočet
  const [selectedTypeId, setSelectedTypeId] = useState(types[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [odometer, setOdometer] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [nextDueOdometer, setNextDueOdometer] = useState("");

  // Auto-výpočet při změně typu, data nebo km
  useEffect(() => {
    const selectedType = types.find((t) => t.id === selectedTypeId);
    if (!selectedType) return;

    if (selectedType.intervalMonths && date) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + selectedType.intervalMonths);
      setNextDueDate(d.toISOString().split("T")[0]);
    } else {
      setNextDueDate("");
    }

    if (selectedType.intervalKm && odometer) {
      setNextDueOdometer(String(parseInt(odometer) + selectedType.intervalKm));
    } else {
      setNextDueOdometer("");
    }
  }, [selectedTypeId, date, odometer, types]);

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    setCreatingType(true);

    const res = await fetch("/api/maintenance-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTypeName.trim(),
        intervalKm: newTypeKm || null,
        intervalMonths: newTypeMonths || null,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setTypes((prev) => [...prev, created]);
      setSelectedTypeId(created.id);
      setShowNewType(false);
      setNewTypeName("");
      setNewTypeKm("");
      setNewTypeMonths("");
    }
    setCreatingType(false);
  }

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
        date,
        maintenanceTypeId: selectedTypeId,
        description: formData.get("description") || null,
        odometer: odometer || null,
        cost: formData.get("cost") || null,
        nextDueDate: nextDueDate || null,
        nextDueOdometer: nextDueOdometer || null,
        note: formData.get("note") || null,
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
        <Link href="/vehicles/new" className="text-emerald-600 hover:underline">Vozidla</Link>.
      </p>
    );
  }

  const selectedType = types.find((t) => t.id === selectedTypeId);

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
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Typ údržby *</label>
        <div className="flex gap-2">
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.intervalKm || t.intervalMonths
                  ? ` (${[t.intervalKm ? `${t.intervalKm.toLocaleString("cs-CZ")} km` : "", t.intervalMonths ? `${t.intervalMonths} měs.` : ""].filter(Boolean).join(" / ")})`
                  : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewType(!showNewType)}
            className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            + Nový
          </button>
        </div>
      </div>

      {/* Inline formulář pro nový typ */}
      {showNewType && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nový typ údržby</p>
          <input
            placeholder="Název *"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Interval km (volitelné)"
              type="number"
              min="0"
              value={newTypeKm}
              onChange={(e) => setNewTypeKm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <input
              placeholder="Interval měsíců (volitelné)"
              type="number"
              min="0"
              value={newTypeMonths}
              onChange={(e) => setNewTypeMonths(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateType}
              disabled={creatingType || !newTypeName.trim()}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {creatingType ? "Ukládám..." : "Vytvořit"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewType(false)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
        <input id="description" name="description" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">Stav km</label>
          <input
            id="odometer"
            type="number"
            min="0"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">Cena</label>
          <input id="cost" name="cost" type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Příští termín
            {selectedType?.intervalMonths && (
              <span className="text-xs text-gray-400 ml-1">(auto: +{selectedType.intervalMonths} měs.)</span>
            )}
          </label>
          <input
            id="nextDueDate"
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="nextDueOdometer" className="block text-sm font-medium text-gray-700 mb-1">
            Příští km
            {selectedType?.intervalKm && (
              <span className="text-xs text-gray-400 ml-1">(auto: +{selectedType.intervalKm.toLocaleString("cs-CZ")})</span>
            )}
          </label>
          <input
            id="nextDueOdometer"
            type="number"
            min="0"
            value={nextDueOdometer}
            onChange={(e) => setNextDueOdometer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
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
