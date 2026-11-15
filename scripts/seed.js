const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');

const db = openDatabase(process.env.DB_FILE || 'data.db');
const { services: s, repos } = createApp(db);
if (repos.userRepo.findAll().length) { console.log('Database already has data - skipping seed.'); process.exit(0); }

const manager = s.userService.register({ name: 'Mona Manager', email: 'mona@demo.com', password: 'password123', role: 'manager' });
const alice = s.userService.register({ name: 'Alice Member', email: 'alice@demo.com', password: 'password123' });
const bob = s.userService.register({ name: 'Bob Member', email: 'bob@demo.com', password: 'password123' });
const project = s.projectService.createProject(manager, { title: 'Website Launch', description: 'Ship the new site' });
const tomorrow = new Date(Date.now() + 20 * 3600 * 1000).toISOString();
const t1 = s.taskService.createTask({ title: 'Design homepage', priority: 'High', projectId: project.id, assigneeId: alice.id, dueDate: tomorrow });
s.taskService.createTask({ title: 'Write copy', projectId: project.id, assigneeId: bob.id, dueDate: '2026-01-01' });
s.recurringService.define(t1.id, 'weekly');
console.log('Seeded. Log in with mona@demo.com / alice@demo.com / bob@demo.com, password: password123');
