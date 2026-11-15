const BaseRepository = require('./BaseRepository');
class UserRepository extends BaseRepository {
  constructor(db) { super(db, 'users', ['name', 'email', 'password', 'role']); }
  findByEmail(email) { return this.db.prepare('SELECT * FROM users WHERE email=?').get(email); }
  findByHandle(handle) { return this.db.prepare("SELECT * FROM users WHERE lower(email) LIKE ? || '@%'").get(handle); }
}
module.exports = UserRepository;
