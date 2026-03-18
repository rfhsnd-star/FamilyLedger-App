export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing. Please check Vercel Settings." });
    }

    // We will try these names in order until one works
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001"
    ];

    let lastError = "";

    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze this receipt. Return ONLY a JSON object: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }" },
              { inlineData: { mimeType: "image/jpeg", data: image } }
            ]
          }]
        })
      });

      const data = await response.json();

      // If this model name worked, send the data back and STOP the loop
      if (data.candidates && data.candidates[0]) {
        return res.status(200).json(data);
      }

      // If it failed, save the error and try the next name in the list
      lastError = data.error ? data.error.message : "Model not responsive";
      console.log(`Model ${modelName} failed: ${lastError}`);
    }

    // If we tried all names and none worked:
    res.status(500).json({ error: "All AI models failed. Last error: " + lastError });

  } catch (err) {
    res.status(500).json({ error: "Server Error: " + err.message });
  }
}
