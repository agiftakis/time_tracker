import { v2 as cloudinary } from 'cloudinary';
import { UploadedFile } from 'express-fileupload';

// Make sure to set these in your ".env" or Vercel environment!
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Helper: Upload image (returns Cloudinary URL)
export async function uploadProfileImage(file: UploadedFile): Promise<string> {
  try {
    const response = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'profile_pics', // Optional: organizes your images
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' } // Example: crop to 300x300 centered on face
      ],
    });
    return response.secure_url; // The public image URL for storage in "profileImageUrl"
  } catch (error) {
    throw new Error('Failed to upload image to Cloudinary');
  }
}
