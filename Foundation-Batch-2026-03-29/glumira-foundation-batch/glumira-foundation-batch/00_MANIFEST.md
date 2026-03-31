# GluMira Platform — Foundation File Batch

**Source:** `glumira-platform` GitHub repository (main branch)
**Date:** 2026-03-29
**Total Files:** 37

## Directory Structure

| Folder | Contents | File Count |
|--------|----------|------------|
| 01_DB_Schema_Changelog | SQL schema + beta tables addendum | 2 |
| 02_Server_Files | Server entry points, tRPC, utils | 4 |
| 03_Server_Routes | All API route handlers | 11 |
| 04_Server_Analytics | Analytics summary + glucose trend | 2 |
| 05_Server_Middleware | Auth + subscription middleware | 2 |
| 06_Client_Source | React app, hooks, components index | 7 |
| 07_Config_Env | .env.example, vite.config.ts | 2 |
| 08_Drizzle | Drizzle ORM schema | 1 |
| 09_HTML_Pages | Static HTML pages (auth, dashboard, etc.) | 5 |
| 10_Types | tRPC type definitions | 1 |

## Notes

- **No `package.json` or `tsconfig.json` found** in the repository. These will need to be created fresh.
- **No explicit Supabase config file** found. Database config is referenced in `.env.example` and `drizzle/schema.ts`.
- The DB changelog consists of `glumira-schema.sql` (main schema) and `20260329_beta_tables_addendum.sql` (beta additions).
