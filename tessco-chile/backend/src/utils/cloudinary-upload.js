const streamifier = require('streamifier');
const { cloudinary, defaultFolder } = require('../config/cloudinary');

const uploadBuffer = (buffer, options = {}) => {
  const folder = options.folder || defaultFolder;
  const publicId = options.public_id;
  const resourceType = options.resource_type || 'image';
  const uploadOptions = {
    folder,
    public_id: publicId,
    resource_type: resourceType,
    overwrite: true,
    use_filename: false,
    unique_filename: true,
    ...options.extra
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const buildTransformedUrl = (publicId, transformations) => {
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations
  });
};

module.exports = {
  uploadBuffer,
  buildTransformedUrl
};

