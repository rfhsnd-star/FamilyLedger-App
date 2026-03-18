export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) return res.status(500).json({ error: "Key missing." });

    // Using the exact model name from your list!
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this receipt. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }" },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "AI Engine Error: " + data.error.message });
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json({ aiText: data.candidates[0].content.parts[0].text });
    }

    res.status(500).json({ error: "No response from AI." });

  } catch (err) {
    res.status(500).json({ error: "System Error: " + err.message });
  }
}
