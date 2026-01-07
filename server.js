require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

// middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

// Task schema
const taskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});


// creating task
const Task = mongoose.model("Task", taskSchema);

// user schema
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

//hashing password
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});



// creating user 
const User = mongoose.model("User", userSchema);

// for authentication
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};


// basic route
app.get("/", (req, res) => {
    res.send("Backend is running");
});

// get all tasks
app.get("/tasks", authMiddleware, async (req, res) => {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
});


// add new task
app.post("/tasks", authMiddleware, async (req, res) => {
    const task = new Task({
        text: req.body.text,
        userId: req.userId
    });

    await task.save();
    res.json(task);
});


// update task (completed state)
app.patch("/tasks/:id", authMiddleware, async (req, res) => {
    const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { completed: req.body.completed },
        { new: true }
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
});


// delete task
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
    const task = await Task.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    res.sendStatus(204);
});


// creating user account 
app.post("/auth/signup", async (req, res) => {
    const { username, password } = req.body;

    // basic validation
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // create new user
    const user = new User({
        username,
        password
    });

    await user.save();

    res.status(201).json({
        message: "User created successfully"
    });
});


// start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// login for user 
app.post("/auth/login", async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        token,
        user: {
            id: user._id,
            username: user.username
        }
    });
});
