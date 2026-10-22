# Database migrations

Apply every `.sql` file in this folder **in filename order** against local Postgres (`DATABASE_URL`).

## Greenfield (new database)

```bash
createdb code_control   # or your preferred name
npm run db:apply-migrations
```

Migration order:

1. `000_helpers.sql` — `update_updated_at_column()` trigger helper
2. `000a_create_customers.sql` — `customers` table
3. `001_workspaces_and_projects.sql` — `customer_projects` and `customer_project_repos`

## Copy data from Supabase (one-time)

Keep `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` only for import, then remove them.

```bash
npm run db:apply-migrations
npm run db:import-from-supabase
```

## Existing THT-era database

If you already ran the old Code Control migrations (conventions, queues, ARD, etc.), run **`091_drop_codegen.sql`** after the three files above so the schema matches the slim product.

## Smoke test

After migrations (and optional import), create a customer and project from the web app at `/customers` and `/projects`.
