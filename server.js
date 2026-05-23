const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { Server } = require("socket.io");

const mainRouter = require("./routes/main.router");
const errorMiddleware = require("./middleware/errorMiddleware");

const { globalLimiter } = require("./middleware/rateLimitMiddleware");

const connectDB = require("./config/db");

// =========================
// ENV CONFIG
// =========================

dotenv.config({ path: path.join(__dirname, ".env") });

// =========================
// START SERVER
// =========================

async function startServer() {

    try {

        // =========================
        // EXPRESS APP
        // =========================

        const app = express();
        const port = process.env.PORT || 3000;

        // =========================
        // SECURITY
        // =========================

        app.use(helmet());
        app.set("trust proxy", 1);

        // =========================
        // LOGGING
        // =========================

        app.use(morgan("dev"));

        // =========================
        // BODY LIMIT
        // =========================

        app.use(express.json({ limit: "100mb" }));
        app.use(bodyParser.json({ limit: "100mb" }));

        // =========================
        // RATE LIMITER
        // =========================

        app.use(globalLimiter);

        // =========================
        // DATABASE
        // =========================

        await connectDB();

        // =========================
        // CORS
        // =========================

        const allowedOrigins = [
            "http://localhost:5173",
            process.env.FRONTEND_URL,
            "https://repocore-p0nu.onrender.com",
        ];

        app.use(cors({

            origin: function (origin, callback) {

                // ALLOW POSTMAN / CLI

                if (!origin) return callback(null, true);

                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },

            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true,
        }));

        // =========================
        // ROUTES
        // =========================

        app.use("/", mainRouter);

        // =========================
        // ERROR HANDLER
        // =========================

        app.use(errorMiddleware);

        // =========================
        // HTTP SERVER
        // =========================

        const httpServer = http.createServer(app);

        // =========================
        // SOCKET IO
        // =========================

        const io = new Server(httpServer, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST"],
            },
        });

        // =========================
        // SOCKET EVENTS
        // =========================

        io.on("connection", (socket) => {

            socket.on("joinRoom", (userID) => {
                socket.join(userID);
            });

        });

        // =========================
        // START SERVER
        // =========================

        httpServer.listen(port, () => {
            console.log(`Server running on PORT ${port}`);
        });

    } catch (err) {

        console.error("Server startup failed:", err.message);
    }
}

// =========================
// START APP
// =========================

startServer();