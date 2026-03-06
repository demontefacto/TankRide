import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import DeleteButton from "@/components/DeleteButton";

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const entries = await prisma.maintenanceRecord.findMany({
    where: { vehicle: { userId: session.user.id } },
    include: {
      vehicle: { select: { name: true } },
      maintenanceType: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Údržba</h1>
          <Link href="/maintenance/types" className="text-sm text-emerald-600 hover:underline">
            Správa typů
          </Link>
        </div>
        <Link href="/maintenance/new" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors">
          + Přidat záznam
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Zatím nemáte žádné záznamy o údržbě.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vozidlo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Typ</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Popis</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Cena</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Příští termín</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3">{entry.vehicle.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      {entry.maintenanceType.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.description || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {entry.cost ? formatCurrency(entry.cost, session.user.currency) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.nextDueDate ? formatDate(entry.nextDueDate) : ""}
                    {entry.nextDueOdometer ? ` / ${entry.nextDueOdometer.toLocaleString("cs-CZ")} km` : ""}
                    {!entry.nextDueDate && !entry.nextDueOdometer ? "—" : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton apiPath={`/api/maintenance/${entry.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
