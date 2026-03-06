import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const types = await prisma.maintenanceType.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { records: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.name?.trim()) {
    return NextResponse.json({ error: "Název je povinný" }, { status: 400 });
  }

  const type = await prisma.maintenanceType.create({
    data: {
      userId: session.user.id,
      name: data.name.trim(),
      intervalKm: data.intervalKm ? parseInt(data.intervalKm) : null,
      intervalMonths: data.intervalMonths ? parseInt(data.intervalMonths) : null,
      isDefault: false,
    },
  });

  return NextResponse.json(type, { status: 201 });
}
