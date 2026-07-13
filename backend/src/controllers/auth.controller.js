import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';

const sendTokens = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true, // Not accessible via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  user.refreshTokens.push({ token: hashToken(refreshToken) });
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
  });
};

export const register = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return next(
      new AppError(
        existingUser.email === email ? 'Email already in use' : 'Username already taken',
        400
      )
    );
  }

  // Create new user
  const user = await User.create({ username, email, password });
  await sendTokens(user, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password field (excluded by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user account is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 403));
  }

  await sendTokens(user, 200, res);
});

export const refresh = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 401));
  }

  // Verify the refresh token signature
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  // Find user and verify the hashed token exists in their refreshTokens array
  const hashedToken = hashToken(refreshToken);
  const user = await User.findOne({
    _id: decoded.id,
    'refreshTokens.token': hashedToken,
  }).select('+refreshTokens');

  if (!user) {
    return next(new AppError('Refresh token is invalid or has been revoked', 401));
  }

  // Token rotation: remove old token, issue new pair
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== hashedToken);
  await sendTokens(user, 200, res);
});

export const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    const hashedToken = hashToken(refreshToken);
    // Find the user who owns this refresh token and remove it
    await User.findOneAndUpdate(
      { 'refreshTokens.token': hashedToken },
      { $pull: { refreshTokens: { token: hashedToken } } },
    );
  }

  // Clear the refresh token cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getAuthUser = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});
