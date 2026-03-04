import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import VehicleForm from "@/components/VehicleForm";

export default async function NewVehiclePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nové vozidlo</h1>
      <VehicleForm />
    </div>
  );
}
