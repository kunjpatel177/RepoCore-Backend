const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const User = require("../models/userModel");
const Commit = require("../models/commitModel");
const Issue = require("../models/issueModel");
const Repository = require("../models/repoModel");
const asyncHandler = require("../utils/asyncHandler");
const { validatePassword } = require("../utils/passwordValidator");

// SIGNUP

const signup = async (req, res) => {

    const { username, password, email } = req.body;

    if (!username || !email || !password)
        return res.status(400).json({ message: "All fields are required" });

    if (!validator.isEmail(email))
        return res.status(400).json({ message: "Invalid email format" });

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
        return res.status(400).json({
            success: false,
            message: passwordValidation.message,
        });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser)
        return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        username,
        email,
        password: hashedPassword,
    });

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "7d" }
    );

    res.status(201).json({
        success: true,
        token,
        userId: user._id,
        username,
    });
};

// LOGIN

const login = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });

    if (!user)
        return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "7d" }
    );

    res.status(200).json({
        success: true,
        token,
        userId: user._id,
        username: user.username,
    });
};

// GET ALL USERS

const getAllUsers = async (req, res) => {

    const users = await User.find({}).select("-password");

    res.status(200).json(users);
};

// GET USER PROFILE

const getUserProfile = async (req, res) => {

    const currentID = req.params.id;
    const loggedInUserId = req.user?.id;

    const user = await User.findById(currentID)
        .populate({
            path: "repositories",
            populate: { path: "latestCommit" },
        })
        .populate("followers followedUsers starRepos");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (loggedInUserId === currentID) {
        return res.status(200).json(user);
    }

    return res.status(200).json({
        ...user.toObject(),
        repositories: user.repositories.filter(repo => repo.visibility),
    });
};

// UPDATE PROFILE

const updateUserProfile = async (req, res) => {

    const currentID = req.params.id;
    const { email, password } = req.body;

    const user = await User.findById(currentID);

    if (!user)
        return res.status(404).json({ message: "User not found" });

    if (email && !validator.isEmail(email))
        return res.status(400).json({ message: "Invalid email format" });

    if (email) user.email = email;

    if (password) {

        const passwordValidation = validatePassword(password);

        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message,
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user,
    });
};

// DELETE PROFILE

const deleteUserProfile = async (req, res) => {

    const currentID = req.params.id;

    const user = await User.findById(currentID);

    if (!user)
        return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(currentID);

    res.status(200).json({
        success: true,
        message: "User profile deleted successfully",
    });
};

// FOLLOW / UNFOLLOW USER

const toggleFollowUser = async (req, res) => {

    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId)
        return res.status(400).json({ error: "You cannot follow yourself" });

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser)
        return res.status(404).json({ error: "User not found" });

    const alreadyFollowing = currentUser.followedUsers.includes(targetUserId);

    if (alreadyFollowing) {

        currentUser.followedUsers = currentUser.followedUsers.filter(
            id => id.toString() !== targetUserId
        );

        targetUser.followers = targetUser.followers.filter(
            id => id.toString() !== currentUserId
        );

    } else {

        currentUser.followedUsers.push(targetUserId);
        targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
        success: true,
        message: alreadyFollowing ? "User unfollowed" : "User followed",
        followers: targetUser.followers.length,
    });
};

// DELETE ACCOUNT

const deleteAccount = async (req, res) => {

    try {

        const userId = req.user.id;

        const repositories = await Repository.find({ owner: userId });

        for (const repo of repositories) {

            await Commit.deleteMany({ repository: repo._id });
            await Issue.deleteMany({ repository: repo._id });
            await Repository.findByIdAndDelete(repo._id);
        }

        await User.findByIdAndDelete(userId);

        res.json({ message: "Account deleted successfully" });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to delete account",
        });
    }
};

const searchUsers = async (req, res) => {

    try {

        const query = req.query.q;

        if (!query) return res.json([]);

        const users = await User.find({
            username: { $regex: query, $options: "i" },
        })
            .select("username email followers repositories")
            .limit(10);

        res.json(users);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to search users",
        });
    }
};

module.exports = {
    signup: asyncHandler(signup),
    login: asyncHandler(login),
    getAllUsers: asyncHandler(getAllUsers),
    getUserProfile: asyncHandler(getUserProfile),
    updateUserProfile: asyncHandler(updateUserProfile),
    deleteUserProfile: asyncHandler(deleteUserProfile),
    toggleFollowUser: asyncHandler(toggleFollowUser),
    deleteAccount: asyncHandler(deleteAccount),
    searchUsers: asyncHandler(searchUsers),
};