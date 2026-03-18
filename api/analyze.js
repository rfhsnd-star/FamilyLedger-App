export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) return res.status(500).json({ error: "Key missing in Vercel." });

    // Using the most standard, stable URL possible
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: "Analyze this receipt. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }" },
          { inlineData: { mimeType: "image/jpeg", data: image } }
        ]}]
      })
    });

    const data = await response.json();

    // If Google returns an error, we extract the MESSAGE specifically
    if (data.error) {
      return res.status(500).json({ error: data.error.message || "Unknown Google Error" });
    }

    // Check if we got a valid response
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json({ aiText: data.candidates[0].content.parts[0].text });
    }

    res.status(500).json({ error: "AI could not find text in this photo." });

  } catch (err) {
    res.status(500).json({ error: "System Error: " + err.message });
  }
}
