import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const data = await request.json();
  const { name, make, model, year, licensePlate, fuelType, initialOdometer } = data;

  if (!name || !make || !model || !fuelType) {
    return NextResponse.json(
      { error: "Vyplňte všechna povinná pole" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: session.user.id,
      name,
      make,
      model,
      year: year ? parseInt(year) : null,
      licensePlate: licensePlate || null,
      fuelType,
      initialOdometer: initialOdometer ? parseInt(initialOdometer) : 0,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
