module.exports = (projectService) => ({
  create: (req, res) => res.status(201).json(projectService.createProject(req.user, req.body)),
  list: (req, res) => res.json(projectService.list()),
  get: (req, res) => res.json(projectService.get(Number(req.params.id))),
});
