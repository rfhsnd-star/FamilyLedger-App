export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return res.status(500).json({ error: "Key missing." });

    // This URL asks Google for the list of models you are allowed to use
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "Google Error: " + data.error.message });
    }

    // We extract just the names of the models
    const modelNames = data.models.map(m => m.name.replace('models/', ''));
    
    // Send the list of names back to your phone
    res.status(200).json({ availableModels: modelNames });

  } catch (err) {
    res.status(500).json({ error: "Diagnostic Failed: " + err.message });
  }
}
