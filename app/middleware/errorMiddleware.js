const ErrorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500; // if no status code is provided, default to 500 (internal server error)
  const message = err.message || "Something went wrong";
  res.status(status).json({
    status,
    message,
  });
};

module.exports = ErrorHandler;
