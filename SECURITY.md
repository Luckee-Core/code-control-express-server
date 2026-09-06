# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | Best-effort |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities. Use GitHub Security Advisories on this repository or contact the maintainers privately.

## Scope

Code Control Express Server is a **self-hosted project workspace API** backed by Supabase Postgres.

### In scope

- Unauthorized data access or mutation on exposed deployments
- `SUPABASE_SERVICE_ROLE_KEY` or `GITHUB_PERSONAL_ACCESS_TOKEN` exposure in client bundles or logs
- CORS misconfiguration on internet-facing deployments

### Known limitations (by design)

- **No API authentication** on `/api/data`. Intended for local or trusted-network use only. Do not expose this API to the public internet without adding authentication and authorization.
- **Permissive CORS** (`cors()` default) in development. Restrict origins in production via a reverse proxy or future `CORS_ORIGINS` support.

## Threat model

| Trust boundary | Default |
|----------------|---------|
| Operator machine | Trusted — localhost dev |
| Browser | Calls API via Next.js proxy; no service-role key in the web bundle |
| Supabase | Server-only via `SUPABASE_SERVICE_ROLE_KEY` |
| Internet | **Not supported** without auth, HTTPS, and CORS hardening |

## Environment secrets (server only)

| Variable | Never in `NEXT_PUBLIC_*` |
|----------|--------------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes |
| `GITHUB_TEMPLATE_*` | Yes |

## Best practices for operators

1. Bind to `127.0.0.1` or firewall the port when running locally.
2. Never commit `.env` or paste tokens into issues.
3. Use a dedicated Supabase project for Code Control data.
