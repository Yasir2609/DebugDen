import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'debugden' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });

  const result = await uploadPromise;

  res.status(200).json({
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
  });
});

export const deleteImage = catchAsync(async (req, res, next) => {
  // req.params[0] captures the full wildcard path, including slashes in Cloudinary public IDs
  const publicId = req.params[0];

  await cloudinary.uploader.destroy(publicId);

  res.status(200).json({ success: true, message: 'Image deleted successfully' });
});
