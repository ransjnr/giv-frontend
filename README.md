# Ability Connect: GIV admin

The dashboard where staff of the KNUST **Gender Inclusion and Vulnerability (GIV) Office** review student
registrations, agree support plans and answer support requests. Built by the **Responsible AI Lab (RAIL), KNUST**.

Students use the separate student portal (`pwd-frontend`). Both talk to the shared backend, `pwd-giv-backend`;
this app uses its `/api/admin/*` routes (see that repo's `docs/api-admin.md`).

## Run it

Start the backend first. In `pwd-giv-backend`:

```bash
npm run db:seed:sample   # demo accounts plus fictional sample students and requests
npm run dev              # API on http://localhost:8787
```

Then here:

```bash
npm install
npm run dev              # http://localhost:5174
```

Sign in with a demo staff account from the backend README (development only; never shown on the site).

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 5174 (the backend already allows this port) |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build on port 4174 |
| `npm run typecheck` | Type-check only |

The app calls the API at `VITE_API_URL`, or http://localhost:8787 when it isn't set (see [`.env.example`](.env.example)).
For a deployment, set `VITE_API_URL` to the API's address and add this app's address to the backend's `CORS_ORIGINS`.
[`vercel.json`](vercel.json) makes page links work on Vercel.

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4 and **shadcn/ui** (Radix, "Nova" style), with its dashboard and sidebar
blocks as the starting template. TanStack Query for server data, React Router, React Hook Form + Zod,
Recharts (through shadcn charts), Lucide icons and Poppins. Light, dark, or follow the device.

## Structure

```
src/
  api/          schema.ts and admin.ts (copies of the backend contract), client.ts (all API calls), queries.ts (data hooks)
  auth/         staff sign-in, session-expiry warning, sign-out when the server ends a session
  components/   ui/ (shadcn components), layout/ (sidebar, header, Ctrl+K search), data table, status badges, page helpers
  content/      options.ts (copy of the student portal's labels), staff.ts (staff-facing status wording)
  features/     overview, registrations (list, detail, status dialog), requests (queue, conversation), auth
  lib/          dates, theme
```

`src/api/schema.ts` and `src/api/admin.ts` are copies of the backend's `src/contract/` files, the master copies.
Change those first, then copy them here. `src/content/options.ts` is a copy of the student portal's labels, so staff
and students see the same words.

## Privacy and accessibility

- The staff session is kept in `sessionStorage` and ends when the tab closes. Signing out clears all cached student
  data. Staff are warned five minutes before a session expires.
- No student data is written to `localStorage`; only the colour theme is.
- Consent is shown first on every registration. If a student hasn't agreed to share with their department or hall,
  the page says so.
- Target: WCAG 2.2 AA. Keyboard-only use, visible focus, screen-reader landmarks and headings, focus moved to each
  new page's heading, and charts repeated as text.

## Plan

See [`docs/plan.md`](docs/plan.md) for the three phases. Phase 1 is done.
