const { Task, Comment } = require('../models');
const { badRequest, forbidden, notFound } = require('../errors');

class TaskService {
  constructor({ taskRepo, projectRepo, userRepo, historyRepo, commentRepo, notificationService }) {
    Object.assign(this, { taskRepo, projectRepo, userRepo, historyRepo, commentRepo, notificationService });
  }

  #get(id) {
    const task = this.taskRepo.findById(id);
    if (!task) throw notFound('Task not found');
    return task;
  }
  #assertCanModify(actor, task) {
    if (actor.role !== 'manager' && task.assigneeId !== actor.id) throw forbidden('You can only update your own tasks');
  }
  #parseDate(value) {
    if (value === undefined || value === null || value === '') return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw badRequest('Invalid due date');
    return d.toISOString();
  }
  #notifyAssigned(task) {
    this.notificationService.notify(task.assigneeId, 'assignment', `You were assigned: "${task.title}"`);
  }

  // FR-1
  createTask({ title, description = '', priority = 'Medium', dueDate, projectId, assigneeId }) {
    if (!title || !title.trim()) throw badRequest('Title is required');
    if (!Task.PRIORITIES.includes(priority)) throw badRequest('Priority must be Low, Medium or High');
    if (!this.projectRepo.findById(projectId)) throw notFound('Project not found');
    if (assigneeId && !this.userRepo.findById(assigneeId)) throw notFound('Assignee not found');
    const task = this.taskRepo.create({
      title: title.trim(), description, priority, dueDate: this.#parseDate(dueDate),
      projectId: Number(projectId), assigneeId: assigneeId ? Number(assigneeId) : null,
      status: 'To Do', timeLogged: 0, createdAt: new Date().toISOString(),
    });
    if (task.assigneeId) this.#notifyAssigned(task);
    return task;
  }

  assignTask(taskId, assigneeId) {
    const task = this.#get(taskId);
    if (!this.userRepo.findById(assigneeId)) throw notFound('Assignee not found');
    const updated = this.taskRepo.update(task.id, { assigneeId: Number(assigneeId) });
    this.#notifyAssigned(updated);
    return updated;
  }

  listTasks(actor, { projectId, limit, offset } = {}) {
    return this.taskRepo.findFiltered({
      projectId: projectId ? Number(projectId) : undefined,
      assigneeId: actor.role === 'manager' ? undefined : actor.id,
      limit: Math.min(Number(limit) || 50, 100), offset: Number(offset) || 0,
    });
  }

  getTaskDetails(id) {
    const task = this.#get(id);
    const comments = this.commentRepo.findByTask(id).map((c) => ({ ...c, mentions: JSON.parse(c.mentions) }));
    return { ...task, comments, history: this.historyRepo.findByTask(id) };
  }

  // FR-2. IMPERATIVE paradigm: explicit step-by-step checks, then a state change.
  updateStatus(actor, taskId, newStatus) {
    const task = this.#get(taskId);
    this.#assertCanModify(actor, task);
    if (!Task.STATUSES.includes(newStatus)) throw badRequest('Status must be To Do, In Progress or Done');
    if (!Task.canTransition(task.status, newStatus)) throw badRequest(`Cannot move a task from "${task.status}" to "${newStatus}"`);
    const updated = this.taskRepo.update(taskId, { status: newStatus });
    this.historyRepo.create({ taskId, changedBy: actor.id, oldStatus: task.status, newStatus, timestamp: new Date().toISOString() });
    return updated;
  }

  logTime(actor, taskId, hours) {
    const task = this.#get(taskId);
    this.#assertCanModify(actor, task);
    const h = Number(hours);
    if (!(h > 0) || h > 24) throw badRequest('Hours must be between 0 and 24');
    return this.taskRepo.update(taskId, { timeLogged: task.timeLogged + h });
  }

  // FR-3
  addComment(actor, taskId, text) {
    const task = this.#get(taskId);
    if (!text || !text.trim()) throw badRequest('Comment cannot be empty');
    const mentioned = Comment.extractHandles(text)
      .map((h) => this.userRepo.findByHandle(h)).filter((u) => u && u.id !== actor.id);
    const comment = this.commentRepo.create({
      text: text.trim(), userId: actor.id, taskId, createdAt: new Date().toISOString(),
      mentions: JSON.stringify(mentioned.map((u) => u.id)),
    });
    mentioned.forEach((u) => this.notificationService.notify(u.id, 'mention', `${actor.name} mentioned you on "${task.title}"`));
    return { ...comment, mentions: mentioned.map((u) => u.id) };
  }
}
module.exports = TaskService;
