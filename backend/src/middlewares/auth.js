import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';

// Protect routes — verifies JWT from Authorization header
export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists or has been deactivated.', 401));
  }

  req.user = user;
  next();
});

