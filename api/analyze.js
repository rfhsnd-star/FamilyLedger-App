export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing." });
    }

    // STABLE URL + LATEST MODEL NAME
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = "Analyze this receipt. List merchant, date, and total. Split items into 'Food', 'Household', 'Personal Care', or 'Other'. Return ONLY a JSON object: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }]
        // We removed 'generationConfig' to avoid "Unknown name" errors
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "AI Error: " + data.error.message });
    }

    // Send the raw response back to the app to clean
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: "System Error: " + err.message });
  }
}
