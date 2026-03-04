# TankRide

A web application for tracking and analyzing vehicle operating costs. Manage multiple vehicles, log fuel fill-ups, expenses, and maintenance — all in one place with clear dashboards and charts.

## Features

- **Multi-user** — each user manages their own vehicles and data
- **Multiple vehicles** with different fuel types (gasoline, diesel, LPG, CNG, electric, hybrid)
- **Fuel / charging log** with automatic consumption calculation (l/100 km or kWh/100 km) and trend charts
- **Expense tracking** categorized as service, spare parts, insurance, or other
- **Maintenance records** (vehicle inspection, emissions, oil change, tires, brakes, …) with optional next-due date/km reminders
- **Dashboard** with summary stats (total costs, average consumption, cost per km) and interactive charts (category breakdown, monthly trends)
- **Per-vehicle filtering** on the dashboard
- **Selectable currency** (CZK, EUR, USD, PLN, GBP) — chosen at registration

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM
- **Auth:** NextAuth.js (credentials provider)
- **Styling:** Tailwind CSS
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
cd tankride
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register a new account and start adding vehicles.

### Docker

Create a `.env` file:

```env
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

Then run:

```bash
docker-compose up -d --build
```

The SQLite database is persisted in a Docker volume (`tankride-data`).

## Project Structure

```
tankride/
├── prisma/
│   └── schema.prisma          # Database schema (6 models)
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── api/               # REST endpoints (auth, vehicles, fuel, expenses, maintenance)
│   │   ├── vehicles/          # Vehicle CRUD pages
│   │   ├── fuel/              # Fuel entry pages + consumption chart
│   │   ├── expenses/          # Expense entry pages
│   │   ├── maintenance/       # Maintenance record pages
│   │   └── page.tsx           # Dashboard with stats & charts
│   ├── components/            # React components (forms, charts, nav)
│   ├── lib/                   # Prisma client, auth config, utilities
│   └── types/                 # TypeScript type extensions
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Data Model

- **User** — account with email, password, preferred currency
- **Vehicle** — name, make, model, year, fuel type, license plate
- **FuelEntry** — date, odometer, quantity, price, total cost
- **ExpenseEntry** — date, category, description, cost
- **MaintenanceRecord** — date, type, cost, next due date/km
- **Station** — *(prepared for future use)* gas station with GPS coordinates

## Roadmap

- [ ] Gas station directory with GPS locations and price comparison
- [ ] Upcoming maintenance/inspection reminders (notifications)
- [ ] Localization (i18n via next-intl) — community translations welcome
- [ ] CSV/PDF export of records
- [ ] Mobile-optimized PWA

## License

MIT
