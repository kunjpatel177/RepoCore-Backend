const asyncHandler = require("../utils/asyncHandler");
const Commit = require("../models/commitModel");

// const { s3, S3_BUCKET } = require("../config/aws-config");

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

const getFileContent = async (req, res) => {

    const { s3, S3_BUCKET } = require("../config/aws-config");
    const { key } = req.query;

    if (!key) {
        return res.status(400).json({
            message: "S3 key is required",
        });
    }

    const data = await s3.getObject({
        Bucket: S3_BUCKET,
        Key: key,
    }).promise();

    res.status(200).json({
        content: data.Body.toString("utf-8"),
    });
};

const getRawFile = async (req, res) => {

    const { s3, S3_BUCKET } = require("../config/aws-config");
    const { key } = req.query;

    const data = await s3.getObject({
        Bucket: S3_BUCKET,
        Key: key,
    }).promise();

    res.setHeader("Content-Type", "text/plain");

    res.send(data.Body);
};

module.exports = {
    getCommitFiles: asyncHandler(getCommitFiles),
    getFileContent: asyncHandler(getFileContent),
    getRawFile: asyncHandler(getRawFile),
};