const { build } = require('../helpers');
let ctx;
const alice = { name: 'Alice', email: 'Alice@x.com', password: 'secret1' };
beforeEach(() => { ctx = build(); });

describe('NFR-2 security', () => {
  test('stores a bcrypt hash, never the plain password', () => {
    const u = ctx.services.userService.register(alice);
    const row = ctx.repos.userRepo.findById(u.id);
    expect(row.password).not.toBe('secret1');
    expect(row.password).toMatch(/^\$2[aby]\$/);
    expect(u.password).toBeUndefined();
  });
  test('login returns a token; wrong password is rejected', () => {
    ctx.services.userService.register(alice);
    expect(ctx.services.userService.login({ email: 'alice@x.com', password: 'secret1' }).token).toBeTruthy();
    expect(() => ctx.services.userService.login({ email: 'alice@x.com', password: 'nope' })).toThrow('Invalid email or password');
  });
  test('rejects duplicate emails and short passwords', () => {
    ctx.services.userService.register(alice);
    expect(() => ctx.services.userService.register(alice)).toThrow('Email already registered');
    expect(() => ctx.services.userService.register({ ...alice, email: 'b@x.com', password: '123' })).toThrow('at least 6');
  });
  test('rejects a bad token', () => expect(() => ctx.services.userService.verifyToken('garbage')).toThrow('Session expired'));
});
