const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const sanitizeInput = require("../utils/sanitizeInput");
const asyncHandler = require("../utils/asyncHandler");

async function createIssue(req, res) {

    try {

        let { title, description, repository } = req.body;

        title = sanitizeInput(title);
        description = sanitizeInput(description);

        const author = req.user.id;

        // REQUIRED VALIDATION

        if (!title || !title.trim()) {
            return res.status(400).json({
                error: "Issue title is required",
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                error: "Issue description is required",
            });
        }

        // REMOVE EXTRA SPACES

        title = title.trim();
        description = description.trim();

        // TITLE LENGTH

        if (title.length < 5) {
            return res.status(400).json({
                error: "Issue title must be at least 5 characters",
            });
        }

        if (title.length > 100) {
            return res.status(400).json({
                error: "Issue title cannot exceed 100 characters",
            });
        }

        // DESCRIPTION LENGTH

        if (description.length < 10) {
            return res.status(400).json({
                error: "Issue description must be at least 10 characters",
            });
        }

        if (description.length > 1000) {
            return res.status(400).json({
                error: "Issue description cannot exceed 1000 characters",
            });
        }

        // REPOSITORY VALIDATION

        if (!repository) {
            return res.status(400).json({
                error: "Repository is required",
            });
        }

        // BASIC XSS PREVENTION

        const blockedPatterns = [
            "<script",
            "</script>",
            "javascript:",
            "<iframe",
            "</iframe>",
        ];

        const combinedText = (title + description).toLowerCase();

        const containsBlockedContent = blockedPatterns.some(pattern =>
            combinedText.includes(pattern)
        );

        if (containsBlockedContent) {
            return res.status(400).json({
                error: "Invalid content detected",
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
    const { id } = req.params;

    try {
        const issues = await Issue.find({ repository: id }).populate("author", "username").sort({ createdAt: -1 });

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

const deleteIssue = async (req, res) => {

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

const updateIssue = async (req, res) => {

    try {

        const issueId = req.params.id;
        let { title, description, status } = req.body;

        // =========================
        // SANITIZE
        // =========================

        title = sanitizeInput(title);
        description = sanitizeInput(description);

        // =========================
        // REQUIRED VALIDATION
        // =========================

        if (!title || !title.trim()) {
            return res.status(400).json({ error: "Issue title is required" });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({ error: "Issue description is required" });
        }

        // =========================
        // REMOVE EXTRA SPACES
        // =========================

        title = title.trim();
        description = description.trim();

        // =========================
        // TITLE LENGTH
        // =========================

        if (title.length < 5) {
            return res.status(400).json({ error: "Issue title must be at least 5 characters" });
        }

        if (title.length > 100) {
            return res.status(400).json({ error: "Issue title cannot exceed 100 characters" });
        }

        // =========================
        // DESCRIPTION LENGTH
        // =========================

        if (description.length < 10) {
            return res.status(400).json({ error: "Issue description must be at least 10 characters" });
        }

        if (description.length > 1000) {
            return res.status(400).json({ error: "Issue description cannot exceed 1000 characters" });
        }

        // =========================
        // XSS PREVENTION
        // =========================

        // const blockedPatterns = ["<script", "</script>", "javascript:", "<iframe", "</iframe>"];

        // const combinedText = (title + description).toLowerCase();

        // const containsBlockedContent = blockedPatterns.some(
        //     pattern => combinedText.includes(pattern)
        // );

        // if (containsBlockedContent) {
        //     return res.status(400).json({ error: "Invalid content detected" });
        // }

        // =========================
        // FIND ISSUE
        // =========================

        const issue = await Issue.findById(issueId);

        if (!issue) {
            return res.status(404).json({ error: "Issue not found" });
        }

        // =========================
        // AUTHORIZATION
        // =========================

        if (issue.author.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        // =========================
        // DUPLICATE ISSUE CHECK
        // =========================

        const existingIssue = await Issue.findOne({
            repository: issue.repository,
            title,
            _id: { $ne: issueId },
        });

        if (existingIssue) {
            return res.status(400).json({ error: "Issue with this title already exists" });
        }

        // =========================
        // UPDATE ISSUE
        // =========================

        issue.title = title;
        issue.description = description;
        issue.status = status

        await issue.save();

        // =========================
        // RESPONSE
        // =========================

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
    createIssue:asyncHandler(createIssue),
    deleteIssueById:asyncHandler(deleteIssueById),
    getAllIssues:asyncHandler(getAllIssues),
    getIssueById:asyncHandler(getIssueById),
    deleteIssue:asyncHandler(deleteIssue),
    updateIssue:asyncHandler(updateIssue),
};