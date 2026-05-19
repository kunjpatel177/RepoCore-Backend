const fs = require("fs").promises;
const path = require("path");

const { ensureInitialized, loadConfig } = require("../utils/cliValidation");

async function showStatus() {

    try {

        // INITIALIZATION CHECK

        if (!await ensureInitialized()) return;

        // LOAD CONFIG

        const config = await loadConfig();

        // PATHS

        const repoCorePath = path.join(process.cwd(), ".repocore");
        const stagingPath = path.join(repoCorePath, "staging");
        const commitsPath = path.join(repoCorePath, "commits");

        // STAGED FILES

        let stagedFiles = [];

        try {
            stagedFiles = await fs.readdir(stagingPath);
        } catch {
            stagedFiles = [];
        }

        // COMMITS

        let commits = [];

        try {
            commits = await fs.readdir(commitsPath);
            commits.sort();
        } catch {
            commits = [];
        }

        const latestCommit = commits.length > 0
            ? commits[commits.length - 1]
            : null;

        // DISPLAY STATUS

        console.log("\n========== RepoCore Status ==========\n");

        console.log(`Repository: ${config.repositoryName || "Not linked"}`);
        console.log(`Remote: ${config.remote || "No remote configured"}`);
        console.log(`Logged In: ${config.userId ? "Yes" : "No"}`);
        console.log(`Repository Linked: ${config.repositoryId ? "Yes" : "No"}`);

        // LATEST COMMIT

        console.log("\nLatest Commit:");

        if (latestCommit) {
            console.log(latestCommit);
        } else {
            console.log("No commits found");
        }

        // STAGED FILES

        console.log("\nStaged Files:");

        if (stagedFiles.length > 0) {

            stagedFiles.forEach(file => {
                console.log(`- ${file}`);
            });

        } else {
            console.log("No staged files");
        }

        console.log("\n=====================================\n");

    } catch (err) {
        console.error("Status error:", err.message);
    }
}

module.exports = { showStatus };