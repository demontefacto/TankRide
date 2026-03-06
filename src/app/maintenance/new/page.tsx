import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MaintenanceForm from "@/components/MaintenanceForm";

export default async function NewMaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [vehicles, maintenanceTypes] = await Promise.all([
    prisma.vehicle.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.maintenanceType.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, intervalKm: true, intervalMonths: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nový záznam údržby</h1>
      <MaintenanceForm vehicles={vehicles} maintenanceTypes={maintenanceTypes} />
    </div>
  );
}
