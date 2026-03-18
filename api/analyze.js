import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing." });
    }

    // Initialize the tool, but specifically tell it to use "v1" (Stable)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We force the model to use the "latest" stable version
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    }, { apiVersion: 'v1' }); // <--- This is the magic "Stable" fix

    const prompt = "Analyze this receipt. Return ONLY JSON: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    res.status(200).json({ aiText: text });

  } catch (err) {
    console.error(err);
    // This will tell us if Google is blocking the Vercel IP
    res.status(500).json({ error: "Stable Engine Error: " + err.message });
  }
}
