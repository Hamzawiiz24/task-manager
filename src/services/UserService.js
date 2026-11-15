const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { badRequest, unauthorized, conflict } = require('../errors');

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const safe = ({ password, ...user }) => user;

class UserService {
  constructor({ userRepo }) { this.userRepo = userRepo; }

  register({ name, email, password, role = 'member' }) {
    if (!name || !name.trim()) throw badRequest('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email || '')) throw badRequest('A valid email is required');
    if (!password || password.length < 6) throw badRequest('Password must be at least 6 characters');
    if (!User.ROLES.includes(role)) throw badRequest('Role must be manager or member');
    if (this.userRepo.findByEmail(email.toLowerCase())) throw conflict('Email already registered');
    const hash = bcrypt.hashSync(password, 10); // NFR-2
    return safe(this.userRepo.create({ name: name.trim(), email: email.toLowerCase(), password: hash, role }));
  }

  login({ email, password }) {
    const user = this.userRepo.findByEmail((email || '').toLowerCase());
    if (!user || !bcrypt.compareSync(password || '', user.password)) throw unauthorized('Invalid email or password');
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET, { expiresIn: '8h' });
    return { token, user: safe(user) };
  }

  verifyToken(token) {
    try { return jwt.verify(token, SECRET); } catch { throw unauthorized('Session expired, please log in again'); }
  }

  listUsers() { return this.userRepo.findAll().map(safe); }
}
module.exports = UserService;
