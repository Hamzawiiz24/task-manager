const { notFound } = require('../errors');

// Observer pattern: NotificationService is the Subject. Observers (e.g. console, email, push)
// subscribe and are told about every notification that is created.
class NotificationService {
  constructor({ notificationRepo, taskRepo }) {
    this.repo = notificationRepo; this.taskRepo = taskRepo; this.observers = [];
  }
  subscribe(observer) { this.observers.push(observer); }

  notify(userId, type, message) {
    const n = this.repo.create({ userId, type, message, isRead: 0, createdAt: new Date().toISOString() });
    this.observers.forEach((o) => o.update(n));
    return n;
  }

  list(userId) { return this.repo.findByUser(userId); }

  markAsRead(userId, id) {
    const n = this.repo.findById(id);
    if (!n || n.userId !== userId) throw notFound('Notification not found');
    return this.repo.update(id, { isRead: 1 });
  }

  // FR-4: remind assignees about tasks due within 24h (once per task).
  checkDueSoon(now = new Date()) {
    const to = new Date(now.getTime() + 24 * 3600 * 1000);
    return this.taskRepo.findDueBetween(now.toISOString(), to.toISOString()).filter((t) => {
      const msg = `Task "${t.title}" (#${t.id}) is due within 24 hours`;
      if (this.repo.exists(t.assigneeId, 'due', msg)) return false;
      this.notify(t.assigneeId, 'due', msg);
      return true;
    }).length;
  }
}
module.exports = NotificationService;
