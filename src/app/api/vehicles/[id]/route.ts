import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getVehicleForUser(id: string, userId: string) {
  return prisma.vehicle.findFirst({
    where: { id, userId },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { id } = await params;

  const vehicle = await getVehicleForUser(id, session.user.id);
  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { id } = await params;

  const vehicle = await getVehicleForUser(id, session.user.id);
  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  const data = await request.json();
  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      name: data.name,
      make: data.make,
      model: data.model,
      year: data.year ? parseInt(data.year) : null,
      licensePlate: data.licensePlate || null,
      fuelType: data.fuelType,
      tankCapacity: data.tankCapacity ? parseFloat(data.tankCapacity) : null,
      initialOdometer: data.initialOdometer ? parseInt(data.initialOdometer) : 0,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { id } = await params;

  const vehicle = await getVehicleForUser(id, session.user.id);
  if (!vehicle) {
    return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
  }

  await prisma.vehicle.delete({ where: { id } });

  return NextResponse.json({ message: "Vozidlo smazáno" });
}
