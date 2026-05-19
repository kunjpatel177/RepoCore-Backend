const express =
    require("express");

const fileController =
    require("../controllers/fileController");

const fileRouter =
    express.Router();

fileRouter.get(
    "/commit/:commitId/files",
    fileController.getCommitFiles
);

fileRouter.get(
    "/file/content",
    fileController.getFileContent
);

fileRouter.get(
    "/file/raw",
    fileController.getRawFile
);

module.exports =
    fileRouter;