"use client";

import { useRouter } from "next/navigation";

export default function FuelDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Opravdu chcete smazat tento záznam?")) return;
    const res = await fetch(`/api/fuel/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
      Smazat
    </button>
  );
}
