import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, calculateConsumptionSmart, expenseCategoryLabels } from "@/lib/utils";
import { CategoryPieChart, MonthlyCostChart } from "@/components/DashboardCharts";
import VehicleSelector from "@/components/VehicleSelector";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { vehicleId: vehicleIdParam } = await searchParams;
  const userId = session.user.id;
  const currency = session.user.currency;
  const vehicleId = vehicleIdParam || null;

  // Filtr podle vozidla
  const vehicleFilter = vehicleId
    ? { vehicleId, vehicle: { userId } }
    : { vehicle: { userId } };

  // Načíst všechna data
  const [vehicles, fuelEntries, expenseEntries, maintenanceRecords] = await Promise.all([
    prisma.vehicle.findMany({ where: { userId } }),
    prisma.fuelEntry.findMany({
      where: vehicleFilter,
      include: { vehicle: { select: { fuelType: true, tankCapacity: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.expenseEntry.findMany({ where: vehicleFilter }),
    prisma.maintenanceRecord.findMany({ where: vehicleFilter }),
  ]);

  // Celkové náklady
  const totalFuel = fuelEntries.reduce((s, e) => s + e.totalCost, 0);
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.cost, 0);
  const totalMaintenance = maintenanceRecords.reduce((s, e) => s + (e.cost || 0), 0);
  const totalAll = totalFuel + totalExpenses + totalMaintenance;

  // Průměrná spotřeba (smart výpočet)
  let avgConsumption: number | null = null;
  if (fuelEntries.length >= 2) {
    const consumptions: number[] = [];
    const byVehicle = new Map<string, typeof fuelEntries>();
    for (const e of fuelEntries) {
      const arr = byVehicle.get(e.vehicleId) || [];
      arr.push(e);
      byVehicle.set(e.vehicleId, arr);
    }
    byVehicle.forEach((entries) => {
      const tankCapacity = entries[0]?.vehicle?.tankCapacity ?? null;
      const smartResults = calculateConsumptionSmart(
        entries.map((e) => ({
          id: e.id,
          vehicleId: e.vehicleId,
          date: e.date,
          odometer: e.odometer,
          quantity: e.quantity,
          fullTank: e.fullTank,
          fuelLevelPct: e.fuelLevelPct,
        })),
        tankCapacity
      );
      smartResults.forEach((c) => {
        if (c !== null && c > 0 && c < 50) consumptions.push(c);
      });
    });
    if (consumptions.length > 0) {
      avgConsumption = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
    }
  }

  // Náklady na km
  const maxOdometer = fuelEntries.length > 0
    ? Math.max(...fuelEntries.map((e) => e.odometer))
    : 0;
  const minOdometer = fuelEntries.length > 0
    ? Math.min(...fuelEntries.map((e) => e.odometer))
    : 0;
  const totalKm = maxOdometer - minOdometer;
  const costPerKm = totalKm > 0 ? totalAll / totalKm : null;

  // Data pro koláčový graf
  const categoryData = [
    { name: "Palivo", value: Math.round(totalFuel) },
    ...Object.entries(
      expenseEntries.reduce<Record<string, number>>((acc, e) => {
        const label = expenseCategoryLabels[e.category] || e.category;
        acc[label] = (acc[label] || 0) + e.cost;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value: Math.round(value) })),
    { name: "Údržba", value: Math.round(totalMaintenance) },
  ].filter((d) => d.value > 0);

  // Data pro měsíční graf
  const monthlyMap = new Map<string, { fuel: number; expenses: number; maintenance: number }>();
  const toMonth = (d: Date) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };
  fuelEntries.forEach((e) => {
    const m = toMonth(e.date);
    const cur = monthlyMap.get(m) || { fuel: 0, expenses: 0, maintenance: 0 };
    cur.fuel += e.totalCost;
    monthlyMap.set(m, cur);
  });
  expenseEntries.forEach((e) => {
    const m = toMonth(e.date);
    const cur = monthlyMap.get(m) || { fuel: 0, expenses: 0, maintenance: 0 };
    cur.expenses += e.cost;
    monthlyMap.set(m, cur);
  });
  maintenanceRecords.forEach((e) => {
    const m = toMonth(e.date);
    const cur = monthlyMap.get(m) || { fuel: 0, expenses: 0, maintenance: 0 };
    cur.maintenance += e.cost || 0;
    monthlyMap.set(m, cur);
  });
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      fuel: Math.round(data.fuel),
      expenses: Math.round(data.expenses),
      maintenance: Math.round(data.maintenance),
    }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {vehicles.length > 0 && (
          <VehicleSelector vehicles={vehicles.map((v) => ({ id: v.id, name: v.name }))} />
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-2">Vítejte v TankRide, {session.user.name}!</p>
          <p className="text-gray-400">
            Začněte přidáním svého prvního{" "}
            <a href="/vehicles/new" className="text-emerald-600 hover:underline">vozidla</a>.
          </p>
        </div>
      ) : (
        <>
          {/* Statistické karty */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500 mb-1">Celkové náklady</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAll, currency)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500 mb-1">Palivo celkem</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalFuel, currency)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500 mb-1">Průměrná spotřeba</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgConsumption ? `${avgConsumption.toFixed(1)} l/100km` : "—"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500 mb-1">Náklady na km</p>
              <p className="text-2xl font-bold text-gray-900">
                {costPerKm ? `${costPerKm.toFixed(2)} ${currency}/km` : "—"}
              </p>
            </div>
          </div>

          {/* Grafy */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Rozložení výdajů</h2>
              <CategoryPieChart data={categoryData} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Měsíční náklady</h2>
              <MonthlyCostChart data={monthlyData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
