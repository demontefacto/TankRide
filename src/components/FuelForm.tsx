"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vehicle {
  id: string;
  name: string;
  fuelType: string;
  tankCapacity: number | null;
}

export default function FuelForm({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || "");
  const [fullTank, setFullTank] = useState(true);
  const [fuelLevelPct, setFuelLevelPct] = useState(100);

  const totalCost =
    quantity && pricePerUnit
      ? (parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)
      : "";

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicle);
  const isElectric = currentVehicle?.fuelType === "ELECTRIC";
  const unitLabel = isElectric ? "kWh" : "litrů";
  const priceLabel = isElectric ? "Cena za kWh" : "Cena za litr";
  const hasTankCapacity = !!currentVehicle?.tankCapacity;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: formData.get("vehicleId"),
        date: formData.get("date"),
        odometer: formData.get("odometer"),
        quantity: formData.get("quantity"),
        pricePerUnit: formData.get("pricePerUnit"),
        totalCost: totalCost,
        fullTank,
        fuelLevelPct: fullTank ? 100 : fuelLevelPct,
        note: formData.get("note"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Chyba při ukládání");
      setLoading(false);
      return;
    }

    router.push("/fuel");
    router.refresh();
  }

  if (vehicles.length === 0) {
    return (
      <p className="text-gray-500">
        Nejprve přidejte vozidlo v sekci{" "}
        <Link href="/vehicles/new" className="text-emerald-600 hover:underline">
          Vozidla
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-lg">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
          Vozidlo *
        </label>
        <select
          id="vehicleId"
          name="vehicleId"
          required
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Datum *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">
            Stav km *
          </label>
          <input
            id="odometer"
            name="odometer"
            type="number"
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Množství ({unitLabel}) *
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            required
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
            {priceLabel} *
          </label>
          <input
            id="pricePerUnit"
            name="pricePerUnit"
            type="number"
            step="0.01"
            required
            min="0"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {totalCost && (
        <div className="bg-gray-50 p-3 rounded-md">
          <span className="text-sm text-gray-600">Celková cena: </span>
          <span className="font-semibold">{parseFloat(totalCost).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          id="fullTank"
          type="checkbox"
          checked={fullTank}
          onChange={(e) => {
            setFullTank(e.target.checked);
            if (e.target.checked) setFuelLevelPct(100);
          }}
          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
        />
        <label htmlFor="fullTank" className="text-sm font-medium text-gray-700">
          Tankováno do plna
        </label>
      </div>

      {!fullTank && hasTankCapacity && (
        <div>
          <label htmlFor="fuelLevelPct" className="block text-sm font-medium text-gray-700 mb-1">
            Stav nádrže po tankování: {fuelLevelPct} %
          </label>
          <input
            id="fuelLevelPct"
            type="range"
            min="5"
            max="95"
            step="5"
            value={fuelLevelPct}
            onChange={(e) => setFuelLevelPct(parseInt(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 %</span>
            <span>50 %</span>
            <span>95 %</span>
          </div>
        </div>
      )}

      {!fullTank && !hasTankCapacity && (
        <p className="text-xs text-amber-600">
          Tip: Zadejte objem nádrže u vozidla, aby se dala lépe odhadnout spotřeba u částečného tankování.
        </p>
      )}

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Poznámka
        </label>
        <input
          id="note"
          name="note"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Ukládání..." : "Přidat záznam"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
