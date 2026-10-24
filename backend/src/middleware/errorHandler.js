function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error(err.message || err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    success: false,
    message: status < 500 ? err.message : "Internal server error"
  });
}

module.exports = errorHandler;
