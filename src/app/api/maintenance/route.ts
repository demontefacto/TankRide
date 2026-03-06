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

  const data = await request.json();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: data.vehicleId, userId: session.user.id },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  const entry = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: data.vehicleId,
      maintenanceTypeId: data.maintenanceTypeId,
      date: new Date(data.date),
      description: data.description || null,
      odometer: data.odometer ? parseInt(data.odometer) : null,
      cost: data.cost ? parseFloat(data.cost) : null,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      nextDueOdometer: data.nextDueOdometer ? parseInt(data.nextDueOdometer) : null,
      note: data.note || null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
