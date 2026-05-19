const express = require("express");

const commitController =
    require("../controllers/commitController");

const commitRouter =
    express.Router();

commitRouter.get(
    "/repo/:id/commits",
    commitController.getRepositoryCommits
);

module.exports = commitRouter;