const Commit = require("../models/commitModel");
const Repository = require("../models/repoModel");
const asyncHandler = require("../utils/asyncHandler");

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

        // =========================
        // FIND COMMIT
        // =========================

        const commit = await Commit.findById(commitId);

        if (!commit) {
            return res.status(404).json({ error: "Commit not found" });
        }

        // =========================
        // FIND REPOSITORY
        // =========================

        const repository = await Repository.findById(commit.repository);

        if (!repository) {
            return res.status(404).json({ error: "Repository not found" });
        }

        // =========================
        // OWNER VALIDATION
        // =========================

        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        // =========================
        // DELETE S3 FILES
        // =========================

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

        // =========================
        // DELETE COMMIT FROM REPO
        // =========================

        repository.commits = repository.commits.filter(
            id => id.toString() !== commitId
        );

        // =========================
        // UPDATE LATEST COMMIT
        // =========================

        const remainingCommits = await Commit.find({
            repository: repository._id,
            _id: { $ne: commitId },
        }).sort({ createdAt: -1 });

        repository.latestCommit =
            remainingCommits.length > 0 ? remainingCommits[0]._id : null;

        await repository.save();

        // =========================
        // DELETE COMMIT
        // =========================

        await Commit.findByIdAndDelete(commitId);

        // =========================
        // SUCCESS
        // =========================

        res.status(200).json({
            success: true,
            message: "Commit deleted successfully",
        });

    } catch (err) {

        console.error("Delete commit error:", err);

        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getRepositoryCommits: asyncHandler(getRepositoryCommits),
    deleteCommit: asyncHandler(deleteCommit),
};