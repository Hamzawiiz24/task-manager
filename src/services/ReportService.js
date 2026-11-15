const { Task } = require('../models');

// FR-6. Written declaratively (filter / map / reduce, no mutable loops).
class ReportService {
  constructor({ taskRepo, userRepo }) { this.taskRepo = taskRepo; this.userRepo = userRepo; }

  generate({ projectId } = {}, now = new Date()) {
    const tasks = projectId ? this.taskRepo.findByProject(Number(projectId)) : this.taskRepo.findAll();
    const done = tasks.filter((t) => t.status === 'Done').length;
    return {
      totalTasks: tasks.length,
      completionRate: tasks.length ? Math.round((done * 100) / tasks.length) : 0,
      byStatus: Task.STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s).length }), {}),
      overdueTasks: tasks.filter((t) => Task.isOverdue(t, now)),
      workload: this.userRepo.findAll()
        .map((u) => {
          const mine = tasks.filter((t) => t.assigneeId === u.id);
          return {
            userId: u.id, name: u.name, assigned: mine.length,
            openTasks: mine.filter((t) => t.status !== 'Done').length,
            hoursLogged: mine.reduce((sum, t) => sum + t.timeLogged, 0),
          };
        })
        .filter((w) => w.assigned > 0),
    };
  }
}
module.exports = ReportService;
