export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing." });
    }

    // Using v1beta for the best features (like JSON mode)
    // Using 'gemini-1.5-flash' which is the standard name
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = "Analyze this receipt. List merchant, date, and total. Split items into 'Food', 'Household', 'Personal Care', or 'Other'. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }],
        generationConfig: {
          // We use the camelCase version 'responseMimeType' which works better in v1beta
          responseMimeType: "application/json",
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "AI Error: " + data.error.message });
    }

    // Check for the response text
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json(data);
    }

    res.status(500).json({ error: "No data returned from AI. Try a clearer photo." });

  } catch (err) {
    res.status(500).json({ error: "System Error: " + err.message });
  }
}
