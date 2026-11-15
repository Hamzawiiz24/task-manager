# Task & Project Management System (M2 Beta)
Team: شركة الجيار للتستينج. JavaScript web app, Layered architecture.

## Run it
Requirements: Node.js 20, 22 or 24 (LTS) from https://nodejs.org, and VS Code.
```
npm install        # once
npm run seed       # optional: demo users + data
npm start          # http://localhost:3000
npm test           # all unit + E2E tests
npm run coverage   # coverage report, fails below 70% (NFR-6)
```
Demo logins (after seed): mona@demo.com (manager), alice@demo.com, bob@demo.com. Password: `password123`.
Mention a user in a comment with `@alice` (the part of the email before the @).

## API demo
Swagger UI: http://localhost:3000/api-docs. Postman: import `postman/Task-Manager.postman_collection.json` and run it (regenerate with `npm run postman`). See `docs/EVALUATION_GUIDE.md` for the demo script and Q&A prep.

## Architecture (matches M1)
| Layer | Code |
|---|---|
| Presentation | `public/` (HTML/CSS/JS), `src/controllers`, `src/routes.js`, `src/middleware` |
| Business logic | `src/services` (Task, Project, Report, Notification, RecurringTask, User) + `src/models` (domain rules) |
| Data access | `src/repositories` (Task, Project, User, Comment, Notification, TaskHistory, Recurrence) |
| Database | SQLite (`src/db/database.js`): users, projects, tasks, comments, notifications, task_history, recurrences |

Controllers only call services; services only call repositories; only repositories touch SQL.
`src/app.js` is the composition root (dependency injection).

## Requirements map
| Req | Where |
|---|---|
| FR-1 projects/tasks/assign | `ProjectService`, `TaskService.createTask/assignTask` |
| FR-2 status + time log | `TaskService.updateStatus/logTime`, `TaskHistoryRepository` |
| FR-3 comments + mentions | `TaskService.addComment`, `Comment.extractHandles` |
| FR-4 notifications | `NotificationService` (assignment, mention, due in 24h via `checkDueSoon`) |
| FR-5 recurring | `RecurringTaskService` (daily/weekly/monthly), runs every minute in `server.js` |
| FR-6 reports | `ReportService` (completion rate, overdue, workload) |
| NFR-1 | indexes + paginated `findFiltered` | 
| NFR-2 | bcrypt hashes (`bcryptjs`), JWT, `requireRole` middleware |
| NFR-3 | stateless services (JWT, no server sessions) |
| NFR-4 | `errorHandler`, validation errors, scheduler try/catch |
| NFR-5 | semantic HTML, labels, focus styles, responsive CSS, skip link |
| NFR-6 | SOLID structure, Jest tests, coverage threshold 70% |

## Design patterns
Repository (data layer), Observer (`NotificationService.subscribe`), Strategy (`RecurringTaskService.STRATEGIES`). M3 needs 2+: Observer and Strategy already cover it.

## SOLID evidence
S: one job per class (services vs repositories vs controllers). O: add a recurrence pattern or notification channel without editing existing code (Strategy / Observer). L: all repositories extend `BaseRepository`. I: small controllers/services per feature. D: services receive repositories through their constructors (`src/app.js`).

## Paradigms
Imperative: step-by-step validation and state changes in `TaskService`, `RecurringTaskService.execute`.
Declarative: `ReportService` (filter/map/reduce), `Project.progress`, SQL queries, and template-based rendering in `public/app.js`.

## Tests (traceable to user stories)
`tests/unit/*` (describe blocks are named by FR/NFR) and `tests/e2e/happyPath.test.js` (full HTTP flow).
**TDD evidence:** commit the failing test first, then the code ("test: ..." then "feat: ..."), for every new feature from now on.
