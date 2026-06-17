const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepositorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
    },
    latestCommit: {
        type: Schema.Types.ObjectId,
        ref: "Commit",
    },
    commits: [
        {
            type: Schema.Types.ObjectId,
            ref: "Commit",
        },
    ],
    visibility: {
        type: Boolean,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    issues: [
        {
            type: Schema.Types.ObjectId,
            ref: "Issue",
        },
    ],
    stars: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
}, { timestamps: true });

RepositorySchema.index(

    {
        owner: 1,
        name: 1,
    },

    {
        unique: true,
    }
);

const Repository = mongoose.model("Repository", RepositorySchema);
module.exports = Repository;