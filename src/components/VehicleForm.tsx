"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fuelTypeLabels } from "@/lib/utils";

interface VehicleFormProps {
  vehicle?: {
    id: string;
    name: string;
    make: string;
    model: string;
    year: number | null;
    licensePlate: string | null;
    fuelType: string;
    tankCapacity: number | null;
    initialOdometer: number;
  };
}

export default function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = !!vehicle;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      make: formData.get("make"),
      model: formData.get("model"),
      year: formData.get("year"),
      licensePlate: formData.get("licensePlate"),
      fuelType: formData.get("fuelType"),
      tankCapacity: formData.get("tankCapacity"),
      initialOdometer: formData.get("initialOdometer"),
    };

    const url = isEditing ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      try {
        const data = await res.json();
        setError(data.error || "Chyba při ukládání");
      } catch {
        setError(`Chyba serveru (${res.status})`);
      }
      setLoading(false);
      return;
    }

    router.push("/vehicles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-lg">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Název *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={vehicle?.name}
          placeholder="např. Moje auto"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
            Značka *
          </label>
          <input
            id="make"
            name="make"
            required
            defaultValue={vehicle?.make}
            placeholder="např. Škoda"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
            Model *
          </label>
          <input
            id="model"
            name="model"
            required
            defaultValue={vehicle?.model}
            placeholder="např. Octavia"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Rok výroby
          </label>
          <input
            id="year"
            name="year"
            type="number"
            min="1900"
            max="2099"
            defaultValue={vehicle?.year ?? ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
            SPZ
          </label>
          <input
            id="licensePlate"
            name="licensePlate"
            defaultValue={vehicle?.licensePlate ?? ""}
            placeholder="např. 1A2 3456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">
            Typ paliva *
          </label>
        <select
          id="fuelType"
          name="fuelType"
          required
          defaultValue={vehicle?.fuelType ?? "GASOLINE"}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {Object.entries(fuelTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        </div>
        <div>
          <label htmlFor="tankCapacity" className="block text-sm font-medium text-gray-700 mb-1">
            Objem nádrže (l / kWh)
          </label>
          <input
            id="tankCapacity"
            name="tankCapacity"
            type="number"
            step="0.1"
            min="0"
            defaultValue={vehicle?.tankCapacity ?? ""}
            placeholder="např. 50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="initialOdometer" className="block text-sm font-medium text-gray-700 mb-1">
          Počáteční stav km
        </label>
        <input
          id="initialOdometer"
          name="initialOdometer"
          type="number"
          min="0"
          defaultValue={vehicle?.initialOdometer ?? 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Ukládání..." : isEditing ? "Uložit změny" : "Přidat vozidlo"}
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
