const express = require("express");
const issueController = require("../controllers/issueController");
const authMiddleware = require("../middleware/authMiddleware");
const { issueLimiter } = require("../middleware/rateLimitMiddleware");

const issueRouter = express.Router();

issueRouter.put("/issue/update/:id", authMiddleware, issueController.updateIssue);
issueRouter.post("/issue/create/:id", authMiddleware, issueLimiter, issueController.createIssue);
// issueRouter.put("/issue/update/:id", authMiddleware, issueController.updateIssueById);
issueRouter.delete("/issue/delete/:id", authMiddleware, issueController.deleteIssueById);
issueRouter.get("/issue/all/:id", issueController.getAllIssues);
issueRouter.get("/issue/:id", issueController.getIssueById);
issueRouter.delete("/issue/:id", authMiddleware, issueController.deleteIssue);

module.exports = issueRouter;