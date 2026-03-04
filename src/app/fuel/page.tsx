import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, calculateConsumption, formatConsumption } from "@/lib/utils";
import FuelDeleteButton from "@/components/FuelDeleteButton";
import ConsumptionChart from "@/components/ConsumptionChart";

export default async function FuelPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const entries = await prisma.fuelEntry.findMany({
    where: { vehicle: { userId: session.user.id } },
    include: { vehicle: { select: { name: true, fuelType: true } } },
    orderBy: { date: "desc" },
  });

  // Výpočet spotřeby pro každý záznam
  const entriesWithConsumption = entries.map((entry) => {
    const olderEntries = entries
      .filter(
        (e) =>
          e.vehicleId === entry.vehicleId &&
          new Date(e.date) < new Date(entry.date)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const prevEntry = olderEntries[0];
    const consumption = prevEntry
      ? calculateConsumption(entry.quantity, prevEntry.odometer, entry.odometer)
      : null;

    return { ...entry, consumption };
  });

  // Data pro graf - setřídit chronologicky
  const chartData = entriesWithConsumption
    .filter((e) => e.consumption !== null)
    .reverse()
    .map((e) => ({
      date: formatDate(e.date),
      consumption: parseFloat((e.consumption as number).toFixed(1)),
      vehicle: e.vehicle.name,
    }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tankování</h1>
        <Link
          href="/fuel/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
        >
          + Přidat záznam
        </Link>
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Vývoj spotřeby</h2>
          <ConsumptionChart data={chartData} />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Zatím nemáte žádné záznamy o tankování.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vozidlo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">km</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Množství</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Cena</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Spotřeba</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entriesWithConsumption.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3">{entry.vehicle.name}</td>
                  <td className="px-4 py-3 text-right">{entry.odometer.toLocaleString("cs-CZ")}</td>
                  <td className="px-4 py-3 text-right">
                    {entry.quantity.toFixed(1)} {entry.vehicle.fuelType === "ELECTRIC" ? "kWh" : "l"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(entry.totalCost, session.user.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.consumption
                      ? formatConsumption(entry.consumption, entry.vehicle.fuelType)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <FuelDeleteButton id={entry.id} />
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
