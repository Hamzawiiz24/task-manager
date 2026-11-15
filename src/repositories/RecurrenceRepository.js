const BaseRepository = require('./BaseRepository');
class RecurrenceRepository extends BaseRepository {
  constructor(db) { super(db, 'recurrences', ['taskId', 'pattern', 'nextRun', 'isActive']); }
  findByTask(taskId) { return this.db.prepare('SELECT * FROM recurrences WHERE taskId=?').get(taskId); }
  findDue(nowIso) { return this.db.prepare('SELECT * FROM recurrences WHERE isActive=1 AND nextRun<=?').all(nowIso); }
}
module.exports = RecurrenceRepository;
