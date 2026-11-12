// Gemini orqali savol tuzadi. Kalit faqat serverda (Vercel env) turadi.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST kerak" });
  const { grade, topic, pass } = req.body || {};
  if (process.env.TEACHER_PASS && pass !== process.env.TEACHER_PASS)
    return res.status(401).json({ error: "Parol noto‘g‘ri" });
  if (!grade || !topic || String(topic).length > 120)
    return res.status(400).json({ error: "grade va topic kerak" });

  const prompt = `O‘zbekiston maktab informatika darsligi dasturi bo‘yicha ${grade}-sinf, "${topic}" mavzusida 8 ta test savoli tuz. O‘zbek tilida (lotin yozuvi), ${grade}-sinf o‘quvchisi darajasida, har birida 4 variant va bitta to‘g‘ri javob. Faqat JSON qaytar: [{"q":"savol","o":["A","B","C","D"],"c":0}], c — to‘g‘ri variant indeksi (0-3), to‘g‘ri javoblar turli o‘rinlarda bo‘lsin.`;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        }),
      }
    );
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: "Gemini javob bermadi", detail: j?.error?.message });
    res.status(200).json({ questions: JSON.parse(text) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
