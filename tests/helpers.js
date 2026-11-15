const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
// Fresh in-memory database + fully wired application for every test.
module.exports = { build: () => createApp(openDatabase(':memory:')) };
