const fs = require("fs").promises;
const path = require("path");

async function showRemote() {
    try {
        const configPath = path.join(
            process.cwd(),
            ".repocore",
            "config.json"
        );

        // Check config exists
        const exists = await fs
            .access(configPath)
            .then(() => true)
            .catch(() => false);

        if (!exists) {
            console.log("Not a RepoCore repository.");
            return;
        }

        // Read config
        const config = JSON.parse(
            await fs.readFile(configPath, "utf-8")
        );

        // Validate remote
        if (
            !config.repositoryName ||
            !config.repositoryOwner
        ) {
            console.log("No remote configured.");
            return;
        }

        // Build remote URL
        const remoteUrl =
            `repocore://${config.repositoryOwner}/${config.repositoryName}`;

        console.log("\nRemote Information\n");
        console.log(`Remote URL: ${remoteUrl}`);
        console.log(`Repository ID: ${config.repositoryId}`);
        console.log(`Connected User: ${config.userId}`);

    } catch (err) {
        console.error(
            "Error reading remote info:",
            err.message
        );
    }
}

module.exports = { showRemote };