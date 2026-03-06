/**
 * Formátování měny
 */
export function formatCurrency(amount: number, currency: string = "CZK"): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Jednoduchý výpočet spotřeby (záložní)
 */
export function calculateConsumptionSimple(
  quantity: number,
  odometerStart: number,
  odometerEnd: number
): number | null {
  const distance = odometerEnd - odometerStart;
  if (distance <= 0) return null;
  return (quantity / distance) * 100;
}

interface FuelEntryForCalc {
  id: string;
  vehicleId: string;
  date: Date;
  odometer: number;
  quantity: number;
  fullTank: boolean;
  fuelLevelPct: number | null;
}

/**
 * Inteligentní výpočet spotřeby pro seřazený seznam záznamů jednoho vozidla.
 *
 * Metoda "od plné po plnou":
 * - Pokud aktuální i předchozí referentní tankování je do plna,
 *   sečte litry všech tankování od posledního plného a vydělí vzdáleností.
 *
 * S odhadem přes % nádrže:
 * - Pokud známe velikost nádrže a % po tankování u obou záznamů,
 *   spotřeba = (palivo_po_A - palivo_po_B + natankované_B) / vzdálenost * 100
 */
export function calculateConsumptionSmart(
  entries: FuelEntryForCalc[],
  tankCapacity: number | null
): Map<string, number | null> {
  const result = new Map<string, number | null>();

  // Setřídit chronologicky
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (i === 0) {
      result.set(current.id, null);
      continue;
    }

    // Metoda 1: Od plné po plnou
    if (current.fullTank) {
      // Najdi poslední plné tankování před tímto
      let refIndex = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (sorted[j].fullTank) {
          refIndex = j;
          break;
        }
      }

      if (refIndex >= 0) {
        // Sečte litry všech tankování MEZI ref a current (včetně current, bez ref)
        let totalQuantity = 0;
        for (let j = refIndex + 1; j <= i; j++) {
          totalQuantity += sorted[j].quantity;
        }
        const distance = current.odometer - sorted[refIndex].odometer;
        if (distance > 0) {
          result.set(current.id, (totalQuantity / distance) * 100);
          continue;
        }
      }
    }

    // Metoda 2: Odhad přes % nádrže
    const prev = sorted[i - 1];
    if (
      tankCapacity &&
      tankCapacity > 0 &&
      current.fuelLevelPct !== null &&
      prev.fuelLevelPct !== null
    ) {
      const fuelAfterPrev = (tankCapacity * prev.fuelLevelPct) / 100;
      const fuelAfterCurrent = (tankCapacity * current.fuelLevelPct) / 100;
      const consumed = fuelAfterPrev - fuelAfterCurrent + current.quantity;
      const distance = current.odometer - prev.odometer;
      if (distance > 0 && consumed > 0) {
        result.set(current.id, (consumed / distance) * 100);
        continue;
      }
    }

    // Metoda 3: Záložní – pouze pokud oba záznamy jsou plné (již pokryto výše)
    // nebo jednoduchý výpočet pokud je aktuální plné a předchozí je hned předtím
    result.set(current.id, null);
  }

  return result;
}

/**
 * Formátování spotřeby
 */
export function formatConsumption(
  value: number,
  fuelType: string
): string {
  const unit = fuelType === "ELECTRIC" ? "kWh" : "l";
  return `${value.toFixed(1)} ${unit}/100 km`;
}

/**
 * Formátování data
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Label pro typ paliva
 */
export const fuelTypeLabels: Record<string, string> = {
  GASOLINE: "Benzín",
  DIESEL: "Diesel",
  LPG: "LPG",
  CNG: "CNG",
  ELECTRIC: "Elektřina",
  HYBRID: "Hybrid",
};

/**
 * Label pro kategorii výdajů
 */
export const expenseCategoryLabels: Record<string, string> = {
  SERVICE: "Servis",
  SPARE_PARTS: "Náhradní díly",
  INSURANCE: "Povinné ručení",
  OTHER: "Ostatní",
};

/**
 * Label pro typ údržby
 */
export const maintenanceTypeLabels: Record<string, string> = {
  OIL_CHANGE: "Výměna oleje",
  STK: "STK",
  EMISSION_TEST: "Emise",
  TIRE_CHANGE: "Výměna pneumatik",
  BRAKE_CHECK: "Brzdy",
  OTHER: "Ostatní",
};

/**
 * Dostupné měny
 */
export const currencies = [
  { value: "CZK", label: "CZK – Česká koruna" },
  { value: "EUR", label: "EUR – Euro" },
  { value: "USD", label: "USD – Americký dolar" },
  { value: "PLN", label: "PLN – Polský zlotý" },
  { value: "GBP", label: "GBP – Britská libra" },
];
