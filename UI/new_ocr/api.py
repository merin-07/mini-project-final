from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import base64
import json
from ai_categorizer import categorize_receipt
from ocr import extract_text_from_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    image_base64: str

@app.post("/extract")
async def extract_receipt(req: ExtractRequest):
    temp_file_path = "temp_receipt.jpg"
    try:
        # Decode base64 and save to temp file
        with open(temp_file_path, "wb") as fh:
            fh.write(base64.b64decode(req.image_base64))

        # 1. OCR text extraction
        ocr_text = extract_text_from_image(temp_file_path)
        
        if not ocr_text.strip():
            os.remove(temp_file_path)
            return {"error": "Could not extract any text from image."}

        # 2. AI Categorization
        result = categorize_receipt(ocr_text)

        # Cleanup
        os.remove(temp_file_path)
        return result
    except Exception as e:
        if os.path.exists(temp_file_path):
             os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
