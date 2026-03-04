import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fuelTypeLabels } from "@/lib/utils";
import VehicleDeleteButton from "@/components/VehicleDeleteButton";

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vozidla</h1>
        <Link
          href="/vehicles/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
        >
          + Přidat vozidlo
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">Zatím nemáte žádná vozidla.</p>
          <Link
            href="/vehicles/new"
            className="text-emerald-600 hover:underline"
          >
            Přidejte své první vozidlo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{v.name}</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {fuelTypeLabels[v.fuelType] || v.fuelType}
                </span>
              </div>
              <p className="text-gray-600 mb-1">
                {v.make} {v.model}{v.year ? ` (${v.year})` : ""}
              </p>
              {v.licensePlate && (
                <p className="text-sm text-gray-500 mb-3">SPZ: {v.licensePlate}</p>
              )}
              <p className="text-sm text-gray-500 mb-4">
                Počáteční km: {v.initialOdometer.toLocaleString("cs-CZ")}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/vehicles/${v.id}`}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  Detail
                </Link>
                <Link
                  href={`/vehicles/${v.id}/edit`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Upravit
                </Link>
                <VehicleDeleteButton id={v.id} name={v.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
