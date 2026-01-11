require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://task-tracker.vercel.app" // <-- update if name differs
    ],
    credentials: true
  })
);

/* =======================
   DATABASE
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

/* =======================
   MODELS
======================= */
const taskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

const Task = mongoose.model("Task", taskSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model("User", userSchema);

/* =======================
   AUTH MIDDLEWARE
======================= */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* =======================
   ROUTES
======================= */
app.get("/", (_, res) => res.send("Backend is running"));

app.get("/tasks", authMiddleware, async (req, res) => {
  res.json(await Task.find({ userId: req.userId }));
});

app.post("/tasks", authMiddleware, async (req, res) => {
  const task = await Task.create({
    text: req.body.text,
    userId: req.userId
  });
  res.status(201).json(task);
});

app.patch("/tasks/:id", authMiddleware, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { completed: req.body.completed },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.sendStatus(204);
});

/* =======================
   AUTH ROUTES
======================= */
app.post("/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  if (await User.findOne({ username }))
    return res.status(400).json({ message: "User already exists" });

  await new User({ username, password }).save();
  res.status(201).json({ message: "User created successfully" });
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: { id: user._id, username: user.username }
  });
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
