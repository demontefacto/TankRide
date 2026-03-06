import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fuelTypeLabels } from "@/lib/utils";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: {
        select: {
          fuelEntries: true,
          expenseEntries: true,
          maintenance: true,
        },
      },
    },
  });

  if (!vehicle) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{vehicle.name}</h1>
        <Link
          href={`/vehicles/${vehicle.id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Upravit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Značka / Model</dt>
            <dd className="font-medium">{vehicle.make} {vehicle.model}</dd>
          </div>
          {vehicle.year && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Rok výroby</dt>
              <dd className="font-medium">{vehicle.year}</dd>
            </div>
          )}
          {vehicle.licensePlate && (
            <div className="flex justify-between">
              <dt className="text-gray-500">SPZ</dt>
              <dd className="font-medium">{vehicle.licensePlate}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Typ paliva</dt>
            <dd className="font-medium">{fuelTypeLabels[vehicle.fuelType]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Počáteční km</dt>
            <dd className="font-medium">{vehicle.initialOdometer.toLocaleString("cs-CZ")}</dd>
          </div>
          <hr />
          <div className="flex justify-between">
            <dt className="text-gray-500">Záznamů tankování</dt>
            <dd className="font-medium">{vehicle._count.fuelEntries}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Záznamů nákladů</dt>
            <dd className="font-medium">{vehicle._count.expenseEntries}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Záznamů údržby</dt>
            <dd className="font-medium">{vehicle._count.maintenance}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <Link href="/vehicles" className="text-sm text-gray-500 hover:underline">
          ← Zpět na seznam
        </Link>
      </div>
    </div>
  );
}
