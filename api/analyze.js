export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing in Vercel settings." });
    }

    const prompt = "Analyze this receipt. List merchant, date, and total. Split items into 'Food', 'Household', 'Personal Care', or 'Other'. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: image } }] }]
      })
    });

    const data = await response.json();

    // If Google returns an error, send it to the app
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
