# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Octopus IA is a personal finance dashboard integrated with WhatsApp. It's a full-stack application with a React + TypeScript frontend and Node.js + Express + Prisma backend.

**Key Flow**: Users send financial messages via WhatsApp → Backend processes and stores in PostgreSQL → Dashboard displays KPIs, charts, and AI-generated alerts.

## Development Commands

### Frontend (Root Directory)
```bash
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run build:dev        # Development build
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Backend (server/ Directory)
```bash
npm run dev              # Start dev server with hot reload (tsx + nodemon)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
```

### Docker Commands
```bash
npm run docker:build     # Build Docker containers
npm run docker:up        # Start containers in detached mode
npm run docker:down      # Stop containers
npm run docker:logs      # View container logs (follow mode)
```

## Architecture

### Monorepo Structure
```
/                  # Frontend (React + Vite + TypeScript)
├── src/
│   ├── pages/            # Route pages (Index.tsx = Dashboard, Settings.tsx, Auth.tsx)
│   ├── components/       # UI components (dashboard/, ui/)
│   ├── hooks/            # Custom React hooks (useFinancialData.ts = main data hook)
│   ├── contexts/         # React contexts (AuthContext.tsx = JWT auth state)
│   ├── lib/              # Utilities (api.ts = axios client with interceptors)
│   └── types/            # TypeScript definitions (financial.ts)
│
/server/           # Backend (Node.js + Express + Prisma)
├── src/
│   ├── controllers/      # Business logic (auth, finance, user)
│   ├── routes/           # Express routes
│   ├── middlewares/      # Express middlewares (auth, error handling)
│   ├── config/           # Configuration (passport.ts)
│   └── index.ts          # Express app entry point
└── prisma/
    └── schema.prisma     # Database schema (PostgreSQL)
```

### Authentication Flow
- **JWT-based**: Token stored in localStorage, added to all requests via axios interceptor
- **Passport.js**: Backend uses `passport-jwt` strategy with custom token extractor
- **Protected Routes**: Frontend uses `AuthContext` with React Router protection
- **Session Handling**: 401 responses trigger automatic logout and redirect to `/auth`

### Data Fetching Pattern
- **React Query**: All API calls use `@tanstack/react-query` with queryKeys
- **Main Hook**: `useFinancialData(filters)` fetches records + alerts, calculates KPIs, and returns chart data
- **Cache-Busting**: GET requests include `_t: Date.now()` param; backend sends no-cache headers
- **Stale Time**: Records = 30s, Alerts = 60s (configurable in query options)

### Database Models (Prisma)
1. **User**: Authentication + settings (subscription tiers: none/basic/pro)
2. **FinanceRecord**: Financial transactions with date, value, type (entrada/saida), category
3. **AiAlert**: AI-generated alerts with priority (baixa/media/alta)

**Key Pattern**: All models use `userId` foreign key with `onDelete: Cascade` for data isolation

### Date Handling
- **CRITICAL**: All date parsing must use `parseISO()` + `isValid()` checks before processing
- **Library**: date-fns for all date operations (never use `new Date()` directly on user input)
- **Format**: Backend stores dates as `@db.Date`, frontend receives ISO strings
- **Filter Types**: today, last7days, last30days, last60days, thisMonth, custom

### Charts (Recharts)
All charts follow this pattern:
1. Use `useMemo` to compute data from `FinanceRecord[]`
2. Validate dates with `parseISO()` + `isValid()` in try-catch
3. Use `isWithinInterval()` for date filtering
4. Return empty state when `hasData = false`
5. Custom tooltips with `bg-card border-border` styling

**Chart Types**:
- **ExpensePieChart**: Distribution by category
- **EvolutionLineChart**: Timeline of balance over time
- **MonthlyComparisonChart**: Last 6 months total income vs expenses (NO filters, NO categories)
- **CategoryEvolutionChart**: Top 8 categories over time with toggle (saidas only vs saidas+entradas)
- **CategoryRankingChart**: Top 5 categories sorted by value

### Financial Health Card
The **Financial Health Card** displays a comprehensive health score (0-100) with supporting metrics, positioned below AI Alerts on the dashboard.

**Key Features**:
- **Independent from Dashboard Filters**: All metrics ignore user's date range selection
- **Progress Ring**: SVG-based circular indicator with 700ms animation
- **Asymmetric Layout**: Desktop shows 50/50 split (Score | 3 stacked cards)
- **Responsive**: Mobile stacks vertically, tablet shows 3 cards horizontally

**Layout Structure**:
```
┌─────────────────────┬───────────────────────┐
│   PROGRESS RING     │ Burn Rate      R$ X   │
│        85           ├───────────────────────┤
│      Saudável       │ Comprometido   X%     │
│                     ├───────────────────────┤
│                     │ Sobrevivência  X un.  │
└─────────────────────┴───────────────────────┘
```

**Metrics Calculation** (`useHealthMetrics` hook):
1. **Score de Saúde (0-100)**: Weighted average with normalization
   - Burn Rate Score (30%): Band-based, not linear (≤30%=100, ≤50%=80, etc.)
   - Fixed Commitment Score (40%): Percentage of income committed to fixed expenses
   - Survival Time Score (30%): Months the user can survive with current balance
   - Final normalization: `Math.max(0, Math.min(100, Math.round(totalScore)))`

2. **Burn Rate**: Average monthly expenses from last 12 months
   - Primary: 12-month average
   - Secondary: 6-month average
   - **Critical**: Always uses last 12 months, never respects dashboard filters
   - Subtitle: "Gasto médio mensal"

3. **Comprometido (Fixed Commitment)**: Fixed expenses / Total income × 100
   - Filters only `classificacao='fixo'` expenses
   - Uses last 12 months of data
   - Status: Saudável (≤50%), Atenção (51-70%), Risco (>70%)

4. **Tempo de Sobrevivência (Survival Time)**: Global balance / Burn Rate
   - **Critical**: Uses ALL records for balance calculation (global, not filtered)
   - Smart unit conversion: horas → dias → meses → anos
   - Shows "Estável" if burn rate = 0
   - Status: Saudável (≥6mo), Atenção (3-6mo), Risco (<3mo)

5. **Badge de Tendência (optional)**: 30-day score comparison
   - Only shows if sufficient data (≥5 records from 30 days ago)
   - Direction: improving (+5), stable (±4), declining (-5)
   - Uses `calculateScoreOnly()` to avoid recursion

**Data Architecture**:
- **Two Parallel Queries**:
  - Query 1: ALL records (for global balance)
  - Query 2: Last 12 months (for burn rate + commitment)
- **Cache**: 5 minutes (`staleTime`)
- **No Recursion**: `calculateTrend` uses `calculateScoreOnly` helper

**Important Rules**:
- Global balance NEVER varies with dashboard filters
- Burn rate ALWAYS uses 12 months, regardless of user selection
- Score uses band-based system to prevent explosion with low income
- Trend badge silently omitted if insufficient historical data
- Desktop fonts larger (`lg:text-2xl`) than mobile (`text-lg`)

### Subscription-Based Features
- **PRO Plan**: Chat notifications enabled (validated frontend + backend)
- **Basic/None Plans**: Chat notifications disabled (shows lock icon)
- **Backend Validation**: `/user/notification-preferences` returns 403 if non-PRO tries to enable chat

### Styling Conventions
- **Tailwind CSS**: Utility-first with custom dark theme
- **HSL Variables**: Use `hsl(var(--primary))`, `hsl(var(--muted-foreground))`, etc.
- **Responsive**: Mobile-first with `sm:`, `md:` breakpoints
- **Animations**: Cards use `animate-fade-up` with staggered `animationDelay`
- **Colors**: Consistent palette (Orange #d97757 for expenses, Green #22c55e for income)

### API Error Handling
- **Interceptor Pattern**: axios interceptors handle auth errors globally
- **Toast Notifications**: Use `sonner` for user-facing errors (except auth endpoints)
- **401 Handling**: Auto-logout, clear token, redirect to `/auth`
- **500 Handling**: Generic "Erro no servidor" message
- **Auth Endpoints**: Let AuthContext handle errors (no toast in interceptor)

## Key Files

### Frontend
- **`src/lib/api.ts`**: Centralized API client with typed endpoints (authAPI, financeAPI, userAPI)
- **`src/hooks/useFinancialData.ts`**: Main data fetching hook - handles all dashboard data logic
- **`src/contexts/AuthContext.tsx`**: JWT authentication state and protected route logic
- **`src/pages/Index.tsx`**: Dashboard page - main entry point with all charts and KPIs
- **`src/types/financial.ts`**: TypeScript definitions for FinanceRecord, AIAlert, DateFilter types

### Backend
- **`server/src/index.ts`**: Express app setup with CORS, helmet, passport, routes
- **`server/src/config/passport.ts`**: JWT strategy configuration
- **`server/src/controllers/*.controller.ts`**: Business logic for auth, finance, user endpoints
- **`server/prisma/schema.prisma`**: Database schema - source of truth for all models

## Important Patterns

### Zod Validation
Backend uses Zod schemas for request validation. All controllers parse input with `.parse()` and catch `ZodError` in error handlers.

### Type Safety
- Frontend and backend share similar types but defined separately
- Backend uses Prisma-generated types
- Frontend defines types in `src/types/` and `src/lib/api.ts`
- Decimal values from Prisma are converted to `number` in API responses

### Environment Variables
- **Frontend**: `VITE_API_URL` (default: http://localhost:3001/api)
- **Backend**: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`

### Empty States
All components handle empty data gracefully:
- Charts show "Nenhum dado disponível" with icon
- Use `hasData` checks before rendering chart components
- No skeleton loaders - instant empty state

## Common Issues

### Date Parsing Errors
**Problem**: "Invalid time value" errors in charts
**Cause**: Direct use of `new Date()` on invalid date strings
**Solution**: Always use pattern:
```typescript
const date = parseISO(dateString);
if (!isValid(date)) return null; // or handle error
```

### Chart Data Not Updating
**Problem**: Filters don't affect MonthlyComparisonChart
**Cause**: This chart ignores filters by design - always shows last 6 months
**Solution**: Only CategoryEvolutionChart and other specific charts respect filters

### 304 Not Modified
**Problem**: Stale data despite updates
**Cause**: Browser/server caching
**Solution**: Already implemented - `_t` param + no-cache headers + ETag disabled

### Subscription Validation
**Problem**: Non-PRO users can enable chat notifications
**Solution**: Check `subscription !== 'pro'` in frontend AND backend endpoint
