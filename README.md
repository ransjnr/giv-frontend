# Ability Connect: GIV workspace

The staff-facing Ability Connect workspace for the KNUST Gender Inclusion and
Vulnerability (GIV) Office. It is the companion to `pwd-frontend`: students
register and ask for support there; GIV staff review the submitted information
and coordinate responses here.

## What it does

- Authenticates GIV staff against the shared `pwd-giv-backend` API.
- Shows a triage overview of new registrations, active support, and recent requests.
- Lets staff search submitted registrations, read the full submitted record, and
  update its student-visible workflow status and note.
- Lets staff filter support requests, read a request thread, reply to the student,
  and update the request status.

The browser retains only the short-lived staff session token in `sessionStorage`.
Student records are read directly from the API and are not copied to `localStorage`.

## Run locally

Start the shared API first, from `pwd-giv-backend`:

```bash
npm run db:seed
npm run dev
```

Then start this dashboard:

```bash
npm install
npm run dev
```

Open http://localhost:5174. The development API creates the demo staff account
documented in the backend README. The dashboard calls `http://localhost:8787` by
default; set `VITE_API_URL` to use a deployed API, and add the dashboard origin to
the backend's `CORS_ORIGINS`.

## Shared contract

`pwd-giv-backend` owns the contract and routes. This app uses its `/api/admin/*`
endpoints for authentication, registrations, and support requests. When that API
changes, update this frontend in the same change.
