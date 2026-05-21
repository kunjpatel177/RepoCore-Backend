const fs = require("fs").promises, path = require("path"), ignore = require("ignore");

async function loadIgnoreRules(rootDir) {
    const ig = ignore();

    ig.add([".repocore", ".git", "node_modules"]);

    const ignorePath = path.join(rootDir, ".repocoreignore");

    try {
        const ignoreContent = await fs.readFile(ignorePath, "utf-8");

        ig.add(
            ignoreContent
                .split("\n")
                .map(rule => rule.trim())
                .filter(rule => rule && !rule.startsWith("#"))
        );
    } catch (err) { }

    return ig;
}

module.exports = { loadIgnoreRules };