export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing in Vercel. Go to Settings > Environment Variables." });
    }

    const prompt = "Analyze this receipt. Return ONLY JSON. Merchant name, Date, Total amount, and a breakdown of items into these categories: Food, Household, Personal Care, Other. Format: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: image } }] }]
      })
    });

    const data = await response.json();

    // ERROR CHECK: Did Google block it or fail?
    if (!data.candidates || data.candidates.length === 0) {
      const errorMsg = data.error ? data.error.message : "AI could not read this image. Try a clearer photo.";
      return res.status(500).json({ error: errorMsg });
    }

    // SUCCESS: Send the data back
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
}
