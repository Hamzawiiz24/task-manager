# M2 Evaluation Guide

## 1. 10-minute demo plan
Before the evaluation: `npm install`, delete `data.db` if present, `npm run seed`, `npm start`. Open **http://localhost:3000/api-docs** (Swagger) and import `postman/Task-Manager.postman_collection.json` into Postman. Have VS Code open on the project.

1. (1 min) Show the folder structure: presentation / services / repositories / database = M1 layered diagram.
2. (4 min) Postman: run the collection (Runner > Run). 22 requests turn green: FR-1 to FR-6, then 3 negative cases (403, 401, 400). Pause on a few and show the response.
3. (2 min) Swagger: POST /api/auth/login (mona@demo.com / password123), copy token, Authorize, then call GET /api/reports.
4. (1 min) Run `npm test` in the terminal, then show the coverage with `npm run coverage`.
5. (2 min) Open `TaskService.updateStatus`, `ReportService.generate`, `NotificationService` and explain.

Fallback if the live server fails: `npm test` still proves the API (the E2E test uses the real HTTP routes).

## 2. Programming paradigms (the TA will ask)
- **Imperative** = you tell the computer *how*, step by step, with statements and changing variables.
  Code: `TaskService.updateStatus` (check, check, update, write history), `RecurringTaskService.execute` (mutable `nextRun` + `while` loop). Marked with `IMPERATIVE` comments.
- **Declarative** = you describe *what* result you want, using expressions; the how is hidden.
  Code: `ReportService.generate` (`filter` / `map` / `reduce`), `Project.progress`, SQL queries in repositories, the route table in `routes.js`, `.map()` templates in `public/app.js`. Marked with `DECLARATIVE` comments.
- Why both: imperative fits workflows with validation and side effects; declarative fits data transformation and reports (shorter, easier to test, no hidden state).
- The project is also **object-oriented** (classes, inheritance via `BaseRepository`, encapsulation with `#private` methods) and uses functional style for the Strategy functions.

## 3. Checklist against the PDFs
| Requirement | Status |
|---|---|
| Working backend, happy path end to end | Done: all 6 FRs, E2E test + Postman run |
| API demo (Postman/Swagger) | Done: both ready (`/api-docs`, Postman collection) |
| Same architecture as M1 (Layered) | Done: see README table |
| SOLID, separation of concerns, modular | Done: see README |
| Imperative + declarative | Done: section 2 |
| At least FR-1..FR-4, ideally one FR + one NFR per member (6) | Done: 6 FRs + 6 NFRs, see section 4 |
| Tests (unit, E2E) | Done: `tests/unit`, `tests/e2e` |
| TDD evidence in commit history | **You must do this**: commit a failing test, then the code, for new work |
| M2 documentation + GitHub repo + Google Form upload | **You must do this**: push the repo, submit README + this guide |
| Frontend | Not required for M2 (included; show only if asked) |

## 4. Suggested ownership and likely questions (2 per member)
Pick the real assignment as a team; every member must read the whole README.

| Member | Owns | Likely questions and short answers |
|---|---|---|
| Hamza | FR-1 + NFR-1 | Where is a task validated? `TaskService.createTask`. How is it fast for 500 tasks? Indexes on `assigneeId`/`projectId`, paginated `findFiltered` (limit capped at 100). |
| Hazem | FR-2 + NFR-2 | How are illegal status moves blocked? `Task.canTransition` in `models`; every change is logged in `task_history`. How are passwords protected? bcrypt hash (10 rounds) in `UserService.register`, JWT login, `requireRole` middleware for RBAC. |
| Jana | FR-3 + NFR-3 | How do mentions work? Regex `@handle` in `Comment.extractHandles`, lookup by email prefix, notify each user except the author. Why is it scalable? Stateless: JWT instead of sessions, no state in services. Honest limit: SQLite is a single file; for real 100 users we would move to a server database (repositories make that swap easy). |
| Abdullah | FR-4 + NFR-4 | Where is Observer? `NotificationService` is the subject: `subscribe()` + `notify()` calls `update()` on every observer (`ConsoleObserver`). How are due reminders sent? `checkDueSoon` runs every minute from `server.js`, once per task. How are errors handled? `AppError` + `errorHandler` middleware, no stack traces to users. |
| Mostafa | FR-5 + NFR-5 | Where is Strategy? `STRATEGIES` in `RecurringTaskService` (daily/weekly/monthly share one signature). What if the server was off for days? The `while` loop skips missed runs and creates one task. NFR-5: semantic HTML, labels, focus outlines, responsive CSS (frontend). |
| Maleeka | FR-6 + NFR-6 | How is the report built? Declaratively with `filter/map/reduce`. How do you show maintainability? SOLID structure, Jest tests, 70% coverage gate in `package.json`. |

## 5. Other questions to prepare
- **Why layered?** Clear separation, easy testing, each layer replaceable (e.g. swap SQLite). Controllers never touch SQL.
- **SOLID example?** D: services get repositories via constructors (`src/app.js`). O: new recurrence pattern = one new entry in `STRATEGIES`. S: `TaskService` only has task rules, notifications are delegated.
- **Which patterns?** Repository, Observer, Strategy (State is optional: `Task.TRANSITIONS`).
- **What is not done / next (M3)?** Edit/delete comments, deactivate recurrence, richer reports, more tests, deployment.
