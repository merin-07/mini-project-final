import os
import json
import re
from google import genai
from dotenv import load_dotenv

load_dotenv()

MODEL = "models/gemini-2.5-flash"

CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Utilities",
    "Entertainment",
    "Healthcare",
    "Savings",
    "Rent",
    "Other"
]


def categorize_receipt(ocr_text: str):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are a strict receipt parsing engine.

Extract structured data from the OCR text.

Return ONLY valid JSON in this exact format:

{{
  "merchant": "",
  "date_time": "",
  "items": [
    {{
      "name": "",
      "category": "",
      "price": 0.00
    }}
  ],
  "total": 0.00
}}

STRICT RULES:
- If NO date is present in the receipt, return "" (empty string) for date_time.
- Convert any found date into ISO format YYYY-MM-DD HH:MM:SS.
- DO NOT invent or guess a date.
- Prices must have exactly 2 decimal places.
- Categories must be one of: {CATEGORIES}
- Ignore unrelated receipt metadata.
- Return JSON only.
- No explanations.
- No markdown formatting.

OCR TEXT:
{ocr_text}
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    raw_text = response.text.strip()

    # Remove accidental markdown wrapping
    raw_text = re.sub(r"```json|```", "", raw_text).strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        print("RAW MODEL OUTPUT:")
        print(raw_text)
        raise ValueError("Model did not return valid JSON")

    # 🔒 Extra safety against hallucinated date
    if data.get("date_time"):
        if not re.search(r"\d{4}", data["date_time"]):
         data["date_time"] = ""

    return data


def categorize_manual_item(item_name: str, amount: float):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are a financial assistant.
Categorize this manual expense into one of these categories: {CATEGORIES}

Item: {item_name}
Amount: {amount}

Return ONLY valid JSON in this exact format:
{{
  "item": "{item_name}",
  "amount": {amount},
  "category": ""
}}
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    raw_text = response.text.strip()
    raw_text = re.sub(r"```json|```", "", raw_text).strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        data = {
            "item": item_name,
            "amount": amount,
            "category": "Other"
        }

    return data
