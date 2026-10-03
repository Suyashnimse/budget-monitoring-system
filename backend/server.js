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
const governmentExpenditureRoutes = require("./routes/governmentExpenditureRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const alertRoutes = require("./routes/alertRoutes");
const approvalAuthorityRoutes = require("./routes/approvalAuthorityRoutes");
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const User = require("./models/User");
const OtpChallenge = require("./models/OtpChallenge");
const ApprovalAuthority = require("./models/ApprovalAuthority");
const Expense = require("./models/Expense");
const Department = require("./models/Department");
const GovernmentExpenditure = require("./models/GovernmentExpenditure");
const governmentDepartments = require("./config/governmentDepartments");
const JWT_SECRET = process.env.JWT_SECRET || "budget-monitoring-secret";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/budget_monitoring";
const PORT = Number(process.env.PORT) || 3000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    GovernmentExpenditure.syncIndexes().catch(error => console.log('Expenditure index sync error:', error.message));
    seedExpenses();
    seedAdminUser();
    seedMaharashtraAuthorities();
    seedGovernmentDepartments();
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
      departmentId: '',
      mobile: '0000000000'
    });

    await adminUser.save();
    console.log('Seeded default admin user: admin@test.com / admin123');
  } catch (error) {
    console.log('Admin seeding error:', error.message);
  }
}

async function seedGovernmentDepartments() {
  try {
    await Department.bulkWrite(governmentDepartments.map((department) => ({
      updateOne: {
        filter: { code: department.code },
        update: { $setOnInsert: department },
        upsert: true
      }
    })), { ordered: false });
    console.log(`Seeded ${governmentDepartments.length} official government departments`);
  } catch (error) {
    console.log('Government department seeding error:', error.message);
  }
}

async function seedMaharashtraAuthorities() {
  const authorities = [
    ['Devendra Fadnavis', 'CM', 'Nagpur South West', '52', 'BJP', 'Chief Minister; Home; Finance & Planning; General Administration; Law & Judiciary and other CM-held portfolios'],
    ['Eknath Shinde', 'DCM', 'Kopri-Pachpakhadi', '147', 'Shiv Sena', 'Deputy Chief Minister; Urban Development'],
    ['Sunetra Pawar', 'DCM', 'Baramati', '201', 'NCP', 'Deputy Chief Minister; Excise; Sports & Youth Welfare; Minority Development & Wakf', ['Sunetra Ajit Pawar']],
    ['Chandrashekhar Bawankule', 'Minister', 'Kamthi', '58', 'BJP', 'Revenue', ['Chandrasekhar Bawankule']],
    ['Chhagan Bhujbal', 'Minister', 'Yeola', '119', 'NCP', 'Food, Civil Supplies & Consumer Protection'],
    ['Radhakrishna Vikhe Patil', 'Minister', 'Shirdi', '218', 'BJP', 'Water Resources'],
    ['Hasan Mushrif', 'Minister', 'Kagal', '273', 'NCP', 'Medical Education'],
    ['Chandrakant Patil', 'Minister', 'Kothrud', '210', 'BJP', 'Higher & Technical Education; Parliamentary Affairs', ['Chandrakant Dada Patil']],
    ['Girish Mahajan', 'Minister', 'Jamner', '19', 'BJP', 'Water Resources; Disaster Management'],
    ['Ganesh Naik', 'Minister', 'Airoli', '150', 'BJP', 'Forests'],
    ['Gulabrao Patil', 'Minister', 'Jalgaon Rural', '14', 'Shiv Sena', 'Water Supply & Sanitation'],
    ['Dada Bhuse', 'Minister', 'Malegaon Outer', '115', 'Shiv Sena', 'School Education', ['Dadaji Bhuse']],
    ['Sanjay Rathod', 'Minister', 'Digras', '79', 'Shiv Sena', 'Soil & Water Conservation'],
    ['Mangal Prabhat Lodha', 'Minister', 'Malabar Hill', '185', 'BJP', 'Skill Development, Employment, Entrepreneurship & Innovation'],
    ['Uday Samant', 'Minister', 'Ratnagiri', '266', 'Shiv Sena', 'Industries; Marathi Language'],
    ['Jaykumar Rawal', 'Minister', 'Sindkheda', '8', 'BJP', 'Marketing; Protocol'],
    ['Pankaja Munde', 'Minister', 'Legislative Council', '', 'BJP', 'Environment & Climate Change; Animal Husbandry'],
    ['Atul Save', 'Minister', 'Aurangabad East', '109', 'BJP', 'OBC Welfare; Dairy Development; Renewable Energy'],
    ['Ashok Uike', 'Minister', 'Ralegaon', '77', 'BJP', 'Tribal Development'],
    ['Shambhuraj Desai', 'Minister', 'Patan', '261', 'Shiv Sena', 'Tourism; Mining; Ex-Servicemen Welfare'],
    ['Ashish Shelar', 'Minister', 'Vandre West', '177', 'BJP', 'Information Technology; Cultural Affairs'],
    ['Dattatray Bharne', 'Minister', 'Indapur', '200', 'NCP', 'Agriculture'],
    ['Aditi Tatkare', 'Minister', 'Shrivardhan', '193', 'NCP', 'Women & Child Development'],
    ['Shivendrasinh Bhosale', 'Minister', 'Satara', '262', 'BJP', 'Public Works'],
    ['Jaykumar Gore', 'Minister', 'Man', '258', 'BJP', 'Rural Development; Panchayati Raj'],
    ['Narhari Zirwal', 'Minister', 'Dindori', '122', 'NCP', 'Food & Drug Administration; Special Assistance'],
    ['Sanjay Savkare', 'Minister', 'Bhusawal', '12', 'BJP', 'Textiles'],
    ['Sanjay Shirsat', 'Minister', 'Aurangabad West', '108', 'Shiv Sena', 'Social Justice'],
    ['Pratap Sarnaik', 'Minister', 'Ovala-Majiwada', '146', 'Shiv Sena', 'Transport'],
    ['Bharat Gogawale', 'Minister', 'Mahad', '194', 'Shiv Sena', 'Employment Guarantee; Horticulture; Salt Pan Land Development'],
    ['Makarand Jadhav-Patil', 'Minister', 'Wai', '256', 'NCP', 'Relief & Rehabilitation', ['Makarand Jadhav Patil']],
    ['Nitesh Rane', 'Minister', 'Kankavli', '268', 'BJP', 'Fisheries; Ports'],
    ['Aakash Fundkar', 'Minister', 'Khamgaon', '26', 'BJP', 'Labour', ['Akash Fundkar']],
    ['Babasaheb Patil', 'Minister', 'Ahmadpur', '236', 'NCP', 'Cooperation'],
    ['Prakash Abitkar', 'Minister', 'Radhanagari', '272', 'Shiv Sena', 'Public Health & Family Welfare'],
    ['Ashish Jaiswal', 'Minister of State', 'Ramtek', '59', 'Shiv Sena', 'Finance & Planning; Agriculture; Relief & Rehabilitation; Law & Judiciary; Labour'],
    ['Madhuri Misal', 'Minister of State', 'Legislative Council', '', 'BJP', 'Urban Development; Transport; Social Justice; Medical Education; Minority Development'],
    ['Pankaj Bhoyar', 'Minister of State', 'Wardha', '47', 'BJP', 'Home (Rural); Housing; School Education; Cooperation; Mining'],
    ['Meghna Bordikar', 'Minister of State', 'Jintur', '95', 'BJP', 'Public Health; Water Supply; Energy; Women & Child Development; Public Works'],
    ['Indranil Naik', 'Minister of State', 'Pusad', '81', 'NCP', 'Industries; Public Works; Higher & Technical Education; Tribal Development; Tourism; Soil & Water Conservation'],
    ['Yogesh Kadam', 'Minister of State', 'Dapoli', '263', 'Shiv Sena', 'Home (Urban); Revenue; Rural Development; Food & Civil Supplies; Food & Drug Administration']
  ];

  try {
    for (const [name, role, constituency, constituencyNumber, party, ministry, aliases = []] of authorities) {
      const authorityId = `${role.replace(/\s+/g, '-').toUpperCase()}-MH-${name.replace(/[^A-Z0-9]+/gi, '-').replace(/^-|-$/g, '').toUpperCase()}`;
      await ApprovalAuthority.updateOne(
        { name: { $in: [name, ...aliases] }, state: 'Maharashtra' },
        { $set: {
          authorityId, name, role, constituency, constituencyNumber, state: 'Maharashtra', party, ministry,
          source: 'User-provided list; not independently verified', sourceUrl: '', active: true
        } },
        { upsert: true }
      );
    }
    console.log('Seeded Maharashtra approval authority records');
  } catch (error) {
    console.log('Authority seeding error:', error.message);
  }
}

const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = [
  'https://budget-monitoring-system.vercel.app',
  'https://budget-monitoring-system-budget-monitoring-system.vercel.app',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:4200',
  'http://localhost:3000',
  ...configuredOrigins
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

app.get("/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected'
  });
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, departmentId, mobile, otpChallengeId } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedMobile = String(mobile || '').replace(/[\s()-]/g, '');

    if (!name || !normalizedEmail || !normalizedMobile || !password) {
      return res.status(400).json({ message: "Name, email, mobile, and password are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(otpChallengeId)) {
      return res.status(400).json({ message: "Verify your email and mobile number before registering" });
    }

    const challenge = await OtpChallenge.findOne({
      _id: otpChallengeId,
      purpose: 'registration',
      email: normalizedEmail,
      mobile: normalizedMobile,
      emailVerified: true,
      mobileVerified: true,
      expiresAt: { $gt: new Date() }
    });
    if (!challenge) {
      return res.status(400).json({ message: "Verify your email and mobile number before registering" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email: normalizedEmail, password, role, departmentId, mobile: normalizedMobile });
    await user.save();
    await OtpChallenge.deleteOne({ _id: challenge._id });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ message: "User registered successfully", token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role } });
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

const frontendDistCandidates = [
  path.join(__dirname, "..", "frontend", "dist", "frontend", "browser"),
  path.join(__dirname, "..", "frontend", "dist", "frontend")
];
const frontendDistPath = frontendDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));
const frontendDistExists = Boolean(frontendDistPath);
console.log("Frontend dist path:", frontendDistPath || "not found", "exists:", frontendDistExists);

app.use("/api/budget", budgetRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/government-expenditure", governmentExpenditureRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/approval-authorities", approvalAuthorityRoutes);
app.use("/api/auditlogs", auditLogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/otp", otpRoutes);
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

