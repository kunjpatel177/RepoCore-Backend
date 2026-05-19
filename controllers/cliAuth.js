const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

async function cliLogin(email, password) {

    try {

        const response = await axios.post(
            "http://localhost:3002/login",
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