class ConsoleObserver {
  update(n) { console.log(`[notification -> user ${n.userId}] (${n.type}) ${n.message}`); }
}
module.exports = { ConsoleObserver };
