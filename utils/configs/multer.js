const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("./cloudinary");

// Profile upload
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
const profileUpload = multer({ storage: profileStorage });

// Screenshot upload
const screenshotStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "screenshots",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1024, height: 1024, crop: "limit" }],
  },
});
const screenshotUpload = multer({ storage: screenshotStorage });

module.exports = {
  profileUpload,
  screenshotUpload,
};
