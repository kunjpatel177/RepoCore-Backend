const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: true,
        },

        // IMPORTANT

        filepath: {
            type: String,
            required: true,
        },

        s3Key: {
            type: String,
            required: true,
        },

        size: {
            type: Number,
            required: true,
        },
    },
    {
        _id: false,
    }
);

const commitSchema = new mongoose.Schema(
    {
        commitHash: {
            type: String,
            required: true,
            unique: true,
        },

        commitMessage: {
            type: String,
            required: true,
        },

        repository: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Repository",
            required: true,
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        files: [fileSchema],

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Commit",
    commitSchema
);