const Commit = require("../models/commitModel");
const Repository = require("../models/repoModel");
const asyncHandler = require("../utils/asyncHandler");
const sanitizeInput = require("../utils/sanitizeInput");

const getRepositoryCommits = async (req, res) => {

    const commits = await Commit.find({ repository: req.params.id })
        .populate("author", "username")
        .sort({ createdAt: -1 });


    res.status(200).json(commits);
};

const deleteCommit = async (req, res) => {

    try {
        const { s3, S3_BUCKET } =
            require("../config/aws-config");

        const commitId = req.params.id;

        // FIND COMMIT

        const commit = await Commit.findById(commitId);

        if (!commit) {
            return res.status(404).json({ error: "Commit not found" });
        }

        // FIND REPOSITORY

        const repository = await Repository.findById(commit.repository);

        if (!repository) {
            return res.status(404).json({ error: "Repository not found" });
        }

        // OWNER VALIDATION

        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        // DELETE S3 FILES

        const objectsToDelete = [];

        for (const file of commit.files) {
            if (file.s3Key) {
                objectsToDelete.push({ Key: file.s3Key });
            }
        }

        if (objectsToDelete.length > 0) {

            await s3.deleteObjects({
                Bucket: S3_BUCKET,
                Delete: { Objects: objectsToDelete },
            }).promise();
        }

        // DELETE COMMIT FROM REPO

        repository.commits = repository.commits.filter(
            id => id.toString() !== commitId
        );

        // UPDATE LATEST COMMIT

        const remainingCommits = await Commit.find({
            repository: repository._id,
            _id: { $ne: commitId },
        }).sort({ createdAt: -1 });

        repository.latestCommit =
            remainingCommits.length > 0 ? remainingCommits[0]._id : null;

        await repository.save();

        // DELETE COMMIT

        await Commit.findByIdAndDelete(commitId);

        // SUCCESS

        res.status(200).json({
            success: true,
            message: "Commit deleted successfully",
        });

    } catch (err) {

        console.error("Delete commit error:", err);

        res.status(500).json({ error: "Server error" });
    }
};

const pushCommit = async (req, res) => {

    try {
        const { s3, S3_BUCKET } =
            require("../config/aws-config");

        const { repositoryId, commitHash, commitMessage, files } = req.body;
        console.log(req.body);
        const author = req.user.id;
        // const author = "6a0ec1a4b81542a99d5fdd31";

        // VALIDATION

        if (!repositoryId) {
            return res.status(400).json({ error: "Repository ID required" });
        }

        if (!commitHash) {
            return res.status(400).json({ error: "Commit hash required" });
        }

        if (!commitMessage) {
            return res.status(400).json({ error: "Commit message required" });
        }

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ error: "Files required" });
        }

        // FETCH REPOSITORY

        const repository = await Repository.findById(repositoryId);

        if (!repository) {
            return res.status(404).json({ error: "Repository not found" });
        }

        // OWNER CHECK

        // if (repository.owner.toString() !== author) {
        //     return res.status(403).json({ error: "Access denied" });
        // }
        const ownerId =
            repository.owner._id
                ?
                repository.owner._id.toString()
                :
                repository.owner.toString();

        console.log("Repository owner:", repository.owner);
        console.log("Author:", author);

        if (ownerId !== author) {

            return res.status(403).json({
                error: "Access denied",
            });
        }

        // DUPLICATE COMMIT CHECK

        const existingCommit = await Commit.findOne({
            repository: repositoryId,
            commitHash,
        });

        if (existingCommit) {
            return res.status(400).json({ error: "Commit already exists" });
        }

        // UPLOAD FILES

        const uploadedFiles = [];

        for (const file of files) {

            const { filename, filepath, content, size } = file;

            // DECODE BASE64

            const buffer = Buffer.from(content, "base64");

            // S3 KEY

            const s3Key = `repositories/${repositoryId}/commits/${commitHash}/${filepath}`;

            // UPLOAD TO S3

            await s3.upload({
                Bucket: S3_BUCKET,
                Key: s3Key,
                Body: buffer,
            }).promise();

            // SAVE FILE INFO

            uploadedFiles.push({
                filename,
                filepath,
                s3Key,
                size,
            });

            console.log(`Uploaded: ${filepath}`);
        }

        // CREATE COMMIT

        const commit = new Commit({
            commitHash,
            commitMessage: sanitizeInput(commitMessage),
            repository: repositoryId,
            author,
            files: uploadedFiles,
        });

        await commit.save();

        // UPDATE REPOSITORY

        await Repository.findByIdAndUpdate(repositoryId, {
            $push: { commits: commit._id },
            $set: { latestCommit: commit._id },
        });

        // RESPONSE

        res.status(200).json({
            success: true,
            message: "Commit pushed successfully",
            commit,
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to push commit",
        });
    }
};

module.exports = {
    getRepositoryCommits: asyncHandler(getRepositoryCommits),
    deleteCommit: asyncHandler(deleteCommit),
    pushCommit: asyncHandler(pushCommit),
};