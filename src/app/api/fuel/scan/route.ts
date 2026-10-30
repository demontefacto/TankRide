import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

interface ContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface ScanResult {
  quantity: number | null;
  pricePerUnit: number | null;
  totalCost: number | null;
  date: string | null;
  station: string | null;
  fuelType: string | null;
  odometer: number | null;
  fuelLevelPct: number | null;
  fullTank: boolean | null;
  confidenceNotes?: string | null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI skenování není aktivní. Pro aktivaci nastavte GEMINI_API_KEY v souboru .env." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const parts: ContentPart[] = [];

    // Prompt instrukce pro model
    const instruction = `Jsi specializovaný asistent aplikace TankRide pro automatickou digitalizaci záznamů o tankování.
Analyzuj přiložené fotografie (může jít o účtenku z čerpací stanice, fotografii palubní desky / budíků auta, nebo obojí).

Z účtenky z čerpací stanice vyčti:
- quantity: množství natankovaného paliva (v litrech jako číslo, např. 45.20)
- pricePerUnit: jednotková cena za litr paliva (číslo, např. 36.90)
- totalCost: celková cena tankování (číslo, např. 1667.88)
- date: datum tankování ve formátu YYYY-MM-DD
- station: název čerpací stanice včetně města/ulice pokud je uveden (např. "Orlen Benzina Ostrava", "MOL", "Tank ONO")
- fuelType: typ paliva (např. "DIESEL", "NATURAL 95", "LPG", apod.)

Z palubní desky / přístrojové desky vyčti:
- odometer: celkový stav tachometru (celé číslo v km, např. 184520; pozor, hledej celkový nájezd ODO, nikoliv denní trip A/B)
- fuelLevelPct: odhadovaný stav palivoměru po tankování v procentech (číslo 5 až 100)
- fullTank: boolean (true pokud je nádrž plná / ručička na maximu, false pokud ne)

Pravidla:
1. Pokud je údaj nečitelný nebo na fotografii chybí, uveď pro daný klíč hodnotu null.
2. Pokud cena za litr a množství chybí, ale celková cena a množství existují, dopočítej cenu za litr (totalCost / quantity).
3. Vrať VÝHRADNĚ validní JSON s těmito klíči:
{
  "quantity": number | null,
  "pricePerUnit": number | null,
  "totalCost": number | null,
  "date": string | null,
  "station": string | null,
  "fuelType": string | null,
  "odometer": number | null,
  "fuelLevelPct": number | null,
  "fullTank": boolean | null,
  "confidenceNotes": string | null
}`;

    parts.push({ text: instruction });

    // Zpracování nahraných souborů
    const filesToProcess: { file: File; label: string }[] = [];

    const receipt = formData.get("receipt") as File | null;
    const dashboard = formData.get("dashboard") as File | null;
    const genericImage = formData.get("image") as File | null;

    if (receipt && receipt.size > 0) {
      filesToProcess.push({ file: receipt, label: "Účtenka z čerpací stanice" });
    }
    if (dashboard && dashboard.size > 0) {
      filesToProcess.push({ file: dashboard, label: "Palubní deska / tachometr" });
    }
    if (filesToProcess.length === 0 && genericImage && genericImage.size > 0) {
      filesToProcess.push({ file: genericImage, label: "Fotografie k analýze" });
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { error: "Nebyl nahrán žádný obrázek k analýze." },
        { status: 400 }
      );
    }

    for (const item of filesToProcess) {
      const arrayBuffer = await item.file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = item.file.type || "image/jpeg";

      parts.push({
        text: `Následuje soubor: ${item.label} (${item.file.name})`,
      });
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: parts as unknown as string[],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsedData: ScanResult;
    try {
      parsedData = JSON.parse(responseText) as ScanResult;
    } catch {
      console.error("Chyba při parsování JSON z Gemini:", responseText);
      return NextResponse.json(
        { error: "AI nevrátila platný formát dat.", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Chyba při analýze obrázku:", error);
    return NextResponse.json(
      { error: error.message || "Chyba při komunikaci s AI modelem." },
      { status: 500 }
    );
  }
}
