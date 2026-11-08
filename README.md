# School Log

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.

## GitHub Pages deployment

This project is prepared for GitHub Pages as a static frontend. GitHub Pages does not run the Express server or a database, so public school records and administrator authentication are provided by Supabase. Run [`supabase/schema.sql`](./supabase/schema.sql) once in the Supabase SQL Editor, create the administrator in Authentication, and set that user's `public.profiles.role` to `admin`.

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under GitHub repository Settings → Secrets and variables → Actions. The workflow in `.github/workflows/deploy-pages.yml` builds and deploys on pushes to `main`. Because the repository is named `school-log`, the workflow uses `/school-log/` as its base path. Change `VITE_BASE_PATH` to `/` when using a custom domain.

The Supabase publishable/anon key may be included in the browser bundle only with the RLS policies enabled. Never put a Supabase service-role key in the frontend build. Public reads are allowed by the SQL policy, while inserts, updates and deletes require an authenticated user whose profile role is `admin`.
