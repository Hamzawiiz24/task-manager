const { openDatabase } = require('./src/db/database');
const { createApp } = require('./src/app');
const { ConsoleObserver } = require('./src/services/observers');

const db = openDatabase(process.env.DB_FILE || 'data.db');
const { app, services } = createApp(db);
services.notificationService.subscribe(new ConsoleObserver());

// Background jobs: recurring tasks (FR-5) and due-date reminders (FR-4).
setInterval(() => {
  try { services.recurringService.runDue(); services.notificationService.checkDueSoon(); }
  catch (err) { console.error('Scheduler error:', err); }
}, 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Task manager running at http://localhost:${PORT}`));
