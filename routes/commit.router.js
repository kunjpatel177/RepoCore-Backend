const express = require("express");
const authMiddleware =
    require("../middleware/authMiddleware");

const commitController =
    require("../controllers/commitController");

const commitRouter =
    express.Router();

commitRouter.get(
    "/repo/:id/commits",
    commitController.getRepositoryCommits
);

commitRouter.delete("/commit/:id", authMiddleware, commitController.deleteCommit);

module.exports = commitRouter;