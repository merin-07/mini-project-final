<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
</p>

# 🧾 Smart Budget Manager

A full-stack personal finance application that combines **AI-powered receipt scanning**, **interactive data visualizations**, and a **financial chatbot** — all in a clean, single-page experience.

---

## ✨ Features

| Feature | Description |
|---|---|
| **📱 GPay Screenshot OCR** | Upload a Google Pay screenshot and let Gemini Vision auto-extract merchant, amount, and date |
| **🧾 Bill / Receipt Scanner** | Upload any receipt image to extract individual line items with prices and categories |
| **💵 Manual Entry** | Quick-add cash expenses with vendor, category, date, and description |
| **📊 Visual Dashboard** | Pie chart for category breakdown + bar chart for monthly spending trends (Chart.js) |
| **📈 Financial Analysis** | Metrics panel showing total spent, average expense, category count, and monthly activity |
| **💬 AI Chatbot** | Ask Gemini questions about your spending patterns and get personalized financial insights |
| **📥 CSV Export** | Download all expense data as a `.csv` file |
| **🔐 User Auth** | Register / Login with bcrypt-hashed passwords |
| **💰 Budget Setup** | Set your monthly salary and spending budget on first sign-up |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Express.js 5, Node.js |
| **Database** | SQLite via `better-sqlite3` (WAL mode) |
| **AI / OCR** | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| **Auth** | `bcryptjs` for password hashing |
| **Frontend** | Vanilla HTML / CSS / JavaScript |
| **Charts** | Chart.js (CDN) |

---

## 📁 Project Structure

```
mini-project-final/
├── start.bat              # One-click launcher (Windows)
├── .gitignore
└── UI/
    ├── server.js           # Express API server (auth, expenses, OCR, chatbot)
    ├── package.json
    ├── .env                # Gemini API key (not committed)
    ├── budget.db           # SQLite database (auto-created, not committed)
    ├── Login.html          # Login page
    ├── Register.html       # Registration page
    ├── salary_budget.html  # Salary & budget setup (post-registration)
    └── budget.html         # Main dashboard (expenses, charts, analysis, chatbot)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher — [download](https://nodejs.org/)
- **Google Gemini API Key** — [get one here](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd mini-project-final
   ```

2. **Install dependencies**
   ```bash
   cd UI
   npm install
   ```

3. **Configure environment**

   Create a `.env` file inside the `UI/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the server**
   ```bash
   node server.js
   ```
   Or on Windows, simply double-click **`start.bat`** from the project root.

5. **Open in browser**
   ```
   http://localhost:3000/Login.html
   ```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Create a new user account |
| `POST` | `/api/login` | Authenticate and log in |
| `PUT` | `/api/user` | Update salary and budget |
| `GET` | `/api/expenses/:userId` | Fetch all expenses for a user |
| `POST` | `/api/expenses` | Add one or more expenses |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `POST` | `/extract` | OCR — extract data from a receipt/bill image |
| `POST` | `/chat` | Send a message to the AI financial chatbot |

---

## 📂 Database Schema

```sql
users
├── id            INTEGER PRIMARY KEY
├── name          TEXT NOT NULL
├── email         TEXT NOT NULL UNIQUE
├── password_hash TEXT NOT NULL
├── salary        REAL DEFAULT 0
└── budget        REAL DEFAULT 0

expenses
├── id          INTEGER PRIMARY KEY
├── user_id     INTEGER (FK → users.id)
├── date        TEXT NOT NULL
├── amount      REAL NOT NULL
├── item        TEXT NOT NULL          -- category (Groceries, Transport, etc.)
├── vendor      TEXT
├── description TEXT
├── type        TEXT                   -- 'manual' | 'gpay' | 'bill'
└── created_at  TEXT
```

---

## 📜 License

This project is licensed under [ISC](https://opensource.org/licenses/ISC).
