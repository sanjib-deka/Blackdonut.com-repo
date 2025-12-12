const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filepath) => {
  if (!filepath) return null;
  try {
    const result = await cloudinary.uploader.upload(filepath);
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch (e) { /* ignore cleanup error */ }
    }
    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    // ensure local file cleaned up and rethrow for controller to handle
    if (fs.existsSync(filepath)) {
      try { fs.unlinkSync(filepath); } catch (e) { console.error('Failed cleaning file:', e); }
    }
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    console.log('No publicId provided for deletion');
    return null;
  }
  try {
    console.log(`Attempting to delete Cloudinary image with public_id: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary deletion result:', result);
    
    // Check if deletion was successful
    if (result.result === 'ok') {
      console.log(`Successfully deleted image: ${publicId}`);
      return result;
    } else {
      console.warn(`Cloudinary deletion returned: ${result.result} for ${publicId}`);
      return result;
    }
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    // Don't throw - allow flow to continue if deletion fails
    return null;
  }
};

module.exports = uploadOnCloudinary;
module.exports.default = uploadOnCloudinary;
module.exports.deleteFromCloudinary = deleteFromCloudinary;