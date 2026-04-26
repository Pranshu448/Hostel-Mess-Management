const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Handle Mongoose strict query / bad ObjectId errors
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    err.message = 'Resource not found';
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
