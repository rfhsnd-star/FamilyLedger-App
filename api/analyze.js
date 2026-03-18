export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    // This removes any accidental spaces from your key
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API Key missing. Add GEMINI_API_KEY to Vercel Settings." });
    }

    // This is the most stable URL for Gemini 1.5 Flash as of today
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = "Analyze this receipt. Return ONLY JSON. Merchant name, Date, Total amount, and a breakdown of items into these categories: Food, Household, Personal Care, Other. Format: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }],
        // These settings tell the AI to be extra focused on the JSON
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    const data = await response.json();

    // If Google returns an error (like Model Not Found)
    if (data.error) {
      return res.status(500).json({ error: "Google AI says: " + data.error.message });
    }

    // Check if we got the text back
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json(data);
    }

    res.status(500).json({ error: "AI responded but no data was found. Try a clearer photo." });

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
}
