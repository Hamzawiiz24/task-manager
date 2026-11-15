const Database = require('better-sqlite3');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('manager','member')));
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '',
  managerId INTEGER NOT NULL REFERENCES users(id), createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'To Do', priority TEXT NOT NULL DEFAULT 'Medium', dueDate TEXT,
  assigneeId INTEGER REFERENCES users(id), projectId INTEGER NOT NULL REFERENCES projects(id),
  timeLogged REAL NOT NULL DEFAULT 0, createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, userId INTEGER NOT NULL REFERENCES users(id),
  taskId INTEGER NOT NULL REFERENCES tasks(id), createdAt TEXT NOT NULL, mentions TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL REFERENCES users(id), message TEXT NOT NULL,
  type TEXT NOT NULL, isRead INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, taskId INTEGER NOT NULL REFERENCES tasks(id),
  changedBy INTEGER NOT NULL REFERENCES users(id), oldStatus TEXT NOT NULL, newStatus TEXT NOT NULL, timestamp TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS recurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT, taskId INTEGER NOT NULL REFERENCES tasks(id),
  pattern TEXT NOT NULL, nextRun TEXT NOT NULL, isActive INTEGER NOT NULL DEFAULT 1);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
`;

function openDatabase(file = ':memory:') {
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

module.exports = { openDatabase };
