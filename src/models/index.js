// Domain classes from the M1 class diagram. They hold domain rules only (no I/O).
class User { static ROLES = ['manager', 'member']; }

class Project {
  // DECLARATIVE paradigm: says WHAT we want (done / total), not how to loop.
  static progress(tasks) {
    const done = tasks.filter((t) => t.status === 'Done').length;
    return tasks.length ? Math.round((done * 100) / tasks.length) : 0;
  }
}

class Task {
  static STATUSES = ['To Do', 'In Progress', 'Done'];
  static PRIORITIES = ['Low', 'Medium', 'High'];
  static TRANSITIONS = { 'To Do': ['In Progress'], 'In Progress': ['To Do', 'Done'], Done: ['In Progress'] };
  static canTransition(from, to) { return (Task.TRANSITIONS[from] || []).includes(to); }
  static isOverdue(task, now = new Date()) {
    return task.status !== 'Done' && Boolean(task.dueDate) && new Date(task.dueDate) < now;
  }
}

class Comment {
  // Mention syntax: @handle, where handle = the part of the email before "@"
  static extractHandles(text) {
    return [...new Set([...text.matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase()))];
  }
}

class Notification { static TYPES = ['assignment', 'mention', 'due']; }
class Recurrence { static PATTERNS = ['daily', 'weekly', 'monthly']; }
class TaskHistory {}

module.exports = { User, Project, Task, Comment, Notification, Recurrence, TaskHistory };
