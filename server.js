const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const mainRouter = require("./routes/main.router");
const errorMiddleware = require("./middleware/errorMiddleware");
const { globalLimiter } = require("./middleware/rateLimitMiddleware");
const connectDB = require("./config/db");

// ENV 
dotenv.config({ path: path.join(__dirname, ".env") });

// START 
async function startServer() {
    try {
        // EXPRESS APP
        const app = express();
        const port = process.env.PORT || 3000;

        // SECURITY
        app.use(helmet());
        app.set("trust proxy", 1);

        // LOGGING
        app.use(morgan("dev"));
        // app.use(morgan("combined"));

        // BODY LIMIT
        app.use(express.json({ limit: "100mb" }));
        app.use(bodyParser.json({ limit: "100mb" }));

        // RATE LIMITER
        app.use(globalLimiter);

        // DATABASE
        await connectDB();

        // CORS
        const allowedOrigins = [
            "https://repocore.vercel.app",
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

        // ROUTES
        app.use("/", mainRouter);

        // ERROR HANDLER
        app.use(errorMiddleware);
        
        app.listen(port, () => {
            console.log(`Server running on PORT ${port}`);
        });
    } catch (err) {
        console.error("Server startup failed:", err.message);
    }
}

// START 
startServer();