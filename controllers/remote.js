const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

async function addRemote(remoteUrl) {

    try {

        // Validate URL

        if (!remoteUrl.startsWith("repocore://")) {
            console.log("Invalid remote URL.");
            return;
        }

        // Remove protocol

        const cleanUrl = remoteUrl.replace("repocore://", "");

        // Split username/repository

        const [username, repositoryName] = cleanUrl.split("/");

        if (!username || !repositoryName) {
            console.log("Invalid remote format.");
            console.log("Example:");
            console.log("repocore://kunj/backend");
            return;
        }

        // RepoCore paths

        const repoPath = path.resolve(process.cwd(), ".repocore");
        const configPath = path.join(repoPath, "config.json");
        const authPath = path.join(repoPath, "auth.json");

        // Check login

        let auth;

        try {

            auth = JSON.parse(
                await fs.readFile(authPath, "utf-8")
            );

        } catch {

            console.log("Please login first.");
            return;
        }

        // Fetch repository

        const response = await axios.get(
            `http://localhost:3002/repo/name/${repositoryName}`
        );

        const repository = response.data;

        if (!repository) {
            console.log("Repository not found!");
            return;
        }

        // Read config

        const config = JSON.parse(
            await fs.readFile(configPath, "utf-8")
        );

        // Save remote info

        config.remote = remoteUrl;
        config.repositoryName = repository.name;
        config.repositoryOwner = username;
        config.repositoryId = repository._id;

        // Save logged-in user

        config.userId = auth.userId;

        // Save config

        await fs.writeFile(
            configPath,
            JSON.stringify(config, null, 2)
        );

        console.log("Remote configured successfully!");
        console.log(`Connected to ${repository.name}`);

    } catch (err) {

        console.error(
            "Error configuring remote:",
            err.response?.data || err.message
        );
    }
}

module.exports = { addRemote };