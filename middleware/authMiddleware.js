const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const verified = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.JWT_SECRET_KEY
        );

        console.log("verified = ",verified)

        req.user = verified;

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};

module.exports = authMiddleware;