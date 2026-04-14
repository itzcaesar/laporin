# Laporin Database Setup

This directory contains the Prisma schema and database setup for the Laporin API.

## Prerequisites

- PostgreSQL 16+ installed and running
- PostgreSQL extensions: PostGIS, pgvector, uuid-ossp

## Quick Start

### 1. Install PostgreSQL Extensions

Connect to your PostgreSQL database and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Or via command line:

```bash
psql laporin -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql laporin -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql laporin -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

### 2. Configure Database URL

Create `apps/api/.env` file (copy from `.env.example`):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/laporin"
```

### 3. Run Migrations

```bash
# From the monorepo root
pnpm --filter @laporin/api db:migrate

# Or from apps/api directory
cd apps/api
pnpm db:migrate
```

This will:
- Create all tables, enums, and indexes
- Generate the Prisma Client

### 4. Run Manual PostGIS Migration

After the initial migration, run the PostGIS setup:

```bash
psql laporin < apps/api/prisma/migrations/manual/add_postgis.sql
```

This adds:
- `location_point` geometry column for spatial queries
- Spatial index (GIST) for location-based searches
- pgvector index for duplicate detection
- Trigger to auto-sync lat/lng with PostGIS point

### 5. Seed the Database

```bash
pnpm --filter @laporin/api db:seed
```

This seeds:
- 23 infrastructure categories
- 4 default SLA rules (urgent, high, medium, low)

## Database Schema

### Core Models

- **User** - Citizens and government officers
- **Agency** - Government agencies (Dinas)
- **Category** - 23 infrastructure categories
- **Report** - Core entity for infrastructure reports
- **Media** - Photos and videos attached to reports
- **StatusHistory** - Immutable audit trail of status changes
- **Comment** - Threaded comments on reports
- **Vote** - Citizen upvotes on reports
- **Bookmark** - Saved reports
- **Notification** - Multi-channel notifications
- **SatisfactionRating** - Post-completion ratings
- **SlaRule** - Service level agreement rules
- **AiAnalysisCache** - Cached AI analysis results
- **AuditLog** - Immutable audit log for government actions

### Tracking Code Format

Reports use the format: `LP-{YEAR}-{REGION}-{SEQUENCE}`

Example: `LP-2026-BDG-00142`

## Useful Commands

```bash
# Generate Prisma Client after schema changes
pnpm --filter @laporin/api prisma generate

# Push schema changes without migration (dev only)
pnpm --filter @laporin/api db:push

# Open Prisma Studio (database GUI)
pnpm --filter @laporin/api db:studio

# Reset database (WARNING: deletes all data)
pnpm --filter @laporin/api prisma migrate reset

# Create a new migration
pnpm --filter @laporin/api prisma migrate dev --name your_migration_name
```

## PostGIS Queries

The schema includes PostGIS support for geospatial queries. Examples:

### Find reports near a location

```typescript
const nearby = await prisma.$queryRaw`
  SELECT id, title, status, category_id,
         ST_Distance(location_point::geography,
           ST_MakePoint(${lng}, ${lat})::geography) AS distance_meters
  FROM reports
  WHERE ST_DWithin(
    location_point::geography,
    ST_MakePoint(${lng}, ${lat})::geography,
    ${radiusMeters}
  )
  ORDER BY distance_meters ASC
  LIMIT ${limit}
`
```

### Generate heatmap data

```typescript
const heatmap = await prisma.$queryRaw`
  SELECT
    ST_X(ST_Centroid(cell)) AS lng,
    ST_Y(ST_Centroid(cell)) AS lat,
    COUNT(*) AS count
  FROM reports,
    ST_SquareGrid(0.01, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)) AS cell
  WHERE ST_Intersects(location_point, cell)
    AND status != 'closed'
  GROUP BY cell
  HAVING COUNT(*) > 0
`
```

### Duplicate detection with pgvector

```typescript
const duplicates = await prisma.$queryRaw`
  SELECT id, title, tracking_code,
         1 - (embedding_vector <=> ${vector}::vector) AS similarity
  FROM reports
  WHERE status NOT IN ('rejected', 'closed')
    AND id != ${reportId}
    AND 1 - (embedding_vector <=> ${vector}::vector) > 0.85
  ORDER BY similarity DESC
  LIMIT 5
`
```

## Troubleshooting

### Extension not found

If you get errors about missing extensions:

```bash
# Check installed extensions
psql laporin -c "SELECT * FROM pg_extension;"

# Install missing extensions
psql laporin -c "CREATE EXTENSION postgis;"
psql laporin -c "CREATE EXTENSION vector;"
```

### Permission errors

Ensure your PostgreSQL user has sufficient privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE laporin TO your_user;
```

### Migration conflicts

If migrations fail, you can reset and start fresh (dev only):

```bash
pnpm --filter @laporin/api prisma migrate reset
```
