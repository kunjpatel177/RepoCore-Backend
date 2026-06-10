const express = require("express");
const fileController = require("../controllers/fileController");
const authMiddleware = require("../middleware/authMiddleware");

const fileRouter = express.Router();

// GET FILE CONTENT
fileRouter.get("/file/content", fileController.getFileContent);

// DOWNLOAD FILE
fileRouter.get("/file/download", fileController.downloadFile);

fileRouter.get("/commit/:commitId/files", fileController.getCommitFiles);

module.exports = fileRouter;