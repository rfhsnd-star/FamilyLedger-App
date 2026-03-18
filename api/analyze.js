export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) return res.status(500).json({ error: "Key missing." });

    // This is the absolute most stable combination for Southeast Asia right now:
    // API Version: v1 (Stable)
    // Model Name: gemini-1.5-flash (Standard)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this receipt. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }" },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      // If 'gemini-1.5-flash' fails, we try 'gemini-pro' as a backup
      return res.status(500).json({ error: "Google Server Message: " + data.error.message });
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json({ aiText: data.candidates[0].content.parts[0].text });
    }

    res.status(500).json({ error: "No response text. Try a clearer photo." });

  } catch (err) {
    res.status(500).json({ error: "System Error: " + err.message });
  }
}
