import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const uploadsDir = path.join(projectRoot, "uploads");
const profilesDir = path.join(uploadsDir, "profiles");
const filesDir = path.join(uploadsDir, "files");

[uploadsDir, profilesDir, filesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const chatFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    // Decode originalname from UTF-8
    const originalName = Buffer.from(file.originalname, "binary").toString(
      "utf8"
    );
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Create final filename that preserves UTF-8 characters
    const safeFilename = `${nameWithoutExt}-${uniqueSuffix}${extension}`;
    cb(null, safeFilename);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Error: Only allowed to upload image files!"));
};

const chatFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar|txt/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) {
    return cb(null, true);
  }
  cb(
    new Error(
      "Error: File type not allowed! Allowed types: images, documents, archives"
    )
  );
};

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

const uploadChatFile = multer({
  storage: chatFileStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: chatFileFilter,
});

export { uploadProfile, uploadChatFile };
