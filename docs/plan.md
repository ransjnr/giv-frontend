# GIV admin: plan

Roles: **GIV officers** handle registrations and requests. **GIV admins** can also manage staff, see the
audit log and export reports.

## Phase 1: Foundation and the core workflow (done)

- Project setup: shadcn/ui (Radix, Nova) on Tailwind v4, KNUST theme, light and dark mode.
- App shell from the shadcn dashboard and sidebar blocks: sidebar with live counts, breadcrumbs, ⌘K / Ctrl+K search
  for students and requests, skip link, focus moved to each new page's heading.
- Staff sign-in, a warning five minutes before the session expires, and sign-out when the server ends a session.
- **Overview:** new registrations, in review, requests awaiting a reply, overdue requests; a "needs attention" list;
  registrations by stage; active requests by urgency; recent student activity.
- **Registrations:** search, status filter, college and level filters, sorting and paging (kept in the URL).
  Detail page with consent first, difficulties and conditions, support needed, contact, emergency contact,
  student record and timeline. Status changes with a note to the student and a preview of what they will see.
- **Support requests:** queue with status, category and urgency filters, "waiting for a reply", and due dates.
  Conversation view with reply, "also mark as in progress", resolve and reopen.
- Backend (admin module): `GET /api/admin/stats`, paged and filtered lists, request summaries with the student and
  "awaiting reply", `expiresAt` on sign-in, sample data (`npm run db:seed:sample`), tests.

## Phase 2: Team workflow, reports and administration

- Assign registrations and requests to an officer; a "My work" view.
- Internal staff notes on registrations and requests (never shown to students).
- Reply templates for common answers.
- Semester check-ins: students who haven't confirmed their needs this semester.
- Printable support letter for a department or hall, with only what the student consented to share.
- Reports (admin): planning charts from anonymised totals, CSV export of totals only.
- Staff management (admin): add or deactivate officers, roles, password change on first sign-in.
- Audit log viewer (admin).
- Backend: role checks on the server, migrations, routes and tests for all of the above.

## Phase 3: Accessibility testing, security and polish

- Full accessibility audit (axe in light, dark and high contrast; keyboard walkthroughs; 200% zoom).
- Empty, loading and error states everywhere; tablet layout; offline banner; printable registration summary.
- Security pass: sign-out after inactivity, role checks, no student data in browser storage.
- Tests, demo build, admin user guide, deployment notes (Vercel for testing, the KNUST server later).
