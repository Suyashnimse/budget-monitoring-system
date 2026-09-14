const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const app = express();
const budgetRoutes = require("./routes/budgetRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const alertRoutes = require("./routes/alertRoutes");
const approvalAuthorityRoutes = require("./routes/approvalAuthorityRoutes");
const governmentExpenditureRoutes = require("./routes/governmentExpenditureRoutes");
const otpRoutes = require("./routes/otpRoutes");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/User");
const ApprovalAuthority = require("./models/ApprovalAuthority");
const Expense = require("./models/Expense");
const OtpChallenge = require("./models/OtpChallenge");
const JWT_SECRET = process.env.JWT_SECRET || "budget-monitoring-secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/budget_monitoring";
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedExpenses();
    seedAdminUser();
    seedMaharashtraAuthorities();
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

async function seedAdminUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      return;
    }

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'Admin',
      departmentId: ''
    });

    await adminUser.save();
    console.log('Seeded default admin user: admin@test.com / admin123');
  } catch (error) {
    console.log('Admin seeding error:', error.message);
  }
}

async function seedMaharashtraAuthorities() {
  const authorities = [
    ['Devendra Fadnavis', 'CM', 'Nagpur South-West', '175', 'Home, General Administration, Energy, Law & Judiciary, Water Resources'],
    ['Eknath Shinde', 'DCM', 'Kopri-Pachpakhadi', '148', 'Urban Development, Transport'],
    ['Sunetra Ajit Pawar', 'DCM', 'Baramati', '', 'Finance, Planning'],
    ['Chandrasekhar Bawankule', 'Minister', 'Kamthi', '', 'Revenue'],
    ['Chhagan Bhujbal', 'Minister', 'Yeola', '', 'Food & Civil Supplies'],
    ['Radhakrishna Vikhe Patil', 'Minister', 'Shirdi', '', 'Revenue, Animal Husbandry & Dairy Development'],
    ['Hasan Mushrif', 'Minister', 'Kagal', '', 'Medical Education'],
    ['Chandrakant Dada Patil', 'Minister', 'Kothrud', '', 'Higher & Technical Education, Textiles'],
    ['Girish Mahajan', 'Minister', 'Jamner', '', 'Rural Development, Panchayati Raj'],
    ['Ganesh Naik', 'Minister', 'Airoli', '', 'Forest'],
    ['Gulabrao Patil', 'Minister', 'Jalgaon Rural', '', 'Water Supply & Sanitation'],
    ['Dadaji Bhuse', 'Minister', 'Malegaon Outer', '', 'School Education'],
    ['Sanjay Rathod', 'Minister', 'Digras', '', 'Soil & Water Conservation'],
    ['Mangal Prabhat Lodha', 'Minister', 'Malabar Hill', '', 'Skill Development, Tourism'],
    ['Uday Samant', 'Minister', 'Ratnagiri', '', 'Industries'],
    ['Jaykumar Rawal', 'Minister', 'Shahada', '', 'Marketing'],
    ['Pankaja Munde', 'Minister', 'Parli', '', 'Environment, Animal Husbandry'],
    ['Atul Save', 'Minister', 'Aurangabad East', '', 'Housing'],
    ['Sanjay Savkare', 'Minister', 'Bhusawal', '', 'Textiles'],
    ['Sanjay Shirsat', 'Minister', 'Aurangabad West', '', 'Social Justice'],
    ['Pratap Sarnaik', 'Minister', 'Mira-Bhayandar', '', 'Transport'],
    ['Bharat Gogawale', 'Minister', 'Mahad', '', 'Employment Guarantee Scheme, Horticulture'],
    ['Makarand Jadhav Patil', 'Minister', 'Wai', '', 'Relief & Rehabilitation'],
    ['Nitesh Rane', 'Minister', 'Kankavli', '', 'Fisheries'],
    ['Akash Fundkar', 'Minister', 'Khamgaon', '', 'Labour'],
    ['Ashish Jaiswal', 'Minister of State', 'Ramtek', '', 'Finance']
  ];

  try {
    for (const [name, role, constituency, constituencyNumber, ministry] of authorities) {
      await ApprovalAuthority.updateOne(
        { name, role, state: 'Maharashtra' },
        { $setOnInsert: {
          authorityId: `${role.replace(/\s+/g, '-').toUpperCase()}-MH-${name.replace(/[^A-Z]/gi, '').slice(0, 5).toUpperCase()}`,
          name, role, constituency, constituencyNumber, state: 'Maharashtra', ministry,
          source: 'User-provided list; verify against official records', sourceUrl: ''
        } },
        { upsert: true }
      );
    }
    console.log('Seeded Maharashtra approval authority records');
  } catch (error) {
    console.log('Authority seeding error:', error.message);
  }
}

const allowedOrigins = [
  'https://budget-monitoring-system.vercel.app',
  'https://budget-monitoring-system-budget-monitoring-system.vercel.app',
  'http://localhost:4200',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS policy violation.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
    const { name, email, password, role, departmentId, mobile, otpChallengeId } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "Name, email, mobile, and password are required" });
    }

    if (!otpChallengeId) {
      return res.status(400).json({ message: "Verify your email and mobile number before registering" });
    }

    const challenge = await OtpChallenge.findById(otpChallengeId);
    if (!challenge || challenge.expiresAt < new Date() || !challenge.emailVerified || !challenge.mobileVerified || challenge.email !== email || challenge.mobile !== mobile) {
      return res.status(400).json({ message: "Verify your email and mobile number before registering" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password, role, departmentId });
    await user.save();
    await OtpChallenge.deleteOne({ _id: challenge._id });

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

app.post("/auth/google", async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google login is not configured" });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ message: "Google account could not be verified" });
    }

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email }]
    });

    if (!user) {
      user = new User({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        googleId: payload.sub,
        password: crypto.randomBytes(32).toString("hex")
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
    }

    if (payload.name && user.name !== payload.name) {
      user.name = payload.name;
    }
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(401).json({ message: "Google login failed" });
  }
});

const frontendDistCandidates = [
  path.join(__dirname, "..", "frontend", "dist", "frontend", "browser"),
  path.join(__dirname, "..", "frontend", "dist", "frontend")
];
const frontendDistPath = frontendDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));
const frontendDistExists = Boolean(frontendDistPath);
console.log("Frontend dist path:", frontendDistPath || "not found", "exists:", frontendDistExists);

app.use("/api/budget", budgetRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/approval-authorities", approvalAuthorityRoutes);
app.use("/api/government-expenditure", governmentExpenditureRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auditlogs", auditLogRoutes);
app.use("/api/users", userRoutes);
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
