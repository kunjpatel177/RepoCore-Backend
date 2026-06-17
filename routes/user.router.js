const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter, signupLimiter } = require("../middleware/rateLimitMiddleware");

const userRouter = express.Router();

userRouter.post("/signup", signupLimiter, userController.signup);
userRouter.post("/login", loginLimiter, userController.login);
userRouter.get("/userProfile/:id", authMiddleware, userController.getUserProfile);
userRouter.put("/updateProfile/:id", authMiddleware, userController.updateUserProfile);
userRouter.patch("/follow/:id", authMiddleware, userController.toggleFollowUser);
userRouter.delete("/deleteAccount", authMiddleware, userController.deleteAccount);
userRouter.get("/search/users", authMiddleware, userController.searchUsers);

module.exports = userRouter;