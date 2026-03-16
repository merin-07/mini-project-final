import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Database ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, "budget.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salary REAL DEFAULT 0,
    budget REAL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    item TEXT NOT NULL,
    vendor TEXT DEFAULT '',
    description TEXT DEFAULT '',
    type TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const stmt = {
  insertUser: db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"),
  findByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  findById: db.prepare("SELECT id, name, email, salary, budget FROM users WHERE id = ?"),
  updateUser: db.prepare("UPDATE users SET salary = ?, budget = ? WHERE id = ?"),
  insertExpense: db.prepare("INSERT INTO expenses (user_id, date, amount, item, vendor, description, type) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  getExpenses: db.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC"),
  deleteExpense: db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?"),
};

// ── Express ─────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(__dirname));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Handle JSON parse errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  next(err);
});

// ── Auth ────────────────────────────────────────────────────────────────────

app.post("/api/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required." });
    if (stmt.findByEmail.get(email)) return res.status(409).json({ error: "Email already registered." });
    const result = stmt.insertUser.run(name, email, bcrypt.hashSync(password, 10));
    res.json({ id: result.lastInsertRowid, name, email, salary: 0, budget: 0 });
  } catch (e) { console.error(e); res.status(500).json({ error: "Registration failed." }); }
});

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required." });
    const user = stmt.findByEmail.get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: "Invalid email or password." });
    res.json({ id: user.id, name: user.name, email: user.email, salary: user.salary, budget: user.budget });
  } catch (e) { console.error(e); res.status(500).json({ error: "Login failed." }); }
});

app.put("/api/user", (req, res) => {
  try {
    const { userId, salary, budget } = req.body;
    if (!userId || salary == null || budget == null) return res.status(400).json({ error: "Missing fields." });
    stmt.updateUser.run(salary, budget, userId);
    res.json(stmt.findById.get(userId));
  } catch (e) { console.error(e); res.status(500).json({ error: "Update failed." }); }
});

// ── Expenses ────────────────────────────────────────────────────────────────

app.get("/api/expenses/:userId", (req, res) => {
  try { res.json(stmt.getExpenses.all(parseInt(req.params.userId))); }
  catch (e) { console.error(e); res.status(500).json({ error: "Fetch failed." }); }
});

app.post("/api/expenses", (req, res) => {
  try {
    const { userId, expenses } = req.body;
    if (!userId || !Array.isArray(expenses)) return res.status(400).json({ error: "userId and expenses array required." });
    const insert = db.transaction((items) =>
      items.map(e => {
        const r = stmt.insertExpense.run(userId, e.date || new Date().toISOString().split("T")[0], e.amount || 0, e.item || "Other", e.vendor || "", e.description || "", e.type || "manual");
        return { ...e, id: r.lastInsertRowid, user_id: userId };
      })
    );
    res.json({ inserted: insert(expenses) });
  } catch (e) { console.error(e); res.status(500).json({ error: "Save failed." }); }
});

app.delete("/api/expenses/:id", (req, res) => {
  try { stmt.deleteExpense.run(parseInt(req.params.id), req.body.userId); res.json({ success: true }); }
  catch (e) { console.error(e); res.status(500).json({ error: "Delete failed." }); }
});

// ── OCR (Gemini Vision — no Python needed) ──────────────────────────────────

const CATEGORIES = ["Food", "Transport", "Shopping", "Utilities", "Entertainment", "Healthcare", "Savings", "Rent", "Other"];

app.post("/extract", async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ error: "No image data." });

    const base64 = imageData.includes(",") ? imageData.split(",")[1] : imageData;
    const mimeType = imageData.startsWith("data:") ? imageData.split(";")[0].split(":")[1] : "image/jpeg";

    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: { mimeType, data: base64 }
      },
      `You are a receipt/bill parser. Look at this image and extract structured data.

Return ONLY valid JSON:
{
  "merchant": "",
  "date_time": "",
  "items": [{ "name": "", "category": "", "price": 0.00 }],
  "total": 0.00
}

Rules:
- If NO date visible, return "" for date_time
- Convert dates to YYYY-MM-DD HH:MM:SS format
- Prices must have 2 decimal places
- Categories must be one of: ${JSON.stringify(CATEGORIES)}
- Return JSON only, no markdown, no explanation`
    ]);

    let text = result.response.text().trim().replace(/```json|```/g, "").trim();
    const extracted = JSON.parse(text);

    // Safety check on date
    if (extracted.date_time && !/\d{4}/.test(extracted.date_time)) extracted.date_time = "";

    res.json({ extracted });
  } catch (e) {
    console.error("OCR error:", e);
    res.status(500).json({ error: "Extraction failed." });
  }
});

// ── Chatbot ─────────────────────────────────────────────────────────────────

app.post("/chat", async (req, res) => {
  try {
    const { message, expenses } = req.body;
    if (!expenses?.length) return res.json({ reply: "No financial data available." });

    const categoryTotals = {};
    expenses.forEach(e => { categoryTotals[e.item] = (categoryTotals[e.item] || 0) + e.amount; });

    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    const result = await model.generateContent(
      `You are a financial advisor AI. Use ONLY the data below. If info is insufficient, say so.

User Question: ${message}

Financial Data:
${JSON.stringify({ totalSpending: expenses.reduce((s, e) => s + e.amount, 0), expenseCount: expenses.length, categoryBreakdown: categoryTotals }, null, 2)}`
    );

    res.json({ reply: result.response.text() });
  } catch (e) { console.error(e); res.status(500).json({ reply: "Server error." }); }
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(3000, () => {
  console.log("\n  Smart Budget Manager is running!");
  console.log("  Open: http://localhost:3000/Login.html\n");
});
