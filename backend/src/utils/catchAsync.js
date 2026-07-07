// Wraps async route handlers so thrown errors forward to the error handler
// Without this, unhandled promise rejections would crash the server
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
