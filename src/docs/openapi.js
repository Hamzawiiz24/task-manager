// OpenAPI 3 description of the REST API (served as Swagger UI at /api-docs).
const str = (example, extra = {}) => ({ type: 'string', example, ...extra });
const int = (example) => ({ type: 'integer', example });
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required });
const body = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const pathId = { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 };
const query = (name, type = 'integer') => ({ name, in: 'query', schema: { type } });

function op(tag, summary, { req, params = [], ok = '200', role, open = false } = {}) {
  return {
    tags: [tag],
    summary: role ? `${summary} (${role} only)` : summary,
    ...(open ? {} : { security: [{ bearerAuth: [] }] }),
    parameters: params,
    ...(req ? { requestBody: body(req) } : {}),
    responses: {
      [ok]: { description: 'Success' }, 400: { description: 'Validation error' }, 404: { description: 'Not found' },
      ...(open ? {} : { 401: { description: 'Missing or invalid token' } }),
      ...(role ? { 403: { description: 'Role not allowed' } } : {}),
    },
  };
}

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Task & Project Management API', version: '1.0.0',
    description: 'Log in via POST /auth/login, copy the token, click Authorize and paste it.' },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/auth/register': { post: op('Auth', 'Register a user', { open: true, ok: '201',
      req: obj({ name: str('Mona'), email: str('mona@demo.com'), password: str('secret1'), role: str('manager', { enum: ['manager', 'member'] }) }, ['name', 'email', 'password']) }) },
    '/api/auth/login': { post: op('Auth', 'Log in and get a JWT', { open: true, req: obj({ email: str('mona@demo.com'), password: str('secret1') }) }) },
    '/api/users': { get: op('Auth', 'List users') },
    '/api/projects': {
      post: op('Projects (FR-1)', 'Create a project', { ok: '201', role: 'manager', req: obj({ title: str('Website Launch'), description: str('Ship it') }, ['title']) }),
      get: op('Projects (FR-1)', 'List projects with progress %'),
    },
    '/api/projects/{id}': { get: op('Projects (FR-1)', 'Project details and tasks', { params: [pathId] }) },
    '/api/tasks': {
      post: op('Tasks (FR-1)', 'Create a task and assign it', { ok: '201', role: 'manager',
        req: obj({ title: str('Design homepage'), description: str('Hero + nav'), priority: str('High', { enum: ['Low', 'Medium', 'High'] }),
          dueDate: str('2030-01-31'), projectId: int(1), assigneeId: int(2) }, ['title', 'projectId']) }),
      get: op('Tasks (FR-1)', 'List tasks (members see only their own; paginated)', { params: [query('projectId'), query('limit'), query('offset')] }),
    },
    '/api/tasks/{id}': { get: op('Tasks (FR-1)', 'Task with comments and status history', { params: [pathId] }) },
    '/api/tasks/{id}/assign': { patch: op('Tasks (FR-1)', 'Re-assign a task', { role: 'manager', params: [pathId], req: obj({ assigneeId: int(2) }) }) },
    '/api/tasks/{id}/status': { patch: op('Tasks (FR-2)', 'Update status (To Do > In Progress > Done)', { params: [pathId],
      req: obj({ status: str('In Progress', { enum: ['To Do', 'In Progress', 'Done'] }) }) }) },
    '/api/tasks/{id}/time': { post: op('Tasks (FR-2)', 'Log hours worked', { params: [pathId], req: obj({ hours: { type: 'number', example: 2.5 } }) }) },
    '/api/tasks/{id}/comments': { post: op('Comments (FR-3)', 'Comment on a task; @handle mentions notify users', { ok: '201', params: [pathId],
      req: obj({ text: str('Looks good @alice') }) }) },
    '/api/tasks/{id}/recurrence': { post: op('Recurring (FR-5)', 'Make a task recur', { ok: '201', role: 'manager', params: [pathId],
      req: obj({ pattern: str('weekly', { enum: ['daily', 'weekly', 'monthly'] }) }) }) },
    '/api/notifications': { get: op('Notifications (FR-4)', 'My notifications (assignment, mention, due soon)') },
    '/api/notifications/{id}/read': { patch: op('Notifications (FR-4)', 'Mark a notification as read', { params: [pathId] }) },
    '/api/reports': { get: op('Reports (FR-6)', 'Completion rate, overdue tasks, workload', { role: 'manager', params: [query('projectId')] }) },
  },
};
