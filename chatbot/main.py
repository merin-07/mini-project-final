import os
import json
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Get API key from .env
API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY)


def finance_chatbot(user_data, question):
    prompt = f"""
You are a financial assistant.

Rules:
- ONLY use the financial data provided below.
- Do NOT invent or hallucinate numbers.
- If the answer cannot be determined from the data, say:
  "I cannot answer that from the provided data."

User Financial Data:
{json.dumps(user_data, indent=2)}

User Question:
{question}

Answer:
"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )

    return response.text


if __name__ == "__main__":

    # Example financial data
    data = {
        "income": 3000,
        "expenses": {
            "Food": 450,
            "Transport": 200,
            "Shopping": 350,
            "Utilities": 150
        }
    }

    while True:
        question = input("\nAsk a finance question (or type 'exit'): ")

        if question.lower() == "exit":
            break

        answer = finance_chatbot(data, question)
        print("\nChatbot:", answer)