const { build } = require('../helpers');
const RecurringTaskService = require('../../src/services/RecurringTaskService');
const { STRATEGIES } = RecurringTaskService;

describe('FR-5 recurring tasks (Strategy pattern)', () => {
  test('each strategy computes the next run', () => {
    const d = new Date('2026-01-31T00:00:00Z');
    expect(STRATEGIES.daily(d).toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(STRATEGIES.weekly(d).toISOString()).toBe('2026-02-07T00:00:00.000Z');
    expect(STRATEGIES.monthly(new Date('2026-01-15T00:00:00Z')).toISOString()).toBe('2026-02-15T00:00:00.000Z');
  });

  describe('with a real task', () => {
    let ctx, task;
    beforeEach(() => {
      ctx = build();
      const m = ctx.services.userService.register({ name: 'M', email: 'm@x.com', password: 'secret1', role: 'manager' });
      const p = ctx.services.projectService.createProject(m, { title: 'P' });
      task = ctx.services.taskService.createTask({ title: 'Standup', projectId: p.id, assigneeId: m.id });
    });
    test('runDue clones the task and schedules the next run', () => {
      const rec = ctx.services.recurringService.define(task.id, 'daily');
      const future = new Date(Date.now() + 3 * 864e5);
      const created = ctx.services.recurringService.runDue(future);
      expect(created).toHaveLength(1);
      expect(created[0]).toMatchObject({ title: 'Standup', status: 'To Do' });
      expect(new Date(ctx.repos.recurrenceRepo.findById(rec.id).nextRun) > future).toBe(true);
    });
    test('nothing runs before nextRun', () => {
      ctx.services.recurringService.define(task.id, 'weekly');
      expect(ctx.services.recurringService.runDue(new Date())).toHaveLength(0);
    });
    test('rejects invalid patterns and duplicates', () => {
      expect(() => ctx.services.recurringService.define(task.id, 'hourly')).toThrow('Invalid pattern');
      ctx.services.recurringService.define(task.id, 'daily');
      expect(() => ctx.services.recurringService.define(task.id, 'weekly')).toThrow('already recurring');
    });
  });
});
