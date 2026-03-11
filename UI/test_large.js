const payload = "A".repeat(5 * 1024 * 1024); // 5MB
fetch("http://127.0.0.1:8000/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: payload })
}).then(r => r.json()).then(console.log).catch(console.error);
