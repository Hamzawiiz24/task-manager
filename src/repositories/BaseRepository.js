// Repository pattern: only whitelisted columns can ever reach SQL.
class BaseRepository {
  constructor(db, table, columns) { this.db = db; this.table = table; this.columns = columns; }
  #pick(data) { return this.columns.filter((c) => data[c] !== undefined); }
  create(data) {
    const cols = this.#pick(data);
    const sql = `INSERT INTO ${this.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
    const info = this.db.prepare(sql).run(...cols.map((c) => data[c]));
    return this.findById(info.lastInsertRowid);
  }
  update(id, data) {
    const cols = this.#pick(data);
    if (cols.length) {
      this.db.prepare(`UPDATE ${this.table} SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=?`)
        .run(...cols.map((c) => data[c]), id);
    }
    return this.findById(id);
  }
  findById(id) { return this.db.prepare(`SELECT * FROM ${this.table} WHERE id=?`).get(id); }
  findAll() { return this.db.prepare(`SELECT * FROM ${this.table}`).all(); }
}
module.exports = BaseRepository;
