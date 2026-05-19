const fs = require("fs").promises;
const path = require("path");
const { loadIgnoreRules } = require("../utils/ignoreHandler");

async function getAllFiles(dirPath, rootDir, ig, arrayOfFiles = []) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(rootDir, fullPath);

        if (ig.ignores(relativePath)) {
            console.log(`Ignored: ${relativePath}`);
            continue;
        }

        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            arrayOfFiles = await getAllFiles(
                fullPath,
                rootDir,
                ig,
                arrayOfFiles
            );
        } else {
            arrayOfFiles.push(fullPath);
        }
    }

    return arrayOfFiles;
}

async function copyToStaging(filePath, rootDir, stagingPath) {
    const relativePath = path.relative(rootDir, filePath);
    const destination = path.join(stagingPath, relativePath);

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(filePath, destination);
}

async function addRepo(targetPath) {
    const rootDir = process.cwd();
    const ig = await loadIgnoreRules(rootDir);
    const repoPath = path.join(rootDir, ".repocore");
    const stagingPath = path.join(repoPath, "staging");

    try {
        await fs.mkdir(stagingPath, { recursive: true });

        let filesToAdd = [];

        if (targetPath === ".") {
            filesToAdd = await getAllFiles(rootDir, rootDir, ig);
        } else {
            const fullPath = path.resolve(targetPath);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                filesToAdd = await getAllFiles(fullPath, rootDir, ig);
            } else {
                filesToAdd.push(fullPath);
            }
        }

        for (const file of filesToAdd) {
            await copyToStaging(file, rootDir, stagingPath);

            console.log(`Added: ${path.relative(rootDir, file)}`);
        }

        console.log("\nFiles staged successfully!");
    } catch (err) {
        console.error("Error adding files:", err.message);
    }
}

module.exports = { addRepo };