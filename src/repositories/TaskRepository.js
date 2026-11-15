const BaseRepository = require('./BaseRepository');
const COLUMNS = ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId', 'projectId', 'timeLogged', 'createdAt'];
class TaskRepository extends BaseRepository {
  constructor(db) { super(db, 'tasks', COLUMNS); }
  // Paginated so the dashboard stays fast (NFR-1).
  findFiltered({ projectId, assigneeId, limit = 50, offset = 0 } = {}) {
    const where = [], args = [];
    if (projectId) { where.push('projectId=?'); args.push(projectId); }
    if (assigneeId) { where.push('assigneeId=?'); args.push(assigneeId); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return this.db.prepare(`SELECT * FROM tasks ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
  }
  findByProject(projectId) { return this.db.prepare('SELECT * FROM tasks WHERE projectId=?').all(projectId); }
  findDueBetween(from, to) {
    return this.db.prepare(`SELECT * FROM tasks WHERE status!='Done' AND assigneeId IS NOT NULL
      AND dueDate IS NOT NULL AND dueDate>=? AND dueDate<=?`).all(from, to);
  }
}
module.exports = TaskRepository;
