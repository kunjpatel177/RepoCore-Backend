const fs = require("fs").promises;
const path = require("path");

const connectDB = require("../config/db");

const Commit = require("../models/commitModel");
const Repository = require("../models/repoModel");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PUSH_SIZE = 50 * 1024 * 1024;

function formatBytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// GET ALL FILES RECURSIVELY

async function getAllFiles(dirPath) {
    const { s3, S3_BUCKET } = require("../config/aws-config");

    let files = [];

    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {

        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
            const nestedFiles = await getAllFiles(fullPath);
            files = [...files, ...nestedFiles];
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

async function pushRepo() {

    try {
        const { s3, S3_BUCKET } = require("../config/aws-config");

        // CONNECT DATABASE

        await connectDB();

        // PATHS

        const repoCorePath = path.join(process.cwd(), ".repocore");
        const configPath = path.join(repoCorePath, "config.json");

        // READ CONFIG

        const configRaw = await fs.readFile(configPath, "utf-8");
        const config = JSON.parse(configRaw);

        const repositoryId = config.repositoryId;
        const userId = config.userId;

        // VALIDATION

        if (!repositoryId || !userId) {
            console.log("Repository not linked.");
            return;
        }

        // INIT PUSH TRACKING

        if (!config.pushedCommits) {
            config.pushedCommits = [];
        }

        // FETCH REPOSITORY

        const repository = await Repository.findById(repositoryId);

        if (!repository) {
            console.log("Repository not found.");
            return;
        }

        // COMMITS DIRECTORY

        const commitsPath = path.join(repoCorePath, "commits");

        let commitFolders = await fs.readdir(commitsPath);

        if (commitFolders.length === 0) {
            console.log("No commits found.");
            return;
        }

        // SORT COMMITS

        commitFolders.sort();

        // FIND UNPUSHED COMMITS

        const unpushedCommits = commitFolders.filter(
            commitHash => !config.pushedCommits.includes(commitHash)
        );

        if (unpushedCommits.length === 0) {
            console.log("Everything up-to-date.");
            return;
        }

        let totalPushSize = 0;

        // PUSH EACH COMMIT

        for (const commitHash of unpushedCommits) {

            console.log(`\nPushing commit: ${commitHash}`);

            const commitPath = path.join(commitsPath, commitHash);

            // READ COMMIT INFO

            const commitInfoPath = path.join(commitPath, "commit.json");

            const commitInfo = JSON.parse(
                await fs.readFile(commitInfoPath, "utf-8")
            );

            // GET FILES

            const allFiles = await getAllFiles(commitPath);

            const uploadedFiles = [];
            // let totalPushSize = 0;

            // UPLOAD FILES

            for (const filePath of allFiles) {

                // SKIP INTERNAL FILE

                if (path.basename(filePath) === "commit.json") {
                    continue;
                }

                const fileContent = await fs.readFile(filePath);

                // RELATIVE PATH

                const relativePath = path.relative(commitPath, filePath);

                // WINDOWS FIX

                const normalizedPath = relativePath.replace(/\\/g, "/");

                if (normalizedPath.includes("node_modules")) {continue;}

                const fileSize = fileContent.length;

                // =========================
                // SINGLE FILE VALIDATION
                // =========================

                if (fileSize > MAX_FILE_SIZE) {
                    console.log(`Skipped: ${normalizedPath}`);
                    console.log(`Reason: File exceeds ${formatBytes(MAX_FILE_SIZE)}`);
                    continue;
                }

                // =========================
                // TOTAL PUSH VALIDATION
                // =========================

                totalPushSize += fileSize;

                if (totalPushSize > MAX_PUSH_SIZE) {
                    console.log("\nPush aborted!");
                    console.log(`Total repository size exceeded ${formatBytes(MAX_PUSH_SIZE)}`);
                    return;
                }


                // S3 PATH

                const s3Key = `repositories/${repositoryId}/commits/${commitHash}/${normalizedPath}`;

                // UPLOAD TO S3

                await s3.upload({
                    Bucket: S3_BUCKET,
                    Key: s3Key,
                    Body: fileContent,
                }).promise();

                // SAVE METADATA

                uploadedFiles.push({
                    filename: path.basename(filePath),
                    filepath: normalizedPath,
                    s3Key,
                    size: fileSize,
                });

                console.log(`Uploaded: ${normalizedPath}`);
            }

            // CREATE COMMIT DOCUMENT

            const commit = new Commit({
                commitHash,
                commitMessage: commitInfo.message,
                repository: repositoryId,
                author: userId,
                files: uploadedFiles,
            });

            await commit.save();

            // UPDATE REPOSITORY

            repository.commits.push(commit._id);
            repository.latestCommit = commit._id;

            // MARK AS PUSHED

            config.pushedCommits.push(commitHash);

            console.log(`Commit pushed: ${commitHash}`);
        }

        // SAVE UPDATED CONFIG

        await fs.writeFile(
            configPath,
            JSON.stringify(config, null, 2)
        );

        // SAVE REPOSITORY

        await repository.save();

        console.log(`Total uploaded size: ${formatBytes(totalPushSize)}`);

        console.log("\nRepository pushed successfully!");

    } catch (err) {

        console.error(
            "Error pushing repository:",
            err.message
        );
    }
}

module.exports = { pushRepo };