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
