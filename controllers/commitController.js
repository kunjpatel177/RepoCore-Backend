const Commit = require("../models/commitModel");
const Repository = require("../models/repoModel");
const asyncHandler = require("../utils/asyncHandler");

const getRepositoryCommits = async (req, res) => {

    const commits = await Commit.find({ repository: req.params.id })
        .populate("author", "username")
        .sort({ createdAt: -1 });

    res.status(200).json(commits);
};

module.exports = {
    getRepositoryCommits: asyncHandler(getRepositoryCommits),
};