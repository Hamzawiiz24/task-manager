const BaseRepository = require('./BaseRepository');
class TaskHistoryRepository extends BaseRepository {
  constructor(db) { super(db, 'task_history', ['taskId', 'changedBy', 'oldStatus', 'newStatus', 'timestamp']); }
  findByTask(taskId) { return this.db.prepare('SELECT * FROM task_history WHERE taskId=? ORDER BY id').all(taskId); }
}
module.exports = TaskHistoryRepository;
