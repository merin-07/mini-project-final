import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/chat", async (req, res) => {
  try {
    const { message, expenses } = req.body;

    if (!expenses || expenses.length === 0) {
      return res.json({
        reply: "No financial data available to analyze."
      });
    }

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.item] = (categoryTotals[e.item] || 0) + e.amount;
    });

    const topCategory = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])[0];

    const structuredData = {
      totalSpending,
      expenseCount: expenses.length,
      categoryBreakdown: categoryTotals,
      highestSpendingCategory: topCategory
    };

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });

    const prompt = `
You are a financial advisor AI.

Important:
- Use ONLY the provided data below.
- Answer the user's question based on this data.
- If info is insufficient, say so.

User Question:
${message}

Financial Data:
${JSON.stringify(structuredData, null, 2)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error." });
  }
});

app.post("/extract", async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: "No image data provided." });
    }

    // Extract base64 without the data URI prefix
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    // Call the Python FastAPI server
    const response = await fetch("http://127.0.0.1:8000/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: base64Data })
    });

    if (!response.ok) {
      throw new Error(`Python OCR API error: ${response.statusText}`);
    }

    const extracted = await response.json();
    res.json({ extracted });
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: "Extraction failed." });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
