import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MaintenanceTypeList from "@/components/MaintenanceTypeList";

export default async function MaintenanceTypesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const types = await prisma.maintenanceType.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { records: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Typy údržby</h1>
        <Link href="/maintenance" className="text-emerald-600 hover:underline text-sm">
          ← Zpět na údržbu
        </Link>
      </div>
      <MaintenanceTypeList
        types={types.map((t) => ({
          id: t.id,
          name: t.name,
          intervalKm: t.intervalKm,
          intervalMonths: t.intervalMonths,
          isDefault: t.isDefault,
          recordCount: t._count.records,
        }))}
      />
    </div>
  );
}
