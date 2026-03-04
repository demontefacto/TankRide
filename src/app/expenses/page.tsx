import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, expenseCategoryLabels } from "@/lib/utils";
import DeleteButton from "@/components/DeleteButton";

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const entries = await prisma.expenseEntry.findMany({
    where: { vehicle: { userId: session.user.id } },
    include: { vehicle: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Náklady</h1>
        <Link href="/expenses/new" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors">
          + Přidat výdaj
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Zatím nemáte žádné záznamy o výdajích.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vozidlo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kategorie</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Popis</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Částka</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3">{entry.vehicle.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      {expenseCategoryLabels[entry.category] || entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.description}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(entry.cost, session.user.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton apiPath={`/api/expenses/${entry.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
