import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate an access token (short-lived, sent to client)
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

// Generate a refresh token (long-lived, stored in DB for rotation)
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

// Hash a refresh token before storing in DB (never store raw tokens)
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Verify and decode an access token
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

// Verify and decode a refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};
