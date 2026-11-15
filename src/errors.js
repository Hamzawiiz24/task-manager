class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
module.exports = {
  AppError,
  badRequest: (m) => new AppError(400, m),
  unauthorized: (m) => new AppError(401, m),
  forbidden: (m) => new AppError(403, m),
  notFound: (m) => new AppError(404, m),
  conflict: (m) => new AppError(409, m),
};
