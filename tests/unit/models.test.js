const { Task, Comment, Project } = require('../../src/models');

describe('FR-2 task lifecycle rules', () => {
  test('allows To Do -> In Progress -> Done', () => {
    expect(Task.canTransition('To Do', 'In Progress')).toBe(true);
    expect(Task.canTransition('In Progress', 'Done')).toBe(true);
  });
  test('rejects skipping In Progress', () => expect(Task.canTransition('To Do', 'Done')).toBe(false));
  test('a done task is never overdue', () => {
    expect(Task.isOverdue({ status: 'Done', dueDate: '2000-01-01' })).toBe(false);
    expect(Task.isOverdue({ status: 'To Do', dueDate: '2000-01-01' })).toBe(true);
  });
});
describe('FR-3 mentions', () => {
  test('extracts unique lowercase handles', () => expect(Comment.extractHandles('Hi @Alice and @bob, @alice?')).toEqual(['alice', 'bob']));
});
describe('Project progress', () => {
  test('percentage of done tasks', () => expect(Project.progress([{ status: 'Done' }, { status: 'To Do' }])).toBe(50));
  test('0 for no tasks', () => expect(Project.progress([])).toBe(0));
});
