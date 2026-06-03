function requestLogger(req, _res, next) {
  // eslint-disable-next-line no-console
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

module.exports = { requestLogger };
