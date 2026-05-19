const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { ensureInitialized, ensureStagingNotEmpty, } = require("../utils/cliValidation");

async function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    }

    return arrayOfFiles;
}

async function commitRepo(message) {
    const repoPath = path.join(process.cwd(), ".repocore");
    const stagingPath = path.join(repoPath, "staging");
    const commitsPath = path.join(repoPath, "commits");
    
    try {
        if (!await ensureInitialized()) return;
        if (!await ensureStagingNotEmpty()) return;
        if (!message) {
            console.log("Commit message required!");
            return;
        }

        const stagedFiles = await getAllFiles(stagingPath);

        if (stagedFiles.length === 0) {
            console.log("No files staged for commit.");
            return;
        }

        const commitId = uuidv4();
        const commitDir = path.join(commitsPath, commitId);

        await fs.mkdir(commitDir, { recursive: true });

        for (const file of stagedFiles) {
            const relativePath = path.relative(stagingPath, file);
            const destination = path.join(commitDir, relativePath);

            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.copyFile(file, destination);
        }

        await fs.writeFile(
            path.join(commitDir, "commit.json"),
            JSON.stringify({
                message,
                commitId,
                createdAt: new Date().toISOString(),
            }, null, 2)
        );

        await fs.rm(stagingPath, { recursive: true, force: true });
        await fs.mkdir(stagingPath, { recursive: true });

        console.log("\nCommit created successfully!");
        console.log(`Commit ID: ${commitId}`);
        console.log(`Message: ${message}`);
    } catch (err) {
        console.error("Commit failed:", err.message);
    }
}

module.exports = { commitRepo };