import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, name, password, currency } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Vyplňte všechna povinná pole" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Heslo musí mít alespoň 6 znaků" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 409 }
      );
    }

    const validCurrencies = ["CZK", "EUR", "USD", "PLN", "GBP"];
    const userCurrency = validCurrencies.includes(currency) ? currency : "CZK";

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        currency: userCurrency,
      },
    });

    return NextResponse.json({ message: "Registrace úspěšná" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Chyba serveru při registraci" },
      { status: 500 }
    );
  }
}
