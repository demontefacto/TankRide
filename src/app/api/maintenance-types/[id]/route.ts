import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const existing = await prisma.maintenanceType.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Typ nenalezen" }, { status: 404 });
  }

  const data = await request.json();

  if (!data.name?.trim()) {
    return NextResponse.json({ error: "Název je povinný" }, { status: 400 });
  }

  const updated = await prisma.maintenanceType.update({
    where: { id: params.id },
    data: {
      name: data.name.trim(),
      intervalKm: data.intervalKm !== undefined ? (data.intervalKm ? parseInt(data.intervalKm) : null) : existing.intervalKm,
      intervalMonths: data.intervalMonths !== undefined ? (data.intervalMonths ? parseInt(data.intervalMonths) : null) : existing.intervalMonths,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const existing = await prisma.maintenanceType.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { _count: { select: { records: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Typ nenalezen" }, { status: 404 });
  }

  if (existing._count.records > 0) {
    return NextResponse.json(
      { error: `Typ nelze smazat – má ${existing._count.records} záznam(ů)` },
      { status: 409 }
    );
  }

  await prisma.maintenanceType.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Typ smazán" });
}
