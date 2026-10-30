"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vehicle {
  id: string;
  name: string;
  fuelType: string;
  tankCapacity: number | null;
}

interface ScanData {
  quantity?: number | null;
  pricePerUnit?: number | null;
  totalCost?: number | null;
  date?: string | null;
  station?: string | null;
  fuelType?: string | null;
  odometer?: number | null;
  fuelLevelPct?: number | null;
  fullTank?: boolean | null;
}

export default function FuelForm({
  vehicles,
  aiScanEnabled = false,
}: {
  vehicles: Vehicle[];
  aiScanEnabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [odometer, setOdometer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || "");
  const [fullTank, setFullTank] = useState(true);
  const [fuelLevelPct, setFuelLevelPct] = useState(100);

  // Stavy pro AI skenování
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [dashboardPreview, setDashboardPreview] = useState<string | null>(null);

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const dashboardInputRef = useRef<HTMLInputElement>(null);

  const totalCost =
    quantity && pricePerUnit
      ? (parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)
      : "";

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicle);
  const isElectric = currentVehicle?.fuelType === "ELECTRIC";
  const unitLabel = isElectric ? "kWh" : "litrů";
  const priceLabel = isElectric ? "Cena za kWh" : "Cena za litr";
  const hasTankCapacity = !!currentVehicle?.tankCapacity;

  async function performScan(files: { receipt?: File | null; dashboard?: File | null }) {
    if (!files.receipt && !files.dashboard) return;

    setScanning(true);
    setScanMessage(null);
    setError("");

    try {
      const formData = new FormData();
      if (files.receipt) formData.append("receipt", files.receipt);
      if (files.dashboard) formData.append("dashboard", files.dashboard);

      const res = await fetch("/api/fuel/scan", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Nepodařilo se vytěžit data z fotografie.");
      }

      const d: ScanData = resData.data;
      const loadedItems: string[] = [];

      if (d.quantity != null) {
        setQuantity(d.quantity.toString());
        loadedItems.push(`${d.quantity} ${unitLabel}`);
      }
      if (d.pricePerUnit != null) {
        setPricePerUnit(d.pricePerUnit.toString());
        loadedItems.push(`${d.pricePerUnit} Kč/${unitLabel.slice(0, 1)}`);
      }
      if (d.odometer != null) {
        setOdometer(d.odometer.toString());
        loadedItems.push(`${d.odometer} km`);
      }
      if (d.date) {
        setDate(d.date);
        loadedItems.push(`datum: ${d.date}`);
      }
      if (d.fullTank != null) {
        setFullTank(d.fullTank);
        if (d.fuelLevelPct != null) {
          setFuelLevelPct(d.fuelLevelPct);
        }
      } else if (d.fuelLevelPct != null) {
        setFuelLevelPct(d.fuelLevelPct);
        setFullTank(d.fuelLevelPct >= 95);
      }
      if (d.station) {
        const stationText = d.fuelType ? `${d.station} (${d.fuelType})` : d.station;
        setNote((prev) => (prev ? `${prev} | ${stationText}` : stationText));
        loadedItems.push(d.station);
      }

      if (loadedItems.length > 0) {
        setScanMessage({
          text: `✨ Úspěšně načteno: ${loadedItems.join(", ")}. Zkontrolujte údaje a uložte.`,
        });
      } else {
        setScanMessage({
          text: "Fotografie byla zpracována, ale nepodařilo se jednoznačně určit hodnoty. Vyplňte prosím pole ručně.",
          isError: true,
        });
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Chyba při skenování:", errorObj);
      setScanMessage({
        text: `Chyba při AI analýze: ${errorObj.message}`,
        isError: true,
      });
    } finally {
      setScanning(false);
    }
  }

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptPreview(URL.createObjectURL(file));
    performScan({ receipt: file });
  }

  function handleDashboardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setDashboardPreview(URL.createObjectURL(file));
    performScan({ dashboard: file });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: selectedVehicle,
        date,
        odometer: parseInt(odometer),
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        totalCost,
        fullTank,
        fuelLevelPct: fullTank ? 100 : fuelLevelPct,
        note: note || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Chyba při ukládání");
      setLoading(false);
      return;
    }

    router.push("/fuel");
    router.refresh();
  }

  if (vehicles.length === 0) {
    return (
      <p className="text-gray-500">
        Nejprve přidejte vozidlo v sekci{" "}
        <Link href="/vehicles/new" className="text-emerald-600 hover:underline">
          Vozidla
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* 📸 AI Skenovací modul (volitelný, pouze pokud je nastaven GEMINI_API_KEY) */}
      {aiScanEnabled && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📸</span>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Chytré načtení z fotky</h2>
                <p className="text-xs text-gray-600">Vyfoť účtenku nebo budíky a AI formulář vyplní za tebe</p>
              </div>
            </div>
            {scanning && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 animate-pulse">
                Analyzuji...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Tlačítko Účtenka */}
            <div>
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReceiptChange}
              />
              <button
                type="button"
                disabled={scanning}
                onClick={() => receiptInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-3.5 bg-white hover:bg-emerald-50/50 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-800 transition font-medium text-xs shadow-sm hover:border-emerald-500 disabled:opacity-50"
              >
                {receiptPreview ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden border border-emerald-400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptPreview} alt="Účtenka" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-2xl">🧾</span>
                )}
                <span>{receiptPreview ? "Změnit účtenku" : "Vyfotit účtenku"}</span>
              </button>
            </div>

            {/* Tlačítko Palubka */}
            <div>
              <input
                ref={dashboardInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleDashboardChange}
              />
              <button
                type="button"
                disabled={scanning}
                onClick={() => dashboardInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-3.5 bg-white hover:bg-teal-50/50 border-2 border-dashed border-teal-300 rounded-lg text-teal-800 transition font-medium text-xs shadow-sm hover:border-teal-500 disabled:opacity-50"
              >
                {dashboardPreview ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden border border-teal-400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dashboardPreview} alt="Palubka" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-2xl">🚗</span>
                )}
                <span>{dashboardPreview ? "Změnit palubku" : "Vyfotit tachometr"}</span>
              </button>
            </div>
          </div>

          {scanMessage && (
            <div
              className={`mt-4 p-3 rounded-lg text-xs font-medium ${
                scanMessage.isError
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}
            >
              {scanMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Hlavní formulář */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-4 border border-gray-100">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
        )}

        <div>
          <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
            Vozidlo *
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            required
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">
              Stav km *
            </label>
            <input
              id="odometer"
              name="odometer"
              type="number"
              required
              min="0"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="např. 184500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Množství ({unitLabel}) *
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              required
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="např. 45.20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
              {priceLabel} *
            </label>
            <input
              id="pricePerUnit"
              name="pricePerUnit"
              type="number"
              step="0.01"
              required
              min="0"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              placeholder="např. 36.90"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {totalCost && (
          <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">Celková cena:</span>
            <span className="font-bold text-lg text-emerald-800">
              {parseFloat(totalCost).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} Kč
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <input
            id="fullTank"
            type="checkbox"
            checked={fullTank}
            onChange={(e) => {
              setFullTank(e.target.checked);
              if (e.target.checked) setFuelLevelPct(100);
            }}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
          />
          <label htmlFor="fullTank" className="text-sm font-medium text-gray-700 cursor-pointer">
            Tankováno do plna
          </label>
        </div>

        {!fullTank && hasTankCapacity && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label htmlFor="fuelLevelPct" className="block text-sm font-medium text-gray-700 mb-1">
              Stav nádrže po tankování: <span className="font-semibold text-emerald-700">{fuelLevelPct} %</span>
            </label>
            <input
              id="fuelLevelPct"
              type="range"
              min="5"
              max="95"
              step="5"
              value={fuelLevelPct}
              onChange={(e) => setFuelLevelPct(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 %</span>
              <span>50 %</span>
              <span>95 %</span>
            </div>
          </div>
        )}

        {!fullTank && !hasTankCapacity && (
          <p className="text-xs text-amber-600">
            Tip: Zadejte objem nádrže u vozidla, aby se dala lépe odhadnout spotřeba u částečného tankování.
          </p>
        )}

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Poznámka / Čerpací stanice
          </label>
          <input
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="např. Benzina Ostrava"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={loading || scanning}
            className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Ukládání..." : "Uložit záznam"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}
