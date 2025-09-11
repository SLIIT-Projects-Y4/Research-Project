const { fail } = require('../utils/response');

function notFound(req, res) {
  return res.status(404).json(fail('NOT_FOUND', 'Route not found', { path: req.originalUrl }));
}

function errorHandler(err, _req, res, next) {
  if (res.headersSent) return next(err);

  // Zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json(fail('VALIDATION_ERROR', 'Invalid request', err.errors));
  }

  // Axios (ML upstream) error
  if (err.isAxiosError) {
    const status = err.response?.status || 502;
    const details = err.response?.data ?? { message: err.message };
    return res.status(status).json(fail('UPSTREAM_ERROR', 'ML backend error', details));
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json(fail('INTERNAL_ERROR', err.message || 'Internal Server Error'));
}

module.exports = { notFound, errorHandler };
