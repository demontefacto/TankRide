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
 * Výpočet spotřeby mezi dvěma tankováními
 * Vrací l/100km nebo kWh/100km
 */
export function calculateConsumption(
  quantity: number,
  odometerStart: number,
  odometerEnd: number
): number | null {
  const distance = odometerEnd - odometerStart;
  if (distance <= 0) return null;
  return (quantity / distance) * 100;
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
