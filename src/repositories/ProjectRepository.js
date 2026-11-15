const BaseRepository = require('./BaseRepository');
class ProjectRepository extends BaseRepository {
  constructor(db) { super(db, 'projects', ['title', 'description', 'managerId', 'createdAt']); }
}
module.exports = ProjectRepository;
