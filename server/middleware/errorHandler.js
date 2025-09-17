const mongoose = require('mongoose');

// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle different types of errors with criminal-themed messages
const handleCastErrorDB = (err) => {
  const message = `Неверный ${err.path}: ${err.value}. Эта тропа не ведет в наш район.`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Дубликат поля: ${value}. Этот псевдоним уже занят в нашем районе.`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Неверные данные: ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Неверный токен доступа. Твои документы поддельные.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Токен доступа истёк. Время действия пропуска закончилось.', 401, 'TOKEN_EXPIRED');

// Send error response in development
const sendErrorDev = (err, req, res) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: err,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  }
  
  // Rendered website errors (if any)
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    status: 'error',
    message: err.message,
    code: err.code
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
        code: err.code
      });
    }
    
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Что-то пошло не так в тёмных переулках сервера...',
      code: 'INTERNAL_ERROR'
    });
  }
  
  // Rendered website errors (if any)
  if (err.isOperational) {
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code
    });
  }
  
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    status: 'error',
    message: 'Что-то пошло не так...',
    code: 'UNKNOWN_ERROR'
  });
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, req, res);
  }
};

// Catch async errors wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = {
  AppError,
  errorHandler,
  catchAsync
};
