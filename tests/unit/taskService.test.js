const { build } = require('../helpers');
let ctx, ts, manager, alice, bob, project;

beforeEach(() => {
  ctx = build(); ts = ctx.services.taskService;
  const { userService, projectService } = ctx.services;
  manager = userService.register({ name: 'Mona', email: 'mona@x.com', password: 'secret1', role: 'manager' });
  alice = userService.register({ name: 'Alice', email: 'alice@x.com', password: 'secret1' });
  bob = userService.register({ name: 'Bob', email: 'bob@x.com', password: 'secret1' });
  project = projectService.createProject(manager, { title: 'P1' });
});
const newTask = (extra = {}) => ts.createTask({ title: 'Write spec', projectId: project.id, assigneeId: alice.id, priority: 'High', ...extra });

describe('FR-1 create and assign tasks', () => {
  test('creates a task and notifies the assignee', () => {
    const t = newTask();
    expect(t).toMatchObject({ status: 'To Do', priority: 'High', assigneeId: alice.id });
    expect(ctx.services.notificationService.list(alice.id)[0].type).toBe('assignment');
  });
  test('rejects an empty title, unknown project and bad date', () => {
    expect(() => newTask({ title: '  ' })).toThrow('Title is required');
    expect(() => newTask({ projectId: 999 })).toThrow('Project not found');
    expect(() => newTask({ dueDate: 'not-a-date' })).toThrow('Invalid due date');
  });
  test('re-assigning notifies the new assignee', () => {
    const t = newTask();
    ts.assignTask(t.id, bob.id);
    expect(ctx.services.notificationService.list(bob.id)).toHaveLength(1);
  });
  test('members only see their own tasks; managers see all', () => {
    newTask(); newTask({ assigneeId: bob.id });
    expect(ts.listTasks(alice)).toHaveLength(1);
    expect(ts.listTasks(manager)).toHaveLength(2);
  });
});

describe('FR-2 update status and log time', () => {
  test('moves status forward and writes history', () => {
    const t = newTask();
    expect(ts.updateStatus(alice, t.id, 'In Progress').status).toBe('In Progress');
    expect(ctx.repos.historyRepo.findByTask(t.id)).toHaveLength(1);
  });
  test('rejects invalid transitions and statuses', () => {
    const t = newTask();
    expect(() => ts.updateStatus(alice, t.id, 'Done')).toThrow('Cannot move');
    expect(() => ts.updateStatus(alice, t.id, 'Nope')).toThrow('Status must be');
  });
  test('a member cannot change someone else\'s task', () => {
    expect(() => ts.updateStatus(bob, newTask().id, 'In Progress')).toThrow('only update your own');
  });
  test('accumulates logged hours and validates input', () => {
    const t = newTask();
    ts.logTime(alice, t.id, 1.5);
    expect(ts.logTime(alice, t.id, 2).timeLogged).toBe(3.5);
    expect(() => ts.logTime(alice, t.id, 0)).toThrow('Hours must be');
  });
});

describe('FR-3 comments and mentions', () => {
  test('stores the comment and notifies mentioned users only', () => {
    const t = newTask();
    const c = ts.addComment(alice, t.id, 'Please review @bob');
    expect(c.mentions).toEqual([bob.id]);
    expect(ctx.services.notificationService.list(bob.id)[0].type).toBe('mention');
    expect(ts.getTaskDetails(t.id).comments).toHaveLength(1);
  });
  test('rejects empty comments and ignores self mentions', () => {
    const t = newTask();
    expect(() => ts.addComment(alice, t.id, ' ')).toThrow('Comment cannot be empty');
    expect(ts.addComment(alice, t.id, 'note to @alice').mentions).toEqual([]);
  });
});
