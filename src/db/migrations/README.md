# Database migrations

Apply every `.sql` file in this folder **in filename order** against a dedicated Supabase (or Postgres) project.

## Greenfield (new database)

1. `000_helpers.sql` — `update_updated_at_column()` trigger helper
2. `000a_create_customers.sql` — `customers` table
3. `001_workspaces_and_projects.sql` — `customer_projects` and `customer_project_repos`

## Existing THT-era database

If you already ran the old Code Control migrations (conventions, queues, ARD, etc.), run **`091_drop_codegen.sql`** after the three files above so the schema matches the slim product.

## Smoke test

After migrations, create a customer and project from the web app at `/customers` and `/projects`.
