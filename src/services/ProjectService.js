const { Project } = require('../models');
const { badRequest, notFound } = require('../errors');

class ProjectService {
  constructor({ projectRepo, taskRepo }) { this.projectRepo = projectRepo; this.taskRepo = taskRepo; }

  createProject(actor, { title, description = '' }) {
    if (!title || !title.trim()) throw badRequest('Project title is required');
    return this.projectRepo.create({ title: title.trim(), description, managerId: actor.id, createdAt: new Date().toISOString() });
  }

  #withProgress(p) { return { ...p, progress: Project.progress(this.taskRepo.findByProject(p.id)) }; }

  list() { return this.projectRepo.findAll().map((p) => this.#withProgress(p)); }

  get(id) {
    const p = this.projectRepo.findById(id);
    if (!p) throw notFound('Project not found');
    return { ...this.#withProgress(p), tasks: this.taskRepo.findByProject(id) };
  }
}
module.exports = ProjectService;
