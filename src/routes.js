const express = require('express');
const { authenticate, requireRole } = require('./middleware/auth');

module.exports = (c, userService) => {
  // DECLARATIVE paradigm: the route table describes what each URL does.
  const r = express.Router();
  const manager = requireRole('manager');
  r.post('/auth/register', c.auth.register);
  r.post('/auth/login', c.auth.login);
  r.use(authenticate(userService));
  r.get('/users', c.auth.list);
  r.post('/projects', manager, c.project.create);
  r.get('/projects', c.project.list);
  r.get('/projects/:id', c.project.get);
  r.post('/tasks', manager, c.task.create);
  r.get('/tasks', c.task.list);
  r.get('/tasks/:id', c.task.get);
  r.patch('/tasks/:id/assign', manager, c.task.assign);
  r.patch('/tasks/:id/status', c.task.updateStatus);
  r.post('/tasks/:id/time', c.task.logTime);
  r.post('/tasks/:id/comments', c.task.comment);
  r.post('/tasks/:id/recurrence', manager, c.task.recur);
  r.get('/notifications', c.notification.list);
  r.patch('/notifications/:id/read', c.notification.markRead);
  r.get('/reports', manager, c.report.get);
  return r;
};
