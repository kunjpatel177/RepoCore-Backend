const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const sanitizeInput = require("../utils/sanitizeInput");
const asyncHandler = require("../utils/asyncHandler");
const { issueValidator } = require("../utils/issueValidator");

async function createIssue(req, res) {
    try {
        let { title, description, repository } = req.body;

        title = sanitizeInput(title).trim();
        description = sanitizeInput(description).trim();

        const author = req.user.id;

        const issueValidation = issueValidator(title, description);

        if (!issueValidation.valid) {
            return res.status(400).json({
                success: false,
                error: issueValidation.message,
            });
        }

        // REPOSITORY VALIDATION
        if (!repository) {
            return res.status(400).json({
                error: "Repository is required",
            });
        }

        // DUPLICATE ISSUE CHECK
        const existingIssue = await Issue.findOne({ repository, title });

        if (existingIssue) {
            return res.status(400).json({
                error: "Issue with this title already exists",
            });
        }

        // CREATE ISSUE
        const issue = await Issue.create({
            title,
            description,
            repository,
            author,
            status: "open",
        });

        // UPDATE REPOSITORY
        await Repository.findByIdAndUpdate(repository, {
            $push: {
                issues: issue._id,
            },
        });

        // RESPONSE
        res.status(201).json({
            success: true,
            message: "Issue created successfully",
            issue,
        });
    } catch (err) {
        console.error("Issue creation error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
}

async function deleteIssueById(req, res) {
    const { id } = req.params;

    try {
        const issue = await Issue.findByIdAndDelete(id);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found!" });
        }
        res.json({ message: "Issue deleted" });
    } catch (err) {
        console.error("Error during issue deletion : ", err.message);
        res.status(500).send("Server error");
    }
}

async function getAllIssues(req, res) {
    
    try {
        const { id } = req.params;
        const issues = await Issue.find({ repository: id })
            .populate("author", "username")
            .sort({ createdAt: -1 });

        if (!issues) {
            return res.status(404).json({ error: "Issues not found!" });
        }
        res.status(200).json(issues);
    } catch (err) {
        console.error("Error during issue fetching : ", err.message);
        res.status(500).send("Server error");
    }
}

async function getIssueById(req, res) {
    const { id } = req.params;
    try {
        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found!" });
        }

        res.json(issue);
    } catch (err) {
        console.error("Error during issue updation : ", err.message);
        res.status(500).send("Server error");
    }
}

async function deleteIssue(req, res) {
    try {
        const issueId = req.params.id;
        const currentUserId = req.user.id;

        const issue = await Issue.findById(issueId).populate("repository");

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        if (issue.repository.owner.toString() !== currentUserId) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        await Repository.findByIdAndUpdate(issue.repository._id, {
            $pull: { issues: issueId },
        });

        await Issue.findByIdAndDelete(issueId);

        res.status(200).json({
            success: true,
            message: "Issue deleted successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to delete issue",
        });
    }
};

async function updateIssue(req, res) {
    try {
        const issueId = req.params.id;
        let { title, description, status } = req.body;

        // SANITIZE
        title = sanitizeInput(title).trim();
        description = sanitizeInput(description).trim();

        const issueValidation = issueValidator(title, description);

        if (!issueValidation.valid) {
            return res.status(400).json({
                success: false,
                error: issueValidation.message,
            });
        }

        // FIND ISSUE
        const issue = await Issue.findById(issueId);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found" });
        }

        // DUPLICATE ISSUE CHECK
        const existingIssue = await Issue.findOne({
            repository: issue.repository,
            title,
            _id: { $ne: issueId },
        });

        if (existingIssue) {
            return res.status(400).json({ error: "Issue with this title already exists" });
        }

        // UPDATE ISSUE
        issue.title = title;
        issue.description = description;
        issue.status = status;

        await issue.save();

        // RESPONSE
        res.status(200).json({
            success: true,
            message: "Issue updated successfully",
            issue,
        });
    } catch (err) {
        console.error("Update issue error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    createIssue: asyncHandler(createIssue),
    deleteIssueById: asyncHandler(deleteIssueById),
    getAllIssues: asyncHandler(getAllIssues),
    getIssueById: asyncHandler(getIssueById),
    deleteIssue: asyncHandler(deleteIssue),
    updateIssue: asyncHandler(updateIssue),
};