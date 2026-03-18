export default async function handler(req, res) {
  const { image } = JSON.parse(req.body);
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = "Analyze this receipt image. List the merchant name, date, and total amount. Most importantly, split the items into categories: 'Food', 'Household', 'Personal Care', or 'Other'. Return ONLY JSON format like this: { \"merchant\": \"\", \"total\": 0, \"date\": \"\", \"splits\": [{\"category\": \"\", \"amount\": 0}] }";

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: image } }] }]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
