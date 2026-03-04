"use client";

import { useRouter } from "next/navigation";

export default function VehicleDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Opravdu chcete smazat vozidlo "${name}"? Smaží se i všechny záznamy.`)) {
      return;
    }

    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-600 hover:underline"
    >
      Smazat
    </button>
  );
}
