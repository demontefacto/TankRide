import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const entry = await prisma.maintenanceRecord.findFirst({
    where: { id: params.id, vehicle: { userId: session.user.id } },
  });

  if (!entry) {
    return NextResponse.json({ error: "Záznam nenalezen" }, { status: 404 });
  }

  await prisma.maintenanceRecord.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Záznam smazán" });
}
