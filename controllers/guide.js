async function showGuide() {

    console.log("\n========== RepoCore CLI Guide ==========\n");

    // INITIALIZE

    console.log("1. Initialize Repository");
    console.log("repocore init\n");

    // LOGIN

    console.log("2. Login to RepoCore");
    console.log("repocore login <email> <password>\n");

    // CREATE REMOTE

    console.log("3. Connect Remote Repository");
    console.log("repocore remote repocore://username/repository\n");

    // ADD FILES

    console.log("4. Add Files");
    console.log("repocore add .");
    console.log("repocore add index.js\n");

    // COMMIT

    console.log("5. Commit Files");
    console.log('repocore commit "Initial commit"\n');

    // PUSH

    console.log("6. Push Repository");
    console.log("repocore push\n");

    // PULL

    console.log("7. Pull Latest Changes");
    console.log("repocore pull\n");

    // PULL SPECIFIC COMMIT

    console.log("8. Pull Specific Commit");
    console.log("repocore pull <commitHash>\n");

    // CLONE

    console.log("9. Clone Repository");
    console.log("repocore clone repocore://username/repository\n");

    // STATUS

    console.log("10. Repository Status");
    console.log("repocore status\n");

    // REMOTE INFO

    console.log("11. Show Remote Information");
    console.log("repocore remote-info\n");

    // IMPORTANT NOTES

    console.log("========== Important Notes ==========\n");

    console.log("- Commit hashes are immutable");
    console.log("- Private repositories are protected");
    console.log("- Use .repocoreignore to ignore files");
    console.log("- Maximum file size limits are enforced");
    console.log("- Repository names must be unique per user\n");

    console.log("======================================\n");
}

module.exports = { showGuide };