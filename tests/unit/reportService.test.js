const ReportService = require('../../src/services/ReportService');

describe('FR-6 reports', () => {
  const tasks = [
    { id: 1, status: 'Done', assigneeId: 1, timeLogged: 2, dueDate: '2020-01-01T00:00:00.000Z' },
    { id: 2, status: 'To Do', assigneeId: 1, timeLogged: 0, dueDate: '2020-01-01T00:00:00.000Z' },
    { id: 3, status: 'In Progress', assigneeId: 2, timeLogged: 1, dueDate: null },
  ];
  const svc = new ReportService({
    taskRepo: { findAll: () => tasks, findByProject: () => tasks },
    userRepo: { findAll: () => [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'Idle' }] },
  });
  const report = svc.generate({}, new Date('2026-01-01'));

  test('completion rate and status counts', () => {
    expect(report.completionRate).toBe(33);
    expect(report.byStatus).toEqual({ 'To Do': 1, 'In Progress': 1, Done: 1 });
  });
  test('lists only open, past-due tasks as overdue', () => expect(report.overdueTasks.map((t) => t.id)).toEqual([2]));
  test('workload per assigned user', () => {
    expect(report.workload).toHaveLength(2);
    expect(report.workload[0]).toMatchObject({ name: 'A', openTasks: 1, hoursLogged: 2 });
  });
  test('empty data gives 0%', () => {
    const empty = new ReportService({ taskRepo: { findAll: () => [] }, userRepo: { findAll: () => [] } });
    expect(empty.generate().completionRate).toBe(0);
  });
});
