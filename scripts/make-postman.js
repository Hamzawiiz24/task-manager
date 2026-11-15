// Generates postman/Task-Manager.postman_collection.json  (run: npm run postman)
const fs = require('fs');
const bearer = (v) => ({ type: 'bearer', bearer: [{ key: 'token', value: `{{${v}Token}}`, type: 'string' }] });
const set = (name, expr) => `pm.collectionVariables.set('${name}', ${expr});`;

// [name, method, path, auth, body, expectedStatus, extra test script]
const steps = [
  ['01 Register manager', 'POST', '/api/auth/register', null, { name: 'Mona', email: 'mona{{runId}}@demo.com', password: 'secret1', role: 'manager' }, 201],
  ['02 Register member', 'POST', '/api/auth/register', null, { name: 'Alice', email: 'alice{{runId}}@demo.com', password: 'secret1', role: 'member' }, 201],
  ['03 Login manager', 'POST', '/api/auth/login', null, { email: 'mona{{runId}}@demo.com', password: 'secret1' }, 200, set('managerToken', 'pm.response.json().token')],
  ['04 Login member', 'POST', '/api/auth/login', null, { email: 'alice{{runId}}@demo.com', password: 'secret1' }, 200,
    `${set('memberToken', 'pm.response.json().token')} ${set('memberId', 'pm.response.json().user.id')}`],
  ['05 List users', 'GET', '/api/users', 'manager', null, 200],
  ['06 FR-1 Create project', 'POST', '/api/projects', 'manager', { title: 'Website Launch', description: 'Ship the site' }, 201, set('projectId', 'pm.response.json().id')],
  ['07 FR-1 Create + assign task', 'POST', '/api/tasks', 'manager',
    { title: 'Design homepage', description: 'Hero and nav', priority: 'High', dueDate: '2030-01-31', projectId: '{{projectId}}', assigneeId: '{{memberId}}' }, 201, set('taskId', 'pm.response.json().id')],
  ['08 FR-1 Member lists own tasks', 'GET', '/api/tasks', 'member', null, 200, `pm.test('has the task', () => pm.expect(pm.response.json().length).to.be.above(0));`],
  ['09 FR-4 Member sees assignment notification', 'GET', '/api/notifications', 'member', null, 200,
    `${set('notifId', 'pm.response.json()[0].id')} pm.test('type is assignment', () => pm.expect(pm.response.json()[0].type).to.eql('assignment'));`],
  ['10 FR-4 Mark notification read', 'PATCH', '/api/notifications/{{notifId}}/read', 'member', null, 200],
  ['11 FR-2 Status To Do > In Progress', 'PATCH', '/api/tasks/{{taskId}}/status', 'member', { status: 'In Progress' }, 200,
    `pm.test('status updated', () => pm.expect(pm.response.json().status).to.eql('In Progress'));`],
  ['12 FR-2 Log time', 'POST', '/api/tasks/{{taskId}}/time', 'member', { hours: 2.5 }, 200],
  ['13 FR-3 Comment mentioning manager', 'POST', '/api/tasks/{{taskId}}/comments', 'member', { text: 'Almost done @mona{{runId}}' }, 201],
  ['14 FR-4 Manager sees mention notification', 'GET', '/api/notifications', 'manager', null, 200,
    `pm.test('has mention', () => pm.expect(pm.response.json().some(n => n.type === 'mention')).to.be.true);`],
  ['15 FR-2 Status In Progress > Done', 'PATCH', '/api/tasks/{{taskId}}/status', 'member', { status: 'Done' }, 200],
  ['16 FR-1/2/3 Task details (comments + history)', 'GET', '/api/tasks/{{taskId}}', 'member', null, 200,
    `pm.test('history logged', () => pm.expect(pm.response.json().history.length).to.eql(2));`],
  ['17 FR-5 Make task recurring (weekly)', 'POST', '/api/tasks/{{taskId}}/recurrence', 'manager', { pattern: 'weekly' }, 201],
  ['18 FR-1 Project progress', 'GET', '/api/projects/{{projectId}}', 'manager', null, 200,
    `pm.test('100% complete', () => pm.expect(pm.response.json().progress).to.eql(100));`],
  ['19 FR-6 Report', 'GET', '/api/reports', 'manager', null, 200,
    `pm.test('completion 100', () => pm.expect(pm.response.json().completionRate).to.eql(100));`],
  ['20 NFR-2 Member blocked from report (403)', 'GET', '/api/reports', 'member', null, 403],
  ['21 NFR-2 No token (401)', 'GET', '/api/tasks', null, null, 401],
  ['22 NFR-4 Invalid transition (400)', 'PATCH', '/api/tasks/{{taskId}}/status', 'member', { status: 'Done' }, 200 /* Done->Done is invalid */],
];
steps[steps.length - 1] = ['22 NFR-4 Invalid transition gives a friendly 400', 'PATCH', '/api/tasks/{{taskId}}/status', 'member', { status: 'To Do' }, 400];

const item = ([name, method, path, auth, body, status, extra = '']) => ({
  name,
  event: [{ listen: 'test', script: { type: 'text/javascript', exec: [`pm.test('Status is ${status}', () => pm.response.to.have.status(${status}));`, extra].filter(Boolean) } }],
  request: {
    method, header: [{ key: 'Content-Type', value: 'application/json' }],
    auth: auth ? bearer(auth) : { type: 'noauth' },
    url: { raw: `{{baseUrl}}${path}`, host: ['{{baseUrl}}'], path: path.split('/').filter(Boolean) },
    ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
  },
});

const collection = {
  info: { name: 'Task & Project Manager - M2 demo', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description: 'Run the collection top to bottom (or use the Collection Runner). Each run creates fresh users via {{runId}}.' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }],
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: ["if (!pm.collectionVariables.get('runId')) pm.collectionVariables.set('runId', Date.now());"] } }],
  item: steps.map(item),
};
fs.mkdirSync('postman', { recursive: true });
fs.writeFileSync('postman/Task-Manager.postman_collection.json', JSON.stringify(collection, null, 2));
console.log(`Wrote collection with ${steps.length} requests`);
