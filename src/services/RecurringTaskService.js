const { Recurrence } = require('../models');
const { badRequest, notFound, conflict } = require('../errors');

// Strategy pattern: one function per recurrence pattern, all with the same signature.
const STRATEGIES = {
  daily: (d) => { const n = new Date(d); n.setUTCDate(n.getUTCDate() + 1); return n; },
  weekly: (d) => { const n = new Date(d); n.setUTCDate(n.getUTCDate() + 7); return n; },
  monthly: (d) => { const n = new Date(d); n.setUTCMonth(n.getUTCMonth() + 1); return n; },
};

class RecurringTaskService {
  constructor({ recurrenceRepo, taskRepo, notificationService }) {
    Object.assign(this, { recurrenceRepo, taskRepo, notificationService });
  }

  // FR-5
  define(taskId, pattern) {
    if (!Recurrence.PATTERNS.includes(pattern)) throw badRequest('Invalid pattern: use daily, weekly or monthly');
    if (!this.taskRepo.findById(taskId)) throw notFound('Task not found');
    if (this.recurrenceRepo.findByTask(taskId)) throw conflict('This task is already recurring');
    const nextRun = STRATEGIES[pattern](new Date()).toISOString();
    return this.recurrenceRepo.create({ taskId, pattern, nextRun, isActive: 1 });
  }

  runDue(now = new Date()) {
    return this.recurrenceRepo.findDue(now.toISOString()).map((r) => this.execute(r, now));
  }

  execute(recurrence, now = new Date()) {
    const t = this.taskRepo.findById(recurrence.taskId);
    const copy = this.taskRepo.create({
      title: t.title, description: t.description, priority: t.priority, projectId: t.projectId,
      assigneeId: t.assigneeId, status: 'To Do', timeLogged: 0, dueDate: recurrence.nextRun, createdAt: now.toISOString(),
    });
    if (copy.assigneeId) this.notificationService.notify(copy.assigneeId, 'assignment', `Recurring task created: "${copy.title}"`);
    const next = STRATEGIES[recurrence.pattern];
    // IMPERATIVE paradigm: mutable variable + loop to skip missed runs.
    let nextRun = next(new Date(recurrence.nextRun));
    while (nextRun <= now) nextRun = next(nextRun);
    this.recurrenceRepo.update(recurrence.id, { nextRun: nextRun.toISOString() });
    return copy;
  }
}
module.exports = RecurringTaskService;
module.exports.STRATEGIES = STRATEGIES;
