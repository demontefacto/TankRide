"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#059669", "#0284c7", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyData {
  month: string;
  fuel: number;
  expenses: number;
  maintenance: number;
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return <p className="text-gray-400 text-sm">Žádná data</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${Number(value).toLocaleString("cs-CZ")}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyCostChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) return <p className="text-gray-400 text-sm">Žádná data</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => `${Number(value).toLocaleString("cs-CZ")}`} />
        <Legend />
        <Bar dataKey="fuel" name="Palivo" fill="#059669" stackId="a" />
        <Bar dataKey="expenses" name="Náklady" fill="#0284c7" stackId="a" />
        <Bar dataKey="maintenance" name="Údržba" fill="#d97706" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
