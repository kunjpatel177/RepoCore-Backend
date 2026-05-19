const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const Commit = require("../models/commitModel");
// const { s3, S3_BUCKET } = require("../config/aws-config");

async function createRepository(req, res) {

    let { owner, name, issues, content, description, visibility } = req.body;

    try {

        // REQUIRED VALIDATION

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Repository name is required",
            });
        }

        // REMOVE EXTRA SPACES + LOWERCASE

        name = name.trim().toLowerCase();

        // LENGTH VALIDATION

        if (name.length < 3) {
            return res.status(400).json({
                error: "Repository name must be at least 3 characters",
            });
        }

        if (name.length > 30) {
            return res.status(400).json({
                error: "Repository name cannot exceed 30 characters",
            });
        }

        // CHARACTER VALIDATION

        const repoNameRegex = /^[a-zA-Z0-9-_]+$/;

        if (!repoNameRegex.test(name)) {
            return res.status(400).json({
                error: "Repository name can only contain letters, numbers, hyphens and underscores",
            });
        }

        // RESERVED NAMES

        const reservedNames = [
            "admin", "api", "root", "system", "backend",
            "null", "undefined", "repocore", "support", "owner",
        ];

        if (reservedNames.includes(name)) {
            return res.status(400).json({
                error: "This repository name is reserved",
            });
        }

        // VALID OWNER ID

        if (!mongoose.Types.ObjectId.isValid(owner)) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        // DUPLICATE REPOSITORY CHECK

        const existingRepository = await Repository.findOne({ owner, name });

        if (existingRepository) {
            return res.status(400).json({
                error: "Repository with this name already exists",
            });
        }

        // DESCRIPTION LIMIT

        if (description && description.length > 300) {
            return res.status(400).json({
                error: "Description cannot exceed 300 characters",
            });
        }

        // VISIBILITY VALIDATION

        if (typeof visibility !== "boolean") visibility = true;

        // CREATE REPOSITORY

        const newRepository = new Repository({
            name,
            description,
            visibility,
            owner,
            content,
            issues,
        });

        const result = await newRepository.save();

        // UPDATE USER

        await User.findByIdAndUpdate(owner, {
            $push: {
                repositories: result._id,
            },
        });

        // SUCCESS RESPONSE

        res.status(201).json({
            success: true,
            message: "Repository created successfully",
            repositoryID: result._id,
        });

    } catch (err) {

        console.error("Repository creation error:", err.message);

        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
}

async function getAllRepositories(req, res) {
    try {
        const repositories = await Repository.find({})
            .populate("owner")
            .populate("issues");

        res.json(repositories);
    } catch (err) {
        console.error("Error during fetching repositories : ", err.message);
        res.status(500).send("Server error");
    }
}

async function fetchRepositoryById(req, res) {
    const { id } = req.params;
    try {
        // const repository = await Repository.findById(id)
        //     .populate("owner")
        //     .populate("issues");
        const repository = await Repository.findById(id)
            .populate("owner", "username")
            .populate("issues")
            .populate("latestCommit")
            .populate("commits");

        if (!repository) {
            return res.status(404).json({
                error: "Repository not found"
            });
        }

        res.json(repository);
    } catch (err) {
        console.error("Error during fetching repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function fetchRepositoryByName(req, res) {
    const { name } = req.params;
    try {
        const repository = await Repository.findOne({ name })
            .populate("owner")
            .populate("issues")
            .populate("latestCommit")
            .populate("commits");

        if (!repository)
            return res.status(404).json({ error: "Repository not found" });

        res.json(repository);
    } catch (err) {
        console.error("Error during fetching repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function fetchRepositoriesForCurrentUser(req, res) {
    console.log(req.params);
    const { userID } = req.params;

    try {
        const repositories =
            await Repository.find({
                owner: userID,
            })
                .populate("latestCommit")
                .populate("commits");

        if (!repositories) {
            return res.status(404).json({
                error: "Repositories fetch failed!",
            });
        }
        console.log(repositories);
        res.json({ message: "Repositories found!", repositories });
    } catch (err) {
        console.error("Error during fetching user repositories : ", err.message);
        res.status(500).send("Server error");
    }
}

async function updateRepositoryById(req, res) {
    const { id } = req.params;
    const { file, description } = req.body;

    try {
        const repository = await Repository.findById(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        repository.content.push(file);
        repository.description = description;

        const updatedRepository = await repository.save();

        res.json({
            message: "Repository updated successfully!",
            repository: updatedRepository,
        });
    } catch (err) {
        console.error("Error during updating repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function toggleVisibilityById(req, res) {
    const { id } = req.params;

    try {
        const repository = await Repository.findById(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        repository.visibility = !repository.visibility;

        const updatedRepository = await repository.save();

        res.json({
            message: "Repository visibility toggled successfully!",
            repository: updatedRepository,
        });
    } catch (err) {
        console.error("Error during toggling visibility : ", err.message);
        res.status(500).send("Server error");
    }
}

async function deleteRepositoryById(req, res) {
    const { id } = req.params;
    try {
        const repository = await Repository.findByIdAndDelete(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        res.json({ message: "Repository deleted successfully!" });
    } catch (err) {
        console.error("Error during deleting repository : ", err.message);
        res.status(500).send("Server error");
    }
}

async function toggleStarRepository(req, res) {
    const { id } = req.params;

    const userId = req.user.id;

    try {
        const repository =
            await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({
                error: "Repository not found",
            });
        }

        const alreadyStarred =
            repository.stars.includes(userId);

        if (alreadyStarred) {

            repository.stars =
                repository.stars.filter(
                    (star) =>
                        star.toString() !== userId
                );

            await User.findByIdAndUpdate(
                userId,
                {
                    $pull: {
                        starRepos: id,
                    },
                }
            );

        } else {

            repository.stars.push(userId);

            await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        starRepos: id,
                    },
                }
            );
        }

        await repository.save();

        res.json({
            message: alreadyStarred
                ? "Repository unstarred"
                : "Repository starred",

            stars: repository.stars.length,
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Server error",
        });
    }
}

const deleteRepository = async (req, res) => {
    try {
        const { s3, S3_BUCKET } = require("../config/aws-config");
        const { id } = req.params;
        const { repositoryName } = req.body;

        // FIND REPOSITORY
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({
                message: "Repository not found",
            });
        }

        // OWNER VALIDATION
        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized access",
            });
        }

        // CONFIRM REPOSITORY NAME
        if (repository.name !== repositoryName) {
            return res.status(400).json({
                message: "Repository name does not match",
            });
        }

        // FETCH COMMITS
        const commits = await Commit.find({
            repository: id,
        });

        // PREPARE S3 OBJECTS
        const objectsToDelete = [];

        for (const commit of commits) {
            for (const file of commit.files) {
                if (file.s3Key) {
                    objectsToDelete.push({
                        Key: file.s3Key,
                    });
                }
            }
        }

        // DELETE S3 FILES
        if (objectsToDelete.length > 0) {
            await s3.deleteObjects({
                Bucket: S3_BUCKET,
                Delete: {
                    Objects: objectsToDelete,
                },
            }).promise();
        }

        // DELETE COMMITS
        await Commit.deleteMany({
            repository: id,
        });

        // DELETE ISSUES
        await Issue.deleteMany({
            repository: id,
        });

        // DELETE REPOSITORY
        await Repository.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Repository deleted successfully",
        });

    } catch (err) {
        console.error("Delete repository error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to delete repository",
        });
    }
};

const searchRepositories = async (req, res) => {

    try {

        const query = req.query.q;

        if (!query) return res.json([]);

        const repositories = await Repository.find({
            visibility: true,
            name: { $regex: query, $options: "i" },
        })
            .populate("owner", "username")
            .limit(10);

        res.json(repositories);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to search repositories",
        });
    }
};

module.exports = { createRepository, getAllRepositories, fetchRepositoryById, fetchRepositoryByName, fetchRepositoriesForCurrentUser, updateRepositoryById, toggleVisibilityById, deleteRepositoryById, toggleStarRepository, deleteRepository, searchRepositories };