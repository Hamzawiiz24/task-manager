const request = require('supertest');
const { build } = require('../helpers');

// End-to-end happy path through the real HTTP API, covering FR-1 to FR-6.
test('manager and member complete the full workflow', async () => {
  const api = request(build().app);
  const as = (s) => ({ Authorization: `Bearer ${s.token}` });
  const signUp = (name, role) => api.post('/api/auth/register').send({ name, email: `${name.toLowerCase()}@demo.com`, password: 'secret1', role }).expect(201);
  const logIn = async (name) => (await api.post('/api/auth/login').send({ email: `${name}@demo.com`, password: 'secret1' }).expect(200)).body;

  await signUp('Mona', 'manager'); await signUp('Alice', 'member');
  const mona = await logIn('mona'), alice = await logIn('alice');

  const project = (await api.post('/api/projects').set(as(mona)).send({ title: 'Launch' }).expect(201)).body;
  const task = (await api.post('/api/tasks').set(as(mona))
    .send({ title: 'Build login', projectId: project.id, assigneeId: alice.user.id, priority: 'High', dueDate: '2030-01-01' }).expect(201)).body;

  const inbox = (await api.get('/api/notifications').set(as(alice)).expect(200)).body;
  expect(inbox[0].type).toBe('assignment');
  await api.patch(`/api/notifications/${inbox[0].id}/read`).set(as(alice)).expect(200);

  await api.patch(`/api/tasks/${task.id}/status`).set(as(alice)).send({ status: 'In Progress' }).expect(200);
  await api.post(`/api/tasks/${task.id}/time`).set(as(alice)).send({ hours: 3 }).expect(200);
  await api.patch(`/api/tasks/${task.id}/status`).set(as(alice)).send({ status: 'Done' }).expect(200);

  await api.post(`/api/tasks/${task.id}/comments`).set(as(alice)).send({ text: 'Finished, thanks @mona' }).expect(201);
  const managerInbox = (await api.get('/api/notifications').set(as(mona)).expect(200)).body;
  expect(managerInbox.some((n) => n.type === 'mention')).toBe(true);

  const details = (await api.get(`/api/tasks/${task.id}`).set(as(alice)).expect(200)).body;
  expect(details).toMatchObject({ status: 'Done', timeLogged: 3 });
  expect(details.history).toHaveLength(2);

  await api.post(`/api/tasks/${task.id}/recurrence`).set(as(mona)).send({ pattern: 'weekly' }).expect(201);
  const report = (await api.get('/api/reports').set(as(mona)).expect(200)).body;
  expect(report.completionRate).toBe(100);
  expect((await api.get(`/api/projects/${project.id}`).set(as(mona)).expect(200)).body.progress).toBe(100);
});

test('API documentation is served', async () => {
  const api = request(build().app);
  const { body } = await api.get('/api-docs.json').expect(200);
  expect(Object.keys(body.paths)).toContain('/api/tasks/{id}/status');
});

test('security and error handling', async () => {
  const api = request(build().app);
  await api.get('/api/tasks').expect(401);
  await api.post('/api/auth/register').send({ name: 'Al', email: 'al@x.com', password: 'secret1' }).expect(201);
  const { body } = await api.post('/api/auth/login').send({ email: 'al@x.com', password: 'secret1' });
  const auth = { Authorization: `Bearer ${body.token}` };
  await api.get('/api/reports').set(auth).expect(403);
  await api.post('/api/projects').set(auth).send({ title: 'x' }).expect(403);
  await api.post('/api/auth/login').send({ email: 'al@x.com', password: 'bad' }).expect(401);
  await api.get('/api/tasks/999').set(auth).expect(404);
  await api.get('/api/nothing-here').set(auth).expect(404);
});
