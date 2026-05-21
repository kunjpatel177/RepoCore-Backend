const rateLimit = require("express-rate-limit");

// =========================
// GLOBAL API LIMIT
// =========================

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =========================
// LOGIN LIMIT
// =========================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many login attempts. Try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =========================
// SIGNUP LIMIT
// =========================

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many signup attempts. Please try later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =========================
// REPOSITORY CREATION LIMIT
// =========================

const repositoryLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Repository creation limit exceeded.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =========================
// ISSUE CREATION LIMIT
// =========================

const issueLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: "Too many issues created.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    loginLimiter,
    signupLimiter,
    repositoryLimiter,
    issueLimiter,
};