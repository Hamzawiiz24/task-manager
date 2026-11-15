const path = require('path');
const express = require('express');
const { notFound } = require('./errors');
const errorHandler = require('./middleware/errorHandler');
const buildRoutes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');

const UserRepository = require('./repositories/UserRepository');
const ProjectRepository = require('./repositories/ProjectRepository');
const TaskRepository = require('./repositories/TaskRepository');
const CommentRepository = require('./repositories/CommentRepository');
const NotificationRepository = require('./repositories/NotificationRepository');
const TaskHistoryRepository = require('./repositories/TaskHistoryRepository');
const RecurrenceRepository = require('./repositories/RecurrenceRepository');

const UserService = require('./services/UserService');
const ProjectService = require('./services/ProjectService');
const TaskService = require('./services/TaskService');
const NotificationService = require('./services/NotificationService');
const RecurringTaskService = require('./services/RecurringTaskService');
const ReportService = require('./services/ReportService');

// Dependency injection: every layer receives its dependencies (SOLID: Dependency Inversion).
function createApp(db) {
  const repos = {
    userRepo: new UserRepository(db), projectRepo: new ProjectRepository(db), taskRepo: new TaskRepository(db),
    commentRepo: new CommentRepository(db), notificationRepo: new NotificationRepository(db),
    historyRepo: new TaskHistoryRepository(db), recurrenceRepo: new RecurrenceRepository(db),
  };
  const notificationService = new NotificationService(repos);
  const services = {
    notificationService,
    userService: new UserService(repos),
    projectService: new ProjectService(repos),
    taskService: new TaskService({ ...repos, notificationService }),
    recurringService: new RecurringTaskService({ ...repos, notificationService }),
    reportService: new ReportService(repos),
  };
  const controllers = {
    auth: require('./controllers/authController')(services.userService),
    project: require('./controllers/projectController')(services.projectService),
    task: require('./controllers/taskController')(services.taskService, services.recurringService),
    notification: require('./controllers/notificationController')(notificationService),
    report: require('./controllers/reportController')(services.reportService),
  };

  const app = express();
  app.use(express.json());
  app.get('/api-docs.json', (req, res) => res.json(openapi));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }));
  app.use('/api', buildRoutes(controllers, services.userService));
  app.use('/api', (req, res, next) => next(notFound('Route not found')));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(errorHandler);
  return { app, services, repos };
}
module.exports = { createApp };
