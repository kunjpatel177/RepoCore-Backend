const express = require("express");

const fileController =
    require("../controllers/fileController");

const authMiddleware =
    require("../middleware/authMiddleware");

const fileRouter =
    express.Router();

// =========================
// GET FILE CONTENT
// =========================

fileRouter.get(

    "/file/content",

    fileController.getFileContent
);

// =========================
// DOWNLOAD FILE
// =========================

fileRouter.get(

    "/file/download",

    fileController.downloadFile
);
fileRouter.get(
    "/commit/:commitId/files",
    fileController.getCommitFiles
);

module.exports = fileRouter;



// const express =
//     require("express");

// const fileController =
//     require("../controllers/fileController");

// const fileRouter =
//     express.Router();

// fileRouter.get(
//     "/commit/:commitId/files",
//     fileController.getCommitFiles
// );

// fileRouter.get(
//     "/file/content",
//     fileController.getFileContent
// );

// fileRouter.get(
//     "/file/raw",
//     fileController.getRawFile
// );

// module.exports =
//     fileRouter;