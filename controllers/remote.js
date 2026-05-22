const fs = require("fs").promises;

const path = require("path");

const axios = require("axios");
const API_URL = require("../config/api");

async function addRemote(remoteUrl) {

    try {

        // =========================
        // VALIDATE URL
        // =========================

        if (
            !remoteUrl ||
            !remoteUrl.startsWith("repocore://")
        ) {

            console.log(
                "\nInvalid remote URL."
            );

            console.log(
                "Example:"
            );

            console.log(
                "repocore://kunj/backend\n"
            );

            return;
        }

        // =========================
        // REMOVE PROTOCOL
        // =========================

        const cleanUrl =
            remoteUrl
                .replace("repocore://", "")
                .trim();

        // =========================
        // SPLIT OWNER/REPOSITORY
        // =========================

        const parts =
            cleanUrl.split("/");

        if (parts.length !== 2) {

            console.log(
                "\nInvalid remote format."
            );

            console.log(
                "Correct format:"
            );

            console.log(
                "repocore://username/repository\n"
            );

            return;
        }

        const username =
            parts[0]
                .trim()
                .toLowerCase();

        const repositoryName =
            parts[1]
                .trim()
                .toLowerCase();

        // =========================
        // REPOCORE PATHS
        // =========================

        const repoPath =
            path.resolve(
                process.cwd(),
                ".repocore"
            );

        const configPath =
            path.join(
                repoPath,
                "config.json"
            );

        const authPath =
            path.join(
                repoPath,
                "auth.json"
            );

        // =========================
        // CHECK REPOSITORY INITIALIZED
        // =========================

        try {

            await fs.access(
                repoPath
            );

        } catch {

            console.log(
                "\nNot a RepoCore repository."
            );

            console.log(
                "Run:"
            );

            console.log(
                "repocore init\n"
            );

            return;
        }

        // =========================
        // CHECK LOGIN
        // =========================

        let auth;

        try {

            auth = JSON.parse(
                await fs.readFile(
                    authPath,
                    "utf-8"
                )
            );

        } catch {

            console.log(
                "\nPlease login first."
            );

            console.log(
                "Run:"
            );

            console.log(
                "repocore login <email> <password>\n"
            );

            return;
        }

        // =========================
        // FETCH REPOSITORY
        // =========================

        const response =
            await axios.get(

                `${API_URL}/repo/${username}/${repositoryName}`,

                {
                    headers: {

                        Authorization:
                            `Bearer ${auth.token}`,
                    },
                }
            );

        const repository =
            response.data;

        // =========================
        // REPOSITORY EXISTS
        // =========================

        if (!repository) {

            console.log(
                "\nRepository not found."
            );

            return;
        }

        // =========================
        // OWNER VALIDATION
        // =========================

        const isOwner =

            repository.owner?._id?.toString()
            === auth.userId;

        // ONLY OWNER CAN CONNECT REMOTE

        if (!isOwner) {

            console.log(
                "\nYou do not have access to connect this repository.\n"
            );

            return;
        }

        // =========================
        // READ CONFIG
        // =========================

        const config =
            JSON.parse(
                await fs.readFile(
                    configPath,
                    "utf-8"
                )
            );

        // =========================
        // SAVE REMOTE CONFIG
        // =========================

        config.remote =
            remoteUrl;

        config.repositoryName =
            repository.name;

        config.repositoryOwner =
            username;

        config.repositoryId =
            repository._id;

        config.userId =
            auth.userId;

        // =========================
        // SAVE CONFIG
        // =========================

        await fs.writeFile(

            configPath,

            JSON.stringify(
                config,
                null,
                2
            )
        );

        // =========================
        // SUCCESS
        // =========================

        console.log(
            "\nRemote configured successfully!"
        );

        console.log(
            `Connected to ${username}/${repository.name}\n`
        );

    } catch (err) {

        // =========================
        // NOT FOUND
        // =========================

        if (
            err.response?.status === 404
        ) {

            console.log(
                "\nRepository not found.\n"
            );

            return;
        }

        // =========================
        // UNAUTHORIZED
        // =========================

        if (
            err.response?.status === 403
        ) {

            console.log(
                "\nAccess denied.\n"
            );

            return;
        }

        // =========================
        // OTHER ERRORS
        // =========================

        console.error(
            "\nRemote configuration failed:"
        );

        console.error(
            err.response?.data?.message ||
            err.message
        );
    }
}

module.exports = {
    addRemote,
};