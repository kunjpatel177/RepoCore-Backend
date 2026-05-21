const fs = require("fs").promises;
const path = require("path");

// =========================
// CHECK .REPOCORE
// =========================

async function ensureInitialized() {

    const repoCorePath = path.join(process.cwd(), ".repocore");

    try {
        await fs.access(repoCorePath);
        return true;
    } catch {
        console.log("\nNot a RepoCore repository.");
        console.log("Run:");
        console.log("repocore init\n");
        return false;
    }
}

// =========================
// LOAD CONFIG
// =========================

async function loadConfig() {

    try {

        const configPath = path.join(
            process.cwd(),
            ".repocore",
            "config.json"
        );

        const config = JSON.parse(
            await fs.readFile(configPath, "utf-8")
        );

        return config;

    } catch {
        return null;
    }
}

// =========================
// LOAD AUTH
// =========================

async function loadAuth() {

    try {

        const authPath = path.join(
            process.cwd(),
            ".repocore",
            "auth.json"
        );

        const auth = JSON.parse(
            await fs.readFile(authPath, "utf-8")
        );

        return auth;

    } catch {
        return null;
    }
}

// =========================
// CHECK LOGIN
// =========================

async function ensureLoggedIn() {

    const auth = await loadAuth();

    if (!auth || !auth.userId) {
        console.log("\nYou are not logged in.");
        console.log("Run:");
        console.log("repocore login <email> <password>\n");
        return false;
    }

    return true;
}

// async function ensureLoggedIn() {

//     const config = await loadConfig();

//     if (!config || !config.userId) {
//         console.log("\nYou are not logged in.");
//         console.log("Run:");
//         console.log("repocore login <email> <password>\n");
//         return false;
//     }

//     return true;
// }

// =========================
// CHECK REMOTE
// =========================

async function ensureRemoteConfigured() {

    const config = await loadConfig();

    if (!config || !config.repositoryId) {
        console.log("\nNo remote repository configured.");
        console.log("Run:");
        console.log("repocore remote repocore://username/repository\n");
        return false;
    }

    return true;
}

// =========================
// CHECK COMMITS
// =========================

async function ensureCommitExists() {

    try {

        const commitsPath = path.join(
            process.cwd(),
            ".repocore",
            "commits"
        );

        const commits = await fs.readdir(commitsPath);

        if (commits.length === 0) {
            console.log("\nNo commits found.");
            console.log("Run:");
            console.log('repocore commit "message"\n');
            return false;
        }

        return true;

    } catch {
        console.log("\nNo commits found.");
        return false;
    }
}

// =========================
// CHECK STAGING
// =========================

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

async function ensureStagingNotEmpty() {

    try {

        const stagingPath = path.join(process.cwd(), ".repocore", "staging");

        await fs.access(stagingPath);

        const stagedFiles = await getAllFiles(stagingPath);

        if (stagedFiles.length === 0) {

            console.log("\nNo files staged.");
            console.log("Run:");
            console.log("repocore add .\n");

            return false;
        }

        return true;

    } catch {

        console.log("\nStaging area not found.");
        console.log("Run:");
        console.log("repocore add .\n");

        return false;
    }
}

module.exports = {
    ensureInitialized,
    ensureLoggedIn,
    ensureRemoteConfigured,
    ensureCommitExists,
    ensureStagingNotEmpty,
    loadConfig,
};