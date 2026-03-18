import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const { image } = JSON.parse(req.body);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing." });
    }

    // Initialize the official Google AI tool
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use 'gemini-1.5-flash' - the library handles the versioning
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Analyze this receipt. List merchant, date, and total. Split items into 'Food', 'Household', 'Personal Care', or 'Other'. Return ONLY a JSON object: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

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

    // Send the text back to the app
    res.status(200).json({ aiText: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Engine Restart Error: " + err.message });
  }
}
