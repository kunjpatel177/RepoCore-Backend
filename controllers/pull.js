const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { ensureInitialized, ensureRemoteConfigured, } = require("../utils/cliValidation");
const API_URL = require("../config/api");


// CLEAR CURRENT FILES

async function clearWorkingDirectory(workingDir) {
    const { s3, S3_BUCKET } = require("../config/aws-config");

    const items = await fs.readdir(workingDir, { withFileTypes: true });

    for (const item of items) {

        // SKIP INTERNALS

        if (
            item.name === ".repocore" ||
            item.name === "node_modules" ||
            item.name === ".git"
        ) continue;

        const fullPath = path.join(workingDir, item.name);

        if (item.isDirectory()) {
            await fs.rm(fullPath, {
                recursive: true,
                force: true,
            });
        } else {
            await fs.unlink(fullPath);
        }
    }
}

async function pullRepo(commitHash = null) {

    try {

        if (!await ensureInitialized()) return;

        if (!await ensureRemoteConfigured()) return;

        const { s3, S3_BUCKET } = require("../config/aws-config");
        const projectPath = process.cwd();
        const repoCorePath = path.join(projectPath, ".repocore");
        const configPath = path.join(repoCorePath, "config.json");

        // VALIDATE REPO

        const exists = await fs.access(configPath)
            .then(() => true)
            .catch(() => false);

        if (!exists) {
            console.log("Not a RepoCore repository!");
            return;
        }

        // READ CONFIG

        const config = JSON.parse(
            await fs.readFile(configPath, "utf-8")
        );

        const repositoryId = config.repositoryId;

        console.log("\nFetching repository...");

        // FETCH REPOSITORY

        const repoResponse = await axios.get(
            `${API_URL}/repo/${repositoryId}`
        );

        const repository = repoResponse.data;

        if (!repository) {
            console.log("Repository not found!");
            return;
        }

        // FETCH TARGET COMMIT

        let targetCommit;

        // PULL SPECIFIC COMMIT

        if (commitHash) {

            console.log(`Finding commit: ${commitHash}`);

            const commitsResponse = await axios.get(
                `${API_URL}/repo/${repositoryId}/commits`
            );

            const commits = commitsResponse.data;

            targetCommit = commits.find(commit =>
                commit.commitHash.startsWith(commitHash)
            );

            if (!targetCommit) {
                console.log("Commit not found!");
                return;
            }

        } else {

            // LATEST COMMIT

            targetCommit = repository.latestCommit;
        }

        if (!targetCommit) {
            console.log("No commits found.");
            return;
        }

        console.log(`Pulling commit:\n${targetCommit.commitHash}`);

        // FETCH FILES

        const filesResponse = await axios.get(
            `${API_URL}/commit/${targetCommit._id}/files`
        );

        const files = filesResponse.data;

        // CLEAN WORKING DIRECTORY

        console.log("\nCleaning working directory...");

        await clearWorkingDirectory(projectPath);

        // DOWNLOAD FILES

        console.log("\nDownloading files...");

        let current = 1;

        for (const file of files) {

            const s3Object = await s3.getObject({
                Bucket: S3_BUCKET,
                Key: file.s3Key,
            }).promise();

            // IMPORTANT

            const localFilePath = path.join(
                projectPath,
                file.filepath || file.filename
            );

            // CREATE FOLDERS

            await fs.mkdir(path.dirname(localFilePath), {
                recursive: true,
            });

            // WRITE FILE

            await fs.writeFile(localFilePath, s3Object.Body);

            console.log(
                `[${current}/${files.length}] Pulled ${file.filepath || file.filename
                }`
            );

            current++;
        }

        // SAVE LOCALLY

        const localCommitPath = path.join(
            repoCorePath,
            "commits",
            targetCommit.commitHash
        );

        await fs.mkdir(localCommitPath, { recursive: true });

        console.log("\nPull completed successfully!");

    } catch (err) {

        console.error("Pull failed:", err.message);
    }
}

module.exports = { pullRepo };