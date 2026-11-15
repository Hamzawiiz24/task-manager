module.exports = (taskService, recurringService) => ({
  create: (req, res) => res.status(201).json(taskService.createTask(req.body)),
  list: (req, res) => res.json(taskService.listTasks(req.user, req.query)),
  get: (req, res) => res.json(taskService.getTaskDetails(Number(req.params.id))),
  assign: (req, res) => res.json(taskService.assignTask(Number(req.params.id), req.body.assigneeId)),
  updateStatus: (req, res) => res.json(taskService.updateStatus(req.user, Number(req.params.id), req.body.status)),
  logTime: (req, res) => res.json(taskService.logTime(req.user, Number(req.params.id), req.body.hours)),
  comment: (req, res) => res.status(201).json(taskService.addComment(req.user, Number(req.params.id), req.body.text)),
  recur: (req, res) => res.status(201).json(recurringService.define(Number(req.params.id), req.body.pattern)),
});
