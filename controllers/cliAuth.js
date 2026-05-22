const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const {ensureInitialized} = require("../utils/cliValidation");
const API_URL = require("../config/api");


async function cliLogin(email, password) {

    try {

        if (!await ensureInitialized()) return;
        const response = await axios.post(
            `${API_URL}/login`,
            { email, password }
        );

        const repoCorePath = path.join(process.cwd(), ".repocore");

        await fs.mkdir(repoCorePath, { recursive: true });

        const authPath = path.join(repoCorePath, "auth.json");

        await fs.writeFile(
            authPath,
            JSON.stringify({
                token: response.data.token,
                userId: response.data.userId,
            }, null, 2)
        );

        console.log("Logged in successfully!");
        console.log(`Auth saved at: ${authPath}`);

    } catch (err) {

        console.error(
            "Login failed:",
            err.response?.data || err.message
        );
    }
}

module.exports = { cliLogin };