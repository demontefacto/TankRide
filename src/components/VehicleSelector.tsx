"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Vehicle {
  id: string;
  name: string;
}

export default function VehicleSelector({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("vehicleId") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/?vehicleId=${value}`);
    } else {
      router.push("/");
    }
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">Všechna vozidla</option>
      {vehicles.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}
