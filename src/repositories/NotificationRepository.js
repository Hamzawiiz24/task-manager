const BaseRepository = require('./BaseRepository');
class NotificationRepository extends BaseRepository {
  constructor(db) { super(db, 'notifications', ['userId', 'message', 'type', 'isRead', 'createdAt']); }
  findByUser(userId) { return this.db.prepare('SELECT * FROM notifications WHERE userId=? ORDER BY id DESC').all(userId); }
  exists(userId, type, message) {
    return Boolean(this.db.prepare('SELECT 1 FROM notifications WHERE userId=? AND type=? AND message=?').get(userId, type, message));
  }
}
module.exports = NotificationRepository;
