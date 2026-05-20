const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

async function cloneRepo(remoteUrl) {

    try {

        // =========================
        // URL VALIDATION
        // =========================

        if (!remoteUrl.startsWith("repocore://")) {
            console.log("\nInvalid remote URL.");
            console.log("Example:");
            console.log("repocore://username/reponame\n");
            return;
        }

        // =========================
        // AWS CONFIG
        // =========================

        const { s3, S3_BUCKET } = require("../config/aws-config");

        // =========================
        // PARSE URL
        // =========================

        const cleanUrl = remoteUrl.replace("repocore://", "");
        const [username, repositoryName] = cleanUrl.split("/");

        if (!username || !repositoryName) {
            console.log("Invalid remote format.");
            return;
        }

        console.log("\nCloning repository...");

        // =========================
        // LOAD AUTH (OPTIONAL)
        // =========================

        let auth = null;

        try {

            const authPath = path.join(process.cwd(), ".repocore", "auth.json");
            const authData = await fs.readFile(authPath, "utf-8");

            auth = JSON.parse(authData);

        } catch {

            // NO LOGIN
            // PUBLIC REPOS STILL ALLOWED
        }

        // =========================
        // FETCH REPOSITORY
        // =========================

        const response = await axios.get(
            `http://localhost:3002/repo/${username}/${repositoryName}`,
            auth?.token ? {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            } : {}
        );

        const repository = response.data;

        // =========================
        // VALIDATE REPO
        // =========================

        if (!repository) {
            console.log("Repository not found!");
            return;
        }

        // =========================
        // CREATE PROJECT FOLDER
        // =========================

        const projectPath = path.join(process.cwd(), repository.name);

        await fs.mkdir(projectPath, { recursive: true });

        // =========================
        // CREATE .REPOCORE
        // =========================

        const repoCorePath = path.join(projectPath, ".repocore");

        await fs.mkdir(path.join(repoCorePath, "commits"), { recursive: true });
        await fs.mkdir(path.join(repoCorePath, "staging"), { recursive: true });

        // =========================
        // SAVE CONFIG
        // =========================

        const config = {
            remote: remoteUrl,
            repositoryName: repository.name,
            repositoryOwner: username,
            repositoryId: repository._id,
            bucket: S3_BUCKET,
        };

        await fs.writeFile(
            path.join(repoCorePath, "config.json"),
            JSON.stringify(config, null, 2)
        );

        console.log("Repository initialized");

        // =========================
        // EMPTY REPOSITORY
        // =========================

        if (!repository.latestCommit?._id) {
            console.log("Repository is empty");
            return;
        }

        // =========================
        // FETCH FILES
        // =========================

        const commitResponse = await axios.get(
            `http://localhost:3002/commit/${repository.latestCommit._id}/files`
        );

        const files = commitResponse.data;

        console.log("Downloading files...");

        // =========================
        // DOWNLOAD FILES
        // =========================

        for (const file of files) {

            const s3Object = await s3.getObject({
                Bucket: S3_BUCKET,
                Key: file.s3Key,
            }).promise();

            // PRESERVE FOLDER STRUCTURE

            const relativePath = file.filepath || file.filename;

            const localFilePath = path.join(projectPath, relativePath);

            // CREATE NESTED FOLDERS

            await fs.mkdir(path.dirname(localFilePath), {
                recursive: true,
            });

            // WRITE FILE

            await fs.writeFile(localFilePath, s3Object.Body);

            console.log(`Downloaded: ${relativePath}`);
        }

        // =========================
        // SUCCESS
        // =========================

        console.log("\nClone completed successfully!");

    } catch (err) {

        console.error(
            "Clone failed:",
            err.response?.data?.message || err.message
        );
    }
}

module.exports = { cloneRepo };