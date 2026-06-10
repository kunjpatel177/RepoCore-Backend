const mime = require("mime-types");
const asyncHandler = require("../utils/asyncHandler");
const Commit = require("../models/commitModel");

// VIEW FILE CONTENT
const getFileContent = async (req, res) => {
    try {
        const { s3, S3_BUCKET } = require("../config/aws-config");
        const { key } = req.query;

        // VALIDATION
        if (!key) {
            return res.status(400).json({ error: "File key required" });
        }

        // FETCH FILE
        const file = await s3.getObject({
            Bucket: S3_BUCKET,
            Key: key,
        }).promise();

        // SEND TEXT CONTENT
        res.status(200).json({
            content: file.Body.toString(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to fetch file content",
        });
    }
};

// DOWNLOAD FILE
const downloadFile = async (req, res) => {
    try {
        const { s3, S3_BUCKET } = require("../config/aws-config");
        const { key } = req.query;

        // VALIDATION
        if (!key) {
            return res.status(400).json({ error: "File key required" });
        }

        // FETCH FILE FROM S3
        const file = await s3.getObject({
            Bucket: S3_BUCKET,
            Key: key,
        }).promise();

        // MIME TYPE
        const contentType = mime.lookup(key) || "application/octet-stream";

        // RESPONSE HEADERS
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", file.ContentLength);

        // SEND FILE BUFFER
        res.status(200).send(file.Body);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to download file",
        });
    }
};

const getCommitFiles = async (req, res) => {
    const { commitId } = req.params;
    const commit = await Commit.findById(commitId);

    if (!commit) {
        return res.status(404).json({
            message: "Commit not found",
        });
    }

    res.status(200).json(commit.files);
};

module.exports = {
    getFileContent: asyncHandler(getFileContent),
    getCommitFiles: asyncHandler(getCommitFiles),
    downloadFile: asyncHandler(downloadFile),
};