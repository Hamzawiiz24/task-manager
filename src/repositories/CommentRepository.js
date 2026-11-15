const BaseRepository = require('./BaseRepository');
class CommentRepository extends BaseRepository {
  constructor(db) { super(db, 'comments', ['text', 'userId', 'taskId', 'createdAt', 'mentions']); }
  findByTask(taskId) { return this.db.prepare('SELECT * FROM comments WHERE taskId=? ORDER BY id').all(taskId); }
}
module.exports = CommentRepository;
