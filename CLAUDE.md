# Umami Analytics - Claude Code Instructions

This is a fork of [Umami](https://umami.is), a privacy-focused open-source
web analytics platform. This document provides instructions for Claude Code
to work effectively with this codebase.

## Project Overview

Umami is a Next.js 15 application with:
- **Frontend**: React 19, TailwindCSS via @umami/react-zen component library
- **Backend**: Next.js API routes with PostgreSQL (Prisma ORM) or ClickHouse
- **State Management**: Zustand, TanStack Query for data fetching
- **Caching**: Redis via @umami/redis-client

## Directory Structure

```
apps/umami/
├── prisma/              # Database schema (schema.prisma)
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (collect)/   # Data collection routes (/p, /q endpoints)
│   │   ├── (main)/      # Main app UI (dashboard, settings, etc.)
│   │   └── api/         # REST API routes
│   ├── components/      # React components & hooks
│   │   └── hooks/       # Custom hooks (queries, context)
│   ├── lib/             # Core utilities
│   │   ├── auth.ts      # Authentication
│   │   ├── constants.ts # App constants, EVENT_TYPE, ROLES, etc.
│   │   ├── crypto.ts    # Hashing, UUID generation
│   │   ├── request.ts   # Request parsing with Zod validation
│   │   ├── response.ts  # Standard response helpers (json, badRequest, etc.)
│   │   └── ...
│   ├── queries/         # Database queries
│   │   ├── prisma/      # Prisma CRUD operations
│   │   └── sql/         # Raw SQL queries (events, sessions, reports)
│   └── generated/       # Generated Prisma client
├── scripts/             # Build & utility scripts
├── db/                  # Database migrations (ClickHouse)
└── public/              # Static assets
```

## Key Patterns

### API Routes

API routes use Next.js App Router conventions in `src/app/api/`:

```typescript
import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, badRequest } from '@/lib/response';

const schema = z.object({
  // Zod schema for validation
});

export async function POST(request: Request) {
  const { body, auth, error } = await parseRequest(request, schema);

  if (error) return error();

  // Handle request...
  return json({ data });
}
```

### UI Components

Components use the @umami/react-zen library:

```tsx
import { Button, Form, FormField, TextField } from '@umami/react-zen';
import { useMessages, useUpdateQuery } from '@/components/hooks';

export function MyForm() {
  const { formatMessage, labels } = useMessages();
  const { mutateAsync } = useUpdateQuery('/api/endpoint');

  return (
    <Form onSubmit={handleSubmit}>
      <FormField label={formatMessage(labels.name)} name="name">
        <TextField />
      </FormField>
    </Form>
  );
}
```

### Data Collection

Events are collected via `/api/send` endpoint. The flow:
1. Parse and validate incoming request
2. Get or create session (hashed from IP + user agent + salt)
3. Save event with associated data
4. Return cache token for subsequent requests

### Database Models

Key models (see `prisma/schema.prisma`):
- `User` - User accounts with roles (admin, user, view-only)
- `Website` - Tracked websites
- `Session` - Visitor sessions
- `WebsiteEvent` - Page views and custom events
- `EventData` - Custom event data (key-value)
- `Revenue` - Revenue tracking for conversions
- `Team` - Team organization
- `Link` / `Pixel` - Tracking links and pixels

## Event Types

```typescript
export const EVENT_TYPE = {
  pageView: 1,
  customEvent: 2,
  linkEvent: 3,
  pixelEvent: 4,
} as const;
```

## Important Constants

- `COLLECTION_TYPE`: 'event' | 'identify'
- `ROLES`: admin, user, view-only, team-owner, team-manager, etc.
- `DATA_TYPE`: string (1), number (2), boolean (3), date (4), array (5)

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on port 3001

# Build
pnpm build            # Full build (db, tracker, geo, app)
pnpm build-app        # Build Next.js app only
pnpm build-tracker    # Build tracking script

# Database
pnpm build-db         # Generate Prisma client
pnpm update-db        # Run migrations

# Testing
pnpm test             # Run Jest tests
pnpm cypress-run      # Run Cypress E2E tests

# Linting
pnpm lint             # Biome linting
pnpm format           # Biome formatting
pnpm check            # Biome check with autofix
```

## Adding New Features

### New API Endpoint

1. Create route file in `src/app/api/[feature]/route.ts`
2. Define Zod schema for request validation
3. Use `parseRequest()` for auth and validation
4. Use response helpers from `@/lib/response`

### New UI Page

1. Create page component in `src/app/(main)/[feature]/`
2. Create page.tsx that renders the component
3. Use hooks from `@/components/hooks` for data fetching
4. Use @umami/react-zen components for UI

### New Database Model

1. Add model to `prisma/schema.prisma`
2. Run `pnpm build-db` to regenerate client
3. Create queries in `src/queries/prisma/[model].ts`
4. Export from `src/queries/prisma/index.ts`

## Testing

- Unit tests: `src/lib/__tests__/*.test.ts`
- E2E tests: `cypress/e2e/*.cy.ts`
- Place unit tests next to the files they test

## Postback Module

This fork includes a Postback Relay Module for:
- Receiving incoming webhooks/postbacks from external systems
- Recording events as analytics data
- Optionally relaying to other systems with format transformation
- Debug mode for inspecting incoming requests

See `doc/umami/postback/` for full specification and implementation guide.

## Code Style

- TypeScript strict mode
- Biome for linting and formatting
- Zod for runtime validation
- Use existing patterns from the codebase
- Follow Next.js App Router conventions

## Environment Variables

Key variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `APP_SECRET` - JWT signing secret
- `REDIS_URL` - Redis connection (optional)
- `DISABLE_BOT_CHECK` - Skip bot detection
- `DISABLE_TELEMETRY` - Disable telemetry
