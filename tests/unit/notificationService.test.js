const NotificationService = require('../../src/services/NotificationService');

describe('FR-4 notifications (Observer pattern)', () => {
  test('every subscribed observer is told about a new notification', () => {
    const repo = { create: jest.fn((d) => ({ id: 1, ...d })) };
    const svc = new NotificationService({ notificationRepo: repo, taskRepo: {} });
    const o1 = { update: jest.fn() }, o2 = { update: jest.fn() };
    svc.subscribe(o1); svc.subscribe(o2);
    svc.notify(5, 'assignment', 'hello');
    expect(o1.update).toHaveBeenCalledWith(expect.objectContaining({ userId: 5, type: 'assignment' }));
    expect(o2.update).toHaveBeenCalledTimes(1);
  });
  test('due-date reminders are sent once per task', () => {
    const taskRepo = { findDueBetween: jest.fn(() => [{ id: 1, title: 'T', assigneeId: 2 }]) };
    const repo = { create: jest.fn((d) => d), exists: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true) };
    const svc = new NotificationService({ notificationRepo: repo, taskRepo });
    expect(svc.checkDueSoon()).toBe(1);
    expect(svc.checkDueSoon()).toBe(0);
  });
  test('a user cannot mark someone else\'s notification as read', () => {
    const repo = { findById: () => ({ id: 1, userId: 9 }) };
    const svc = new NotificationService({ notificationRepo: repo, taskRepo: {} });
    expect(() => svc.markAsRead(1, 1)).toThrow('Notification not found');
  });
});
