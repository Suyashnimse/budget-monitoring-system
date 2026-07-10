const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const budgetRoutes = require("./routes/budgetRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const alertRoutes = require("./routes/alertRoutes");
const User = require("./models/User");
const Expense = require("./models/Expense");
const JWT_SECRET = process.env.JWT_SECRET || "budget-monitoring-secret";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/budget_monitoring";
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedExpenses();
  })
  .catch(err => console.log("MongoDB Error:", err));

async function seedExpenses() {
  try {
    const existingExpenses = await Expense.find();
    if (existingExpenses.length > 0) {
      return;
    }

    const sampleExpenses = [
      { budgetId: 'budget-finance', amount: 250000, category: 'Office Equipment', date: new Date('2026-07-01') },
      { budgetId: 'budget-health', amount: 180000, category: 'Medical Supplies', date: new Date('2026-07-02') },
      { budgetId: 'budget-public-works', amount: 420000, category: 'Road Maintenance', date: new Date('2026-07-03') },
      { budgetId: 'budget-education', amount: 90000, category: 'Training Program', date: new Date('2026-07-04') },
      { budgetId: 'budget-agriculture', amount: 150000, category: 'Farmer Subsidy', date: new Date('2026-07-05') }
    ];

    await Expense.insertMany(sampleExpenses);
    console.log('Seeded expense records');
  } catch (error) {
    console.log('Expense seeding error:', error.message);
  }
}

app.use(cors({
  origin: ['https://budget-monitoring-system.vercel.app', 'http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next(err);
});

app.get("/", (req, res) => {
  res.send("Budget Monitoring Backend Running");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password, role, departmentId });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

const frontendDistPath = path.join(__dirname, "..", "frontend", "dist", "frontend", "browser");
const frontendDistExists = fs.existsSync(frontendDistPath);
console.log("Frontend dist path:", frontendDistPath, "exists:", frontendDistExists);

app.use("/api/budget", budgetRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/auditlogs", auditLogRoutes);
app.use("/api", uploadRoutes);

if (frontendDistExists) {
  app.use(express.static(frontendDistPath));
}

app.get("*", (req, res, next) => {
  if (!frontendDistExists || req.method !== "GET") {
    return next();
  }

  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }

  if (req.accepts("html")) {
    return res.sendFile(path.join(frontendDistPath, "index.html"));
  }

  next();
});

app.listen(PORT, () => {
  console.log("Server Running on Port", PORT);
});
