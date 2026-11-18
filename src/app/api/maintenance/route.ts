import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const entries = await prisma.maintenanceRecord.findMany({
    where: { vehicle: { userId: session.user.id } },
    include: { vehicle: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON formát" }, { status: 400 });
  }

  const vehicleId = typeof data.vehicleId === "string" ? data.vehicleId : "";
  const maintenanceTypeId = typeof data.maintenanceTypeId === "string" ? data.maintenanceTypeId : "";
  const parsedDate = data.date ? new Date(String(data.date)) : new Date(NaN);

  if (!vehicleId || !maintenanceTypeId || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Chybí povinná pole nebo neplatné datum" }, { status: 400 });
  }

  const [vehicle, maintenanceType] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: session.user.id },
    }),
    prisma.maintenanceType.findFirst({
      where: { id: maintenanceTypeId, userId: session.user.id },
    }),
  ]);

  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }
  if (!maintenanceType) {
    return NextResponse.json({ error: "Typ údržby nenalezen" }, { status: 404 });
  }

  const odometer = data.odometer != null && data.odometer !== "" ? Number(data.odometer) : null;
  const cost = data.cost != null && data.cost !== "" ? Number(data.cost) : null;
  const nextDueOdometer =
    data.nextDueOdometer != null && data.nextDueOdometer !== "" ? Number(data.nextDueOdometer) : null;
  const nextDueDate = data.nextDueDate ? new Date(String(data.nextDueDate)) : null;

  if (
    (odometer !== null && !Number.isFinite(odometer)) ||
    (cost !== null && !Number.isFinite(cost)) ||
    (nextDueOdometer !== null && !Number.isFinite(nextDueOdometer)) ||
    (nextDueDate !== null && Number.isNaN(nextDueDate.getTime()))
  ) {
    return NextResponse.json({ error: "Neplatné číselné hodnoty nebo datum příští kontroly" }, { status: 400 });
  }

  const entry = await prisma.maintenanceRecord.create({
    data: {
      vehicleId,
      maintenanceTypeId,
      date: parsedDate,
      description: typeof data.description === "string" && data.description ? data.description : null,
      odometer: odometer !== null ? Math.trunc(odometer) : null,
      cost,
      nextDueDate,
      nextDueOdometer: nextDueOdometer !== null ? Math.trunc(nextDueOdometer) : null,
      note: typeof data.note === "string" && data.note ? data.note : null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
