import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  const entries = await prisma.expenseEntry.findMany({
    where: {
      vehicle: { userId: session.user.id },
      ...(vehicleId ? { vehicleId } : {}),
    },
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

  const entry = await prisma.expenseEntry.create({
    data: {
      vehicleId: data.vehicleId,
      date: new Date(data.date),
      category: data.category,
      description: data.description,
      cost: parseFloat(data.cost),
      odometer: data.odometer ? parseInt(data.odometer) : null,
      note: data.note || null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
