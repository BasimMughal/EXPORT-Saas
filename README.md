# ExportFlow

Premium export management SaaS for garment exporters.

## Stack

- Next.js 15 App Router + TypeScript
- Auth.js credentials auth
- MongoDB + Mongoose (with offline demo data mode)
- Tailwind CSS + shadcn/ui
- Recharts, Sonner, jsPDF, SheetJS

## Modules

- Authentication + demo account
- Dashboard (KPIs, charts, timeline)
- Customers
- Orders
- Expenses + categories
- Profit analytics
- Reports (PDF / Excel / CSV)
- Profile

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Demo login (no Mongo required)

- Email: `demo@exportflow.com`
- Password: `Demo@12345`

### With MongoDB

```bash
# Start Mongo, then:
npm run seed:demo
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run test` — unit tests
- `npm run typecheck` — TypeScript check
- `npm run seed:demo` — seed Mongo admin user
