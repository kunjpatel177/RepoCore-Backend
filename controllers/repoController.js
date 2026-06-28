const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const Commit = require("../models/commitModel");
const sanitizeInput = require("../utils/sanitizeInput");
const { repoValidator } = require("../utils/repoValidator")


async function createRepository(req, res) {
    try {
        let { owner, name, issues, content, description, visibility } = req.body;

        name = sanitizeInput(name);
        description = sanitizeInput(description).trim();

        const normalizedName = name?.trim()?.toLowerCase();

        const repoValidation = repoValidator(normalizedName, description);

        if (!repoValidation.valid) {
            return res.status(400).json({
                success: false,
                error: repoValidation.message,
            });
        }

        // VALID OWNER ID
        if (!mongoose.Types.ObjectId.isValid(owner)) {
            return res.status(400).json({
                error: "Invalid user ID",
            });
        }

        // CHECK DUPLICATE REPOSITORY
        const existingRepository = await Repository.findOne({
            owner,
            name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
        });

        if (existingRepository) {
            return res.status(400).json({
                success: false,
                message: "Repository with this name already exists",
            });
        }

        // VISIBILITY VALIDATION
        if (typeof visibility !== "boolean") {
            return res.status(400).json({
                error: "Visibility must be true or false",
            });
        }

        // CREATE REPOSITORY
        const newRepository = new Repository({
            name: normalizedName,
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
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Repository name already exists",
            });
        }

        console.error("Repository creation error:", err.message);
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
}

async function fetchRepositoryById(req, res) {
    try {
        const { id } = req.params;
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

async function fetchRepositoriesForCurrentUser(req, res) {
    try {
        const { userID } = req.params;
        const repositories = await Repository.find({ owner: userID })
            .populate("latestCommit")
            .populate("commits");

        if (!repositories) {
            return res.status(404).json({
                error: "Repositories fetch failed!",
            });
        }
        res.json({ message: "Repositories found!", repositories });
    } catch (err) {
        console.error("Error during fetching user repositories : ", err.message);
        res.status(500).send("Server error");
    }
}

async function updateRepositoryById(req, res) {
    try {
        const { id } = req.params;
        const { name, description, visibility } = req.body;

        const sanitizedName = sanitizeInput(name).trim().toLowerCase();
        const sanitizedDescription = sanitizeInput(description).trim();
        // FIND REPOSITORY
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        // OWNER VALIDATION
        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const repoValidation = repoValidator(sanitizedName, sanitizedDescription);

        if (!repoValidation.valid) {
            return res.status(400).json({
                success: false,
                error: repoValidation.message,
            });
        }

        // CHECK DUPLICATE
        const existingRepo = await Repository.findOne({
            owner: req.user.id,
            name: sanitizedName,
            _id: { $ne: id },
        });

        if (existingRepo) {
            return res.status(400).json({
                error: "Repository with this name already exists",
            });
        }

        repository.name = sanitizedName;
        repository.description = sanitizedDescription;

        // VISIBILITY VALIDATION
        if (typeof visibility !== "boolean") {
            return res.status(400).json({
                error: "Visibility must be true or false",
            });
        }
        repository.visibility = visibility;

        // SAVE
        const updatedRepository = await repository.save();

        res.json({
            success: true,
            message: "Repository updated successfully!",
            repository: updatedRepository,
        });
    } catch (err) {
        console.error("Error updating repository:", err.message);
        res.status(500).json({ error: "Server error" });
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
    
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({
                error: "Repository not found",
            });
        }

        const alreadyStarred = repository.stars.includes(userId);

        if (alreadyStarred) {
            repository.stars = repository.stars.filter((star) => star.toString() !== userId);

            await User.findByIdAndUpdate(userId, {
                $pull: { starRepos: id },
            });
        } else {
            repository.stars.push(userId);

            await User.findByIdAndUpdate(userId, {
                $push: { starRepos: id },
            });
        }

        await repository.save();

        res.json({
            message: alreadyStarred ? "Repository unstarred" : "Repository starred",
            stars: repository.stars.length,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Server error",
        });
    }
}

async function deleteRepository(req, res) {
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
        const commits = await Commit.find({ repository: id });

        // PREPARE S3 OBJECTS
        const objectsToDelete = [];

        for (const commit of commits) {
            for (const file of commit.files) {
                if (file.s3Key) {
                    objectsToDelete.push({ Key: file.s3Key });
                }
            }
        }

        // DELETE S3 FILES
        if (objectsToDelete.length > 0) {
            await s3.deleteObjects({
                Bucket: S3_BUCKET,
                Delete: { Objects: objectsToDelete },
            }).promise();
        }

        // DELETE COMMITS
        await Commit.deleteMany({ repository: id });

        // DELETE ISSUES
        await Issue.deleteMany({ repository: id });

        // DELETE REPOSITORY
        await Repository.findByIdAndDelete(id);

        await User.findByIdAndUpdate(repository.owner.toString(), {
            $pull: {repositories: id}
        })

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

async function searchRepositories(req, res) {
    try {
        const query = req.query.q;

        if (!query) return res.json([]);

        const repositories = await Repository.find({
            visibility: true,
            name: { $regex: query, $options: "i" },
        })
            .populate("owner", "username")
            .limit(6);

        res.json(repositories);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to search repositories",
        });
    }
};

module.exports = {
    createRepository,
    fetchRepositoryById,
    fetchRepositoriesForCurrentUser,
    updateRepositoryById,
    toggleVisibilityById,
    deleteRepositoryById,
    toggleStarRepository,
    deleteRepository,
    searchRepositories,
};