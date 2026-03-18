import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // THE SEARCH: This part tries to find ANY model that works for your key
    // We try 'gemini-1.5-flash' first, then 'gemini-1.5-pro'
    let modelName = "gemini-1.5-flash"; 
    
    // We try a direct call with the most basic naming convention
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const prompt = "Analyze this receipt. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

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

    // If Flash fails, we try PRO (the bigger brain)
    if (data.error && data.error.code === 404) {
      const proUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
      const proResponse = await fetch(proUrl, {
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
      const proData = await proResponse.json();
      return res.status(200).json(proData);
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: "Diagnostic Error: " + err.message });
  }
}
