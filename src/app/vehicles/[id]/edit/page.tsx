import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehicleForm from "@/components/VehicleForm";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!vehicle) notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Upravit vozidlo: {vehicle.name}
      </h1>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
