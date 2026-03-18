export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing. Check Vercel Environment Variables." });
    }

    const prompt = "Analyze this receipt. Return ONLY a JSON object. Merchant name, Date, Total amount, and a breakdown of items into these categories: Food, Household, Personal Care, Other. Format: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    // UPDATED URL: Changed 'v1beta' to 'v1' for stability
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
      })
    });

    const data = await response.json();

    // If Google says the model is missing, it's usually a region or version issue
    if (data.error) {
      return res.status(500).json({ error: "Google AI says: " + data.error.message });
    }

    // Check if we got a valid response
    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: "AI could not generate a response. Try a clearer photo." });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
}
