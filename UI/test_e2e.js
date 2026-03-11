import fs from 'fs';
const imagePath = '../new_ocr/bill.png';
const base64Image = fs.readFileSync(imagePath, 'base64');

fetch("http://localhost:3000/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData: base64Image, mimeType: "image/png" })
}).then(r => r.json()).then(data => {
    console.log(JSON.stringify(data).substring(0, 200));
}).catch(console.error);
