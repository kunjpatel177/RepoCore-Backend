const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const userRouter = express.Router();

userRouter.get("/allUsers", userController.getAllUsers);
userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);
userRouter.get("/userProfile/:id", authMiddleware, userController.getUserProfile);
userRouter.put("/updateProfile/:id", authMiddleware, userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id", authMiddleware, userController.deleteUserProfile);
userRouter.patch("/follow/:id", authMiddleware, userController.toggleFollowUser);
userRouter.delete("/deleteAccount", authMiddleware, userController.deleteAccount);
userRouter.get("/search/users", userController.searchUsers);

module.exports = userRouter;