// 1. Catch-all for routes that don't exist (404 Not Found)
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error down to the global handler below
};

// 2. Centralized Central Error Handling Gatekeeper
export const errorHandler = (err, req, res, next) => {
  // If the controller didn't explicitly set a bad status code, default to a 500 Server Error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message,
    // Hide stack trace in production mode so users can't see your internal database structures
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};