const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const mainRouter = require("./routes/main.router");
const yargs = require("yargs");
const path = require("path");

const { Server } = require("socket.io");
const { hideBin } = require("yargs/helpers");

const { showGuide } = require("./controllers/guide");
const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { addRemote } = require("./controllers/remote");
const { cliLogin } = require("./controllers/cliAuth");
const { showRemote } = require("./controllers/remoteInfo");
const { cloneRepo } = require("./controllers/clone");
const { showStatus } = require("./controllers/status");
const errorMiddleware = require("./middleware/errorMiddleware");
const { globalLimiter } = require("./middleware/rateLimitMiddleware");
const connectDB = require("./config/db");


dotenv.config({
    path: path.join(__dirname, ".env"),
});

yargs(hideBin(process.argv)).scriptName("repocore")
    .command("start", "Starts a new server", {}, startServer)
    .command("init", "Initialise a new repository", {}, initRepo)
    .command(
        "add <file>",
        "Add a file to the repository",
        (yargs) => {
            yargs.positional("file", {
                describe: "File to add to the staging area",
                type: "string",
            });
        },
        (argv) => {
            addRepo(argv.file);
        }
    )
    .command(
        "commit <message>",
        "Commit the staged files",
        (yargs) => {
            yargs.positional("message", {
                describe: "Commit message",
                type: "string",
            });
        },
        (argv) => {
            commitRepo(argv.message);
        }
    )
    .command("push", "Push commits to S3", {}, pushRepo)
    .command(
        "pull [commitHash]",
        "Pull latest or specific commit from S3",
        (yargs) => {
            yargs.positional("commitHash", {
                describe: "Optional commit hash to pull",
                type: "string",
            });
        },
        (argv) => {
            pullRepo(argv.commitHash);
        }
    )
    .command("remote <url>", "Configure remote repository", (yargs) => {
        yargs.positional("url", {
            describe: "Remote repository URL",
            type: "string",
        });
    }, (argv) => {
        addRemote(argv.url);
    })
    .command("login <email> <password>", "Login to RepoCore CLI", (yargs) => {
        yargs
            .positional("email", { type: "string" })
            .positional("password", { type: "string" });
    }, (argv) => {
        cliLogin(argv.email, argv.password);
    })
    .command(

        "remote-info",

        "Show remote repository information",

        () => { },

        async () => {

            await showRemote();
        }
    )
    .command("clone <url>", "Clone remote repository", yargs => {
        yargs.positional("url", {
            describe: "Repository URL",
            type: "string"
        });
    }, argv => cloneRepo(argv.url))
    .command("status", "Show repository status", {}, showStatus)
    .command("guide", "Show RepoCore workflow guide", {}, showGuide)
    .demandCommand(1, "You need at least one command")
    .help().argv;


async function startServer() {
    const API_URL = process.env.API_URL || "http://localhost:3002"
    const app = express();
    const port = process.env.PORT || 3000;
    app.use(helmet());
    app.set("trust proxy", 1);

    app.use(morgan("dev"));

    // app.use(rateLimit({
    //     windowMs: 15 * 60 * 1000,
    //     max: 100
    // }));

    app.use(bodyParser.json());
    app.use(express.json());
    app.use(globalLimiter);

    const mongoURI = process.env.MONGODB_URI;

    await connectDB()

    app.use(cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    }));

    // app.options("*", cors());

    app.use("/", mainRouter);
    app.use(errorMiddleware);

    let user = "test";
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        socket.on("joinRoom", (userID) => {
            user = userID;
            console.log("=====");
            console.log(user);
            console.log("=====");
            socket.join(userID);
        });
    });

    const db = mongoose.connection;

    db.once("open", async () => {
        console.log("CRUD operations called");
        // CRUD operations
    });

    httpServer.listen(port, () => {
        console.log(`Server is running on PORT ${port}`);
    });
}