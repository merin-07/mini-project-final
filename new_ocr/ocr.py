import json
from paddleocr import PaddleOCR
from ai_categorizer import categorize_receipt

# 🔹 Change this to your image
IMAGE_PATH = "realbill.jfif"

# Initialize PaddleOCR
ocr = PaddleOCR(lang='en', use_angle_cls=False)


def extract_text_from_image(image_path: str) -> str:
    result = ocr.ocr(image_path)
    extracted_text = []

    for line in result:
        for word_info in line:
            extracted_text.append(word_info[1][0])

    return "\n".join(extracted_text)


if __name__ == "__main__":
    print("\n--- PADDLE OCR OUTPUT ---\n")

    ocr_text = extract_text_from_image(IMAGE_PATH)
    print(ocr_text)

    print("\n--- AI STRUCTURED OUTPUT ---\n")

    result = categorize_receipt(ocr_text)
    print(json.dumps(result, indent=2))
